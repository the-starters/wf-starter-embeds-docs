---
title: "Starter Onboarding"
source: v3/patch-onboarding-status.js
sources:
  - v3/patch-onboarding-status.js
  - v3/onboarding-done-redirect.js
  - v3/onboarding-profile-preview.js
---

Source: `v3/patch-onboarding-status.js`, `v3/onboarding-done-redirect.js`,
`v3/onboarding-profile-preview.js`

## What it is

The last step of the Talent funnel — `Apply → Build profile → Login → Onboarding →
Dashboard`. Two of these modules own `/starter-onboarding` as a **pair**, and the third
renders the self-preview card on the completion page.

| File | Owns |
| --- | --- |
| `patch-onboarding-status.js` | The post-submit journey: mark done in Xano, then redirect |
| `onboarding-done-redirect.js` | Keeping an already-done member from re-entering the page |
| `onboarding-profile-preview.js` | The freelancer's own profile card on the completion page |

## The `/starter-onboarding` pair

Install **two deferred tags on `/starter-onboarding` and nowhere else**, versioned and
shipped together. Either one alone is a broken half of the flow.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/onboarding-done-redirect.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/patch-onboarding-status.js"></script>
```

Both use the same trade-token flow — the Memberstack JWT from `getMemberCookie()` traded at
`api:g1vmSLWh/auth/trade-token/v3` for a Xano bearer that authorizes the `api:KZf7nFnk`
call. The traded token is memoized for the page and dropped on failure, so a retry re-trades
rather than reusing a token that just failed.

They also share the optional `[data-page-spinner]` element, and neither ever fights the
other over a member: the redirect module runs once on load and never touches the forms; the
patch module owns everything after a submit.

### `patch-onboarding-status.js` — the writing half

When either of the page's two native Webflow forms (full profile and consult — both count as
completing onboarding) reaches its Webflow **success state**, the module runs four beats:

1. Reveal `[data-page-spinner]`.
2. Hide the submitted form's `.w-form` wrapper.
3. `PATCH /starters_onboarding/set_onboarding_status`, setting `onboarding_done = true`.
4. Once that PATCH settles **either way**, `location.replace('/starter-dashboard')`.

The member never reads Webflow's own success message — the loader covers the patch window
instead.

**The redirect fires even when the PATCH gave up.** A member parked behind a hidden form
with no way forward is the one genuinely bad outcome; an unmarked record costs only that the
onboarding page renders again on a later visit. The single exception is a member with no
Memberstack session, who is left exactly where they are.

### `onboarding-done-redirect.js` — the reading half

A member whose Xano freelancer record already carries `onboarding_done === true` is sent to
`/starter-dashboard` with `location.replace()`, so a finished member cannot land back inside
the flow from a bookmark, the back button, or a stale link.

That answer costs a round trip, and until it lands the page is fully visible — so this module
owns `[data-page-spinner]` for the length of its check: **up before the read, down the moment
the answer is "stay"**. When the answer is "go" it is deliberately left up, because the
navigation is already in flight and lowering it would flash the page one last time on the way
out.

### Fail-open, everywhere

Logged out, Memberstack missing or slow, a rejected token trade, an HTTP error, a malformed
envelope, a request timeout, or a loader element that was never built: none of those is
allowed to throw at the page, and none stands between a submit and its redirect. The
accepted cost is one wait — a visitor whose Memberstack never loads sits under the spinner
for the full 8-second budget before it lowers.

A member who should not see this page at all is still handled by
[`route-guard.js`](./route-guard.md), which lists `/starter-onboarding` as Talent-only.

## `onboarding-profile-preview.js` — the self-preview card

Page glue for the wf-xano list on the onboarding completion page ("Your 30-day visibility
boost is already running"). The Designer and structure embed own all markup and CSS; this
module owns exactly one thing: the **`beforeRender` transform**.

### Why a transform is needed

`starters_onboarding/get_freelancers` answers with an **envelope**:
`{"freelancer": [ <one record> ]}`. wf-xano's `normalize()` sees an object rather than an
array and takes its single-object branch, so `items[0]` is the whole body and every plain
`wf-xano-bind="First_Name"` would resolve against the envelope, not the record. The hook
unwraps the record and adds the fields the template binds and Xano does not send:

| Computed field | Derived from |
| --- | --- |
| `Role_1` / `Role_2` / `Role_3` | The first three role display names; extras dropped, each chip hides when empty |
| `Category` | The single Classification value |
| `Location` | `City, State_Province, Country`, empty parts skipped so no orphan commas render |
| `Bio` | The Quill rich-text HTML flattened to one line of plain text |

### One instance per form block

The page runs **one wf-xano instance per form block** (`onboarding-preview-full` and
`onboarding-preview-consult`), because the library binds exactly one template per wrapper and
silently ignores a second. Consequences worth knowing: the state classes land on each **form
block**, so the card CSS matches them as an ancestor; a plain load makes **two** GETs of the
same endpoint (accepted); and any ancestor still carrying wrapper attributes becomes a third
instance that steals the first form's template.

Because the instance keys are no longer fixed, the module arms **by endpoint**: at boot it
registers its hook on every instance whose source contains
`starters_onboarding/get_freelancers` as a **segment prefix**, plus anything still keyed
`onboarding-self-preview`. Prefix, not `endsWith`, because the endpoint name is in flux — the
page currently reads the temporary `get_freelancers_test`. An `endsWith` matcher was a live
blocker: nothing armed, every bind rendered against the raw envelope, and the tell was
`armed 0` with rendered item keys of `["freelancer"]`. It reports `armed N instance(s)` on
staging, which is the fastest check that both forms are wired — a count of 1 means one form
is missing its attributes.

### Form-block switching is not JavaScript

The consult and full blocks carry `wf-xano-if-state="data.items.0.profile_type_30 === consult"`
and `… !== consult` respectively, plus a mandatory `wf-xano-display`, on the same element as
their wrapper attributes. `!== consult` on the full block is what makes it the fallback for
an empty result, a blank field, or a fetch error, since `String(undefined) !== 'consult'` —
`=== full` would show nothing in those cases.

The comparison is case- and whitespace-exact, and stored values are inconsistent (`"full"` on
one record, `"Full"` on another), so the transform **lowercases** `profile_type_30` on the
copied record. That is safe because the field is only a switching key, never displayed; if it
ever needs showing, bind a separate un-normalized field.

### Roles and Category

Role names come from one of two places. A non-empty `roles_resolved` array (the forward path,
with Xano resolving `role_refs` server-side) **wins outright** and is printed verbatim:
trimmed and deduped, but never slug-mapped or de-hyphenated, because a resolved name is
authoritative. Entries may be strings or `{id, name}` objects; junk entries such as bare ids
are skipped.

Otherwise the `Roles` string is parsed with `parseRoles()`, ported verbatim from
`saved-starters-roles.js`. The stored format varies per record — both `;` and `,` are
accepted, after a real member's semicolon-separated roles landed entirely in `Role_1` with
chips 2 and 3 empty. De-hyphenated fallbacks are lowercase, so **the chip's CSS must supply
`text-transform: capitalize`**; entries in the shared `ROLE_NAMES` map carry their own final
casing and are unaffected by it, which is the whole point of the map.

`Category` resolves from `primary_category_ref` — **not** `category_refs[0]`, and
`category_refs` is not used for display. The client reads singular `category_resolved` first,
accepts a plural `categories_resolved` array as a secondary shape, and otherwise falls back to
the legacy `Category` string, de-hyphenating it only when it looks like a slug (hyphens and no
spaces).

Xano's `in` where-clause returns **table order**, not the order of the ids handed to it, so
resolved arrays are re-sorted client-side into the record's ref order whenever entries carry
`id`. `primary_role_ref`, `secondary_role_ref`, and `tertiary_role_ref` are legacy and
deliberately ignored — `role_refs` is both the authoritative list and the ordering source.

### The staging tester

`?ms=<memberstack_id>` renders any member's card, applied through `instance.setParam()` on
**every** armed instance. Because that reloads, a `?ms=` load makes four GETs on a two-form
page. It is honoured on `*.webflow.io`, `localhost`, `127.0.0.1`, and `*.trycloudflare.com`
only — the host predicate is deliberately tighter than the loose one the sibling modules
share, because here it gates a **data read** rather than a `console.warn`, and
`STARTERS_DEBUG` (which may be set in production) must never unlock it.

The endpoint is still public with a hardcoded demo `memberstack_id`; the wiring doc carries
the Xano authentication spec and the two-attribute embed flip, and that flip is required
before the page reaches real members. The `?ms=` tester goes inert on its own at that point,
because the server stops honouring the param.

## Notes & gotchas

- **Never install one half of the page pair without the other.** They ship together on the
  same tag.
- If the preview instance is genuinely absent after boot, the module warns once on staging
  and stays silent in production. The warning earns its place: with no transform the binds
  resolve against the envelope, the template's
  `wf-xano-if="First_Name|Last_Name|Professional_Headline"` guard hides the card, and a
  member with a complete profile sees the empty state.
- Nothing in the preview is ever assigned as HTML — wf-xano's binds write `textContent`, so
  the bio flattener is a formatting concern, not the security boundary. Entity decoding is
  deliberately single-pass: a loop-until-stable decode would turn a literal `&amp;lt;` into
  `<`.
- Script-tag order relative to the wf-xano tag does not matter. The module arms through
  `WfXano.push()`, and also calls `refresh()` when the instance state is already `success` or
  `error` — the one case ordering cannot cover, where an untransformed render is already on
  screen.
