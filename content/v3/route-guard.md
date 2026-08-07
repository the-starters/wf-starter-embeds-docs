---
title: "Route Guard"
source: v3/route-guard.js
---

Source: `v3/route-guard.js` (loaded via jsDelivr CDN)

## What it is

The **sitewide protected-route guard**, and the module every other v3 script borrows its
role answer from. [Auth Route](./auth-route-and-redirects.md) only routes at `/login` and
`/auth-route`, so a logged-in member could still reach another role's page by navigating
directly — a Talent session opening `/brand-dashboard`. Installed once sitewide before the
page controllers, this guard closes that gap.

It does one of five things, depending on which of its three page tables claims the current
path:

| Member state | Action |
| --- | --- |
| Logged out on a guarded page | Replace with `/login?next=<current path+query>`, or the page's own logged-out override |
| Mapped member on `/dashboard` | Replace with that member's role-specific home |
| Role allowed on this page | Stay, and set `html[data-route-guard="allowed"]` |
| Role not allowed on this page | Replace with **that member's** own default — never the other role's page |
| Authenticated with no mapped active plan | Stay, with `html[data-route-guard-error="unmapped-plan"]` |
| Active Talent **and** Brand plans | Stay, with `html[data-route-guard-error="conflicting-plan-roles"]` |
| Path in none of the three tables | Nothing at all — not even a Memberstack lookup |

It is a **routing and UX boundary only**. Memberstack gated content, Xano endpoint
authorization, and list/render gating (free-Brand blurred results on `/all-starters`) are
separate, independently enforced layers.

## File structure

```
v3/route-guard.js
```

Install once **sitewide in Site Settings → Head Code**, before `v3/auth-route.js` and
`opportunities-3.0.js`. Do not install it on V2.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/route-guard.js"></script>
```

Sitewide matters even for pages the guard does not protect: `/`, `/login`,
`/starter-login`, and `/sign-up` need it for the member-home bounce, and `/quiz-results`
and `/all-starters` need it for the role bounce.

`opportunities-3.0.js` detects the guard through `html[data-route-guard]` and defers its
own access decisions to it, falling back after two seconds only if the guard never boots.

## Role mapping

Access decisions use **stable Memberstack plan IDs**, never display names. This table is
the source of truth in `v3/ACCESS-MATRIX.md` and is duplicated verbatim into
`auth-route.js` and `opportunities-3.0.js`.

| Stable plan ID | Role | Product label |
| --- | --- | --- |
| `pln_free-plan-f6kn0dxz` | `brand-free` | Logged In - Free / Free Brand |
| `pln_new-paid-plan-463h04ph` | `brand-paid` | Logged In - Paid / Premium Brand |
| `pln_dorxata-test-brand-plan-777r02pa` | `brand-paid` | Test Brand |
| `pln_dorxata-test-free-plan-dvcg0k8o` | `talent` | Freelancer / Starter |

Resolution rules:

- A member with **at least one** known active plan is authorized under that role, even
  when other active plan IDs are unmapped.
- Free Brand **plus** paid Brand is a valid same-family upgrade and resolves to
  `brand-paid`.
- Talent **plus** either Brand role is a cross-family conflict and fails closed with
  `conflicting-plan-roles`.
- A member with no mapped active plan fails closed as `unmapped-plan`.

**Role homes** (`ROLE_DEFAULTS`): `talent` → `/starter-dashboard`, `brand-paid` →
`/brand-dashboard`, `brand-free` → the quiz funnel. A free Brand's home is resolved at
runtime by `brandFreeHome()`: `/quiz-results` once the Memberstack `starter-quiz` custom
field is non-empty, `/quiz` until then.

## Three page tables

Every guarded route belongs to exactly one table, and the difference between them is what
happens to a **logged-out** visitor.

| Table | Logged-out visitor | Wrong-role member |
| --- | --- | --- |
| `PAGE_ROLES` | Sent to `/login?next=` or the page's override | Sent to their role home |
| `MEMBER_BOUNCE_PAGES` | Untouched | Every mapped member is bounced away |
| `ROLE_BOUNCE_PAGES` | Untouched | Sent to their role home |

### Guarded pages (`PAGE_ROLES`)

| Page | Allowed roles |
| --- | --- |
| `/dashboard`, `/dashboard/` | None stay — every mapped role resolves to its own home |
| `/brand-dashboard` | `brand-paid` |
| `/opportunities`, `/opportunities/`, `/opportunities/<slug>` | `brand-paid`, `talent` |
| `/opportunities-brands-view` | `brand-paid` |
| `/opportunities---create` | `brand-paid` |
| `/opportunities-freelancer-view` | `talent` |
| `/messages` | `brand-paid`, `talent` |
| `/favorites`, `/favorites/` | `brand-paid` |
| `/starter-dashboard` | `talent` |
| `/starter-edit-profile` | `talent` |
| `/build-profile/select-profile`, `/build-profile/full-profile`, `/build-profile/consult` | `talent` |
| `/starter-onboarding` | `talent` |
| `/generate-invoice`, `/generate-invoice/` | `talent` |

Trailing-slash twins are listed explicitly wherever no prefix rule catches them, so both
URL forms route identically.

`/dashboard` is the canonical entry point: an empty allowlist means every mapped role is
sent to its own authored dashboard, while `/starter-dashboard` and `/brand-dashboard` stay
as the real page bodies. Point new generic "Dashboard" links at `/dashboard`.

### Member-home bounce pages (`MEMBER_BOUNCE_PAGES`)

`/`, `/login`, `/starter-login`, `/sign-up`. An identified member is redirected away; a
signed-out visitor cannot tell the guard is installed — no redirect, no attribute, no
event. A member with a valid, permitted `?next=` goes there; otherwise their role home.

Two **homepage-only** overrides on `/`, in priority order after a valid `?next=`: a
cancelled paid Brand goes to `/all-starters`, and a free Brand who has not completed the
quiz **stays put** rather than being pushed to `/quiz`.

### Role bounce pages (`ROLE_BOUNCE_PAGES`)

| Page | Roles that stay |
| --- | --- |
| `/quiz-results`, `/quiz-results/` | `brand-free` |
| `/all-starters`, `/all-starters/` | `brand-paid`, `brand-free` |

Both serve pre-signup visitors, which is why they are role-bounce rather than guarded:
a guarded page would force a login. `/all-starters` will never be a guarded page — its
gating is Memberstack gated content on the page plus render-level limiting.

`/quiz-results` carries a **pending-payload exception**. The `starter-quiz` field is
written by `quiz-results.js` *on that page, after it renders*, so a member who just signed
up always reads as not-completed for a moment. `hasReadyPendingQuiz()` also accepts a
`ready` payload in `sessionStorage.starterQuizPending` as "quiz done", so the guard does
not bounce a member off the very page about to save their answers.

`/quiz` is in **none** of the tables: its own controller, `quiz-main/quiz-redirect.js`,
owns it outright.

### Per-page logged-out destinations

A guarded page can opt out of the login form and send logged-out visitors somewhere else:

| Guarded page | Logged-out destination |
| --- | --- |
| `/build-profile/select-profile` | `/` |
| `/build-profile/full-profile` | `/` |
| `/build-profile/consult` | `/` |

`/complete-profile` is **deliberately absent from all three tables**. Memberstack's
`restrict-pages` gated group is its sole gate (URL rule STARTS `complete-profile`, access
"All Members", Access Denied URL `login`); two owners would mean two logged-out
destinations for one URL. Role routing on that page belongs to
[`complete-profile-redirect.js`](./auth-route-and-redirects.md).

## Runtime contract

| Hook | On | Values |
| --- | --- | --- |
| `data-route-guard` | `<html>` | `checking`, `allowed`, `redirecting` |
| `data-route-guard-error` | `<html>` | `unmapped-plan`, `conflicting-plan-roles`, `memberstack-unavailable`, `unexpected-error` |

Events dispatched on `window`:

- `starters:v3-route-guard-allowed` — the route resolved to a stay.
- `starters:v3-route-guard-redirecting` — fired before `location.replace()`.
- `starters:v3-route-guard-error` — carries `detail.code` from the table above.

Give guarded pages an error block keyed by `html[data-route-guard-error]`. Pre-hiding
protected content until `html[data-route-guard="allowed"]` avoids a cross-role flash; it
is recommended but was deliberately deferred, and the staging install runs without it.

## The exported role contract

`window.StartersV3RouteGuard` is the reason this file must load **first**.
`auth-route.js`, `complete-profile-redirect.js`, `build-profile-redirect.js`,
`messages-profile.js`, and `onboarding-tour.js` all read the role from it rather than
keeping a second copy of the plan-ID table. If the guard is missing or loaded late, the
contract reads as unavailable and those modules stay put.

| Member | Purpose |
| --- | --- |
| `release` | The tag that shipped this file's contents |
| `memberRole(member)` / `memberRoleError(member)` / `roleResolution` | The resolved role, or why it could not resolve |
| `activePlanIds(member)` | The member's active plan IDs |
| `roleHome(member)` / `brandFreeHome(member)` | Where this member belongs |
| `hasCompletedQuiz(member)` / `hasReadyPendingQuiz()` | The two quiz signals |
| `hasCancelledPaidBrandPlan(member)` | The homepage cancelled-Brand override |
| `pageRolesFor` / `isGuardedPath` / `redirectTargetFor` | The guarded-page decision |
| `isMemberBouncePage` / `bounceTargetFor` / `loggedOutDestinationFor` / `localPath` | The bounce and logged-out-override decisions |
| `isRoleBouncePage` / `roleBounceRolesFor` / `roleBounceTargetFor` | The role-bounce decision |
| `waitForSharedOpportunitiesAccess` | The merged-feed hydration handoff for opp30 |

`bounceTargetFor` takes `(member, next, pathname)`; pass `'/'` as the third argument to
exercise the homepage overrides from the console.

## Notes & gotchas

- **Install order is the whole contract.** The guard must be the first v3 script on the
  page. Published source must contain one `opportunities-3.0.js` tag with the route-guard
  tag before it.
- **`/dashboard` needs to exist** as a real Webflow utility page with a neutral
  loading/error surface, or the router has nothing to route from.
- An unmapped or conflicted member is **left on the page with an error state**, never
  silently redirected — a plan-configuration problem should be visible, not routed around.
- On the two bounce tables the guard is deliberately **silent** for anonymous visitors:
  those pages must render for signed-out traffic without depending on this script.
- Verify what is actually deployed with `window.StartersV3RouteGuard.release`, or
  `curl … | grep '@release'`. A mismatch against the tag you expect means a stale CDN copy
  — purge it through `purge.jsdelivr.net`.
