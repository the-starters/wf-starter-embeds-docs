---
title: "Auth Route & Funnel Redirects"
source: v3/auth-route.js
sources:
  - v3/auth-route.js
  - v3/complete-profile-redirect.js
  - v3/brand-profile-redirect.js
  - v3/build-profile-redirect.js
  - build-profile-draft-identity-guard.js
---

Source: `v3/auth-route.js`, `v3/complete-profile-redirect.js`,
`v3/brand-profile-redirect.js`, `v3/build-profile-redirect.js`,
`build-profile-draft-identity-guard.js`

## What it is

Four redirect modules that answer one question in different places: **where does this
member belong right now?** `auth-route.js` answers it once, at login, on the page every V3
login passes through. The other three answer it on page entry, for a member who arrived
from a bookmark, the back button, a stale email link, or a marketing CTA — cases a
login-time check can never cover. A fifth companion,
[`build-profile-draft-identity-guard.js`](#build-profile-draft-identity-guardjs--member-scoped-draft-storage),
scopes the Build-profile wizard's legacy localStorage draft to the current member.

All four redirect modules read their **role** from the [route guard's](./route-guard.md)
exported contract rather than a second copy of the plan-ID table, so all four must load
**after** `v3/route-guard.js`. All four **fail open**: only a positive, unambiguous answer
redirects. This is funnel UX, never a security boundary.

## The two funnels

```
Talent   Apply → Build profile → Login → Onboarding → Dashboard
Brand    Sign up → (paid) Complete profile → Dashboard
```

Both read a lean, no-input Xano status endpoint. The member is derived from the bearer
token traded from the Memberstack JWT, so neither ever sends a client-supplied member id.

| Endpoint (`api:KZf7nFnk`) | Returns | Read by |
| --- | --- | --- |
| `GET /starters_onboarding/get_build_profile_status` | `{has_record, build_profile_done, onboarding_done, profile_type, platform_status}` | `auth-route.js`, `build-profile-redirect.js` |
| `GET /starters_onboarding/get_brand_profile_status` | `{has_record, brand_profile_done}` | `auth-route.js`, `complete-profile-redirect.js`, `brand-profile-redirect.js` |

## `auth-route.js` — the login router

Install on `/login`, `/starter-login`, and `/auth-route` — **and nowhere else**. Not on
`/sign-up`: [`starters-ms-redirect.js`](./accounts-and-forms.md) owns signup-form
redirects, and configuring this router there would set the `redirect` attribute first and
silently disable that marker system.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/auth-route.js"></script>
```

On the two login pages it rewrites each V3 login form's redirect to `/auth-route` — setting
both `data-ms-redirect` and a plain `redirect` attribute, because Memberstack only picks up
`data-ms-redirect` from a click listener and an Enter-key submit would otherwise skip
`/auth-route` and fall through to the shared plan redirect. Keeping the shared Memberstack
plan redirects unchanged is what lets V2 keep its existing behaviour.

On `/auth-route` it routes. Base destinations are the role homes from the guard contract; a
stored or query `?next=` is restored when it is same-origin and allowed for that role.

**Talent** logins additionally fork on funnel position:

| `get_build_profile_status` | Destination |
| --- | --- |
| `build_profile_done` false | `/build-profile/select-profile` |
| done, `onboarding_done` not true | `/starter-onboarding` — **wins over any `next`** |
| done and onboarded | The normal `next` / role-home routing |

**Paid Brands** cost a Xano call too, as of 2026-08-06. Scope is `brand-paid` and nothing
else: `brand-free` has no `/complete-profile` form to finish and unmapped members have no
funnel, so both remain zero-network logins.

| `get_brand_profile_status` | Destination |
| --- | --- |
| `has_record` true **and** `brand_profile_done` false | `/complete-profile` — **wins over any `next`** |
| Anything else, including `has_record` false | The normal `next` / role-home routing |

A member who just submitted the Brand form is answered from the `sessionStorage` marker
with **no network call at all** (see below).

The whole funnel check runs on a single **4-second budget** and fails open on every other
outcome — logged out of Xano, a rejected trade, an HTTP error, a malformed body, or the
budget expiring.

### Error contract

The utility page stays visible and receives `html[data-auth-route-error]`:

| Value | Meaning |
| --- | --- |
| `unmapped-plan` | No active mapped plan |
| `conflicting-plan-roles` | Active Talent **and** Brand roles |
| `role-contract-unavailable` | The route guard's contract is missing or loaded too late |
| `memberstack-unavailable` | Memberstack did not appear within 10 seconds |
| `unexpected-error` | Member lookup or routing failed unexpectedly |

Each also dispatches `starters:v3-auth-route-error` on `window` with `detail.code`. The
funnel check never produces one of these — it fails open instead. Console diagnostics live
on `window.StartersV3AuthRouter`.

## The Brand profile-completion loop

Two modules form a closed loop around `/complete-profile`, and it only stays closed because
**both halves answer from the same signal**.

| Module | Sits on | Sends a member |
| --- | --- | --- |
| `complete-profile-redirect.js` | `/complete-profile` | **out**, when they are done or on the wrong page for their role |
| `brand-profile-redirect.js` | The Brand platform pages | **in**, when they have an unfinished Brand record |

The UX chrome on the form itself — the in-page back button and the submit spinner
(`complete-profile-back.js`, `complete-profile-loader.js`) — lives in
[Accounts & Forms](./accounts-and-forms.md). Neither participates in the routing contract
below: they share no state with these two modules, make no network call, and keep their own
storage key.

### Completion is read from Xano, not from the Memberstack field

Until the 2026-08-06 release the outbound half read the Memberstack custom field
`completed-brand-profile` off the member object the guard had already resolved. That cost
nothing but broke the **same-signal rule**: the inbound check reads Xano, so the two halves
of one loop answered from two sources. The field lands in Memberstack immediately and the
webhook mirror into `brands_v3.brand_profile_done` lands seconds later — and in between, a
fresh completer ping-ponged between the form and the dashboard.

Both halves now read `get_brand_profile_status`. The Memberstack field is **still written**
by [`brand-account-controller.js`](./accounts-and-forms.md) — it feeds Xano endpoint
#1513's stamp — but nothing routes on it anymore.

> The repo's `v3/README.md` still describes the old field-based behaviour in its
> "Complete-profile role routing" section. The JavaScript source and
> `BRAND-PROFILE-REDIRECT-WIRING.md` are correct; that README section is stale.

### The `sessionStorage` marker

`thestarters:v3-brand-profile-completed` bridges the webhook's catch-up window.
`brand-account-controller.js` stamps it the moment its durable completion write resolves,
and a non-empty value is read as **done with no network call at all** by all three readers
(`complete-profile-redirect`, `brand-profile-redirect`, `auth-route`).

It is deliberately `sessionStorage` and deliberately **never cleared** by any reader: it
dies with the tab, by which time Xano answers for itself. Every access is wrapped, because
Safari private mode throws on the property itself, and a storage failure costs only one
fail-open Xano read. A string counts once trimmed non-empty; a non-string truthy value
counts as set.

### `complete-profile-redirect.js` — the outbound half

Install one deferred tag on `/complete-profile` only, after the route guard. Never on a
destination page.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/complete-profile-redirect.js"></script>
```

The page is a paid-Brand form, so only a paid Brand who has not finished it has a reason to
be there:

| Member | Outcome |
| --- | --- |
| Paid Brand, marker in `sessionStorage` | `/brand-dashboard`, no network call |
| Paid Brand, Xano `brand_profile_done` true | `/brand-dashboard` |
| Paid Brand, `has_record` true and `brand_profile_done` false | **Stay** — this is who the page is for |
| Paid Brand, any inconclusive Xano answer | **Stay** |
| Free Brand | The guard's `brandFreeHome()`: `/quiz-results` once `starter-quiz` is set, else `/quiz` |
| Talent | `/starter-dashboard` |
| Logged out, no role contract, unmapped, conflicted | **Stay** |

The free-Brand and Talent branches exist because those members used to be stranded on a
form they can neither fill in nor submit, with no way out but a manual trip to `/login` for
the guard's bounce. Both branches are **zero network** — the destinations come from the
guard contract already in memory. Only the paid-Brand branch spends a round trip, and only
when the marker is absent.

Because those role branches need a logged-in member of *any* role to be able to load the
page, the Memberstack `restrict-pages` group for `/complete-profile` must be set to access
**All Members**. Memberstack still owns the logged-out kick.

In practice this branch forwards almost everybody: every Brand that existed before the
funnel shipped is grandfathered `brand_profile_done: true` in `brands_v3`, so only a new
signup who has not submitted the form yet stays.

`window.StartersCompleteProfileRedirect` exposes the decision helpers and `markerKey` for
console checks. Budgets: Memberstack 8s, the Xano status read 4s.

### `brand-profile-redirect.js` — the inbound half

Install a deferred tag on each in-scope page, or sitewide — out-of-scope paths exit
immediately. It must load after `v3/route-guard.js`.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/brand-profile-redirect.js"></script>
```

In scope (exact path plus trailing-slash twin, plus `/opportunities/<slug>`):
`/brand-dashboard`, `/opportunities`, `/all-starters`, `/messages`, `/starter-dashboard`,
`/dashboard`.

| Signal | Outcome |
| --- | --- |
| `sessionStorage` marker set | **Stay**, and do not call Xano |
| `has_record` true, `brand_profile_done` false | `/complete-profile` |
| `has_record` true, `brand_profile_done` true | **Stay** — the normal dashboard |
| `has_record` false, any `done` value | **Stay** |
| Logged out, Memberstack absent or slow | **Stay** |
| Trade failed, HTTP error, malformed, timed out | **Stay** |

Exactly one shape redirects. It is paid-Brand-only in effect without a role check of its
own: Talent and free Brands get `has_record: false` from the endpoint and stay.

This module owns the shared optional `[data-page-spinner]` element for the length of its
check — up before the read, down the moment the answer is "stay". When the answer is "go"
the spinner is deliberately **left up**, because the navigation is already in flight and
lowering it would flash the dashboard one last time on the way out. A page with no spinner
decides identically, minus the cover. The accepted cost of the fail-open rule: a visitor
whose Memberstack never loads sits under the spinner for the full 8-second budget.

Pin `@v1.59.116` or newer; earlier tags do not contain this file.

## `build-profile-redirect.js` — the Talent funnel-position check

Install one deferred tag on each of the three Build-profile pages, after the route guard,
and nowhere else.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/build-profile-redirect.js"></script>
```

Pages: `/build-profile/select-profile`, `/build-profile/full-profile`,
`/build-profile/consult` — the same three Talent-only entries the route guard lists, with
no trailing-slash twins, because Webflow serves these normalized.

| `get_build_profile_status` | Outcome |
| --- | --- |
| `build_profile_done` false | **Stay** — this is who the page is for |
| Done, not onboarded | `/starter-onboarding` |
| Done and onboarded | `/starter-dashboard` |

Role scope is Talent only, read from the guard contract; a Brand, unmapped, or logged-out
visitor costs no Xano round trip because the guard has already handled them. Everything
else fails open on a **4-second** overall budget with a shared `AbortController`.

### Why `build_profile_done` and not "a row exists"

`build_profile_done` requires a `freelancers_v3` row **and** a non-empty `profile_type_30`
— the column the Build-profile submit is what stamps. It replaced a plain row-exists test
on 2026-08-04 because the row is created *before* the member finishes the form: **282 of
955 rows carry an empty `profile_type_30`**, and every one of those members was being
pushed out of a step they had never completed. `onboarding_done` is true on zero rows
today, which leaves the `/starter-dashboard` leg unexercised by production data.

## `build-profile-draft-identity-guard.js` — member-scoped draft storage

Full Profile and Consult still use the legacy `build_profile` localStorage key in their
authored Webflow code. A browser can host sequential Memberstack sessions, so that unscoped
key must never be readable or writable until the current stable member ID is known. This
guard (repo root, **VERSION `1.0.0`**) preserves the legacy page contract while routing it
to the physical key `ts:build_profile:member:<id>`.

**Load synchronously in the page head, before the authored form scripts — no `defer`.**

```html
<script src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/build-profile-draft-identity-guard.js"></script>
```

Until identity resolves, legacy reads return `null`. Any load-time draft restore must
therefore run through `window.waitForMember(cb)` (also exposed on the frozen guard), so the
first legacy read inside the callback already sees the member-scoped draft. The guard
dispatches `ts:build-profile-draft-identity` when resolution finishes, and boots behind
`window.__TS_BUILD_PROFILE_DRAFT_GUARD__`.

## Notes & gotchas

- **Load order is not optional.** All four modules read
  `window.StartersV3RouteGuard`; if it is missing or late, the role reads as unavailable
  and they stay put. The guard is sitewide head code, so a page-level body or head embed
  satisfies the order.
- **The plumbing is duplicated on purpose.** Each browser-facing script is dropped into a
  Webflow page on its own and must stand alone, so the trade-token flow, host allowlist,
  and marker semantics are copied rather than shared.
- **Pin the embeds to the same tag** as the route-guard release they shipped with.
- Each module exposes a `window.Starters…` object whose `release` property should match the
  `@release` line in the served file. A mismatch means a stale CDN copy.
