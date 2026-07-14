---
title: "Opportunities 3.0: Core"
source: opportunities-3.0.js
---

Source: `opportunities-3.0.js` (repo root)

## What it is

The shared **Webflow ↔ Xano binder** for the Opportunities 3.0 pages. It wires the existing
3.0 UI (the opportunities pages plus the modals on `/all-modals`) to the authenticated
"Opportunities 3.0" Xano API group, and exposes the core as **`window.Opp30`** for page
controllers like [Opportunities: Create](./opportunities-create.md) to build on.

**Auth model** (the part that most often breaks):

1. Memberstack issues a member JWT on login.
2. The script trades it at `api:g1vmSLWh/auth/trade-token/v3` for a Xano auth token.
3. That Xano token authorizes the opportunities calls at `api:opp30/…`
   (`$auth.id` → `user_v3` → `brands_v3.memberstack_id` / `freelancers_v3.memberstack_id`).

The Xano `user_v3` table must already contain a row whose `memberstack_member_id` matches the
logged-in member, or the trade-token call 404s.

Beyond the API bridge, the core owns:

- **Role switching.** Reveals the `[data-opp-role]` wrapper matching the member's role
  (`talent` | `brand`); both wrappers stay hidden until the role is known so neither flashes.
- **List rendering.** Clones a `[data-opp-card]` template inside `[data-opp-list="<key>"]`
  and fills child `[data-opp-bind="<field>"]` slots; `[data-opp-empty="<key>"]` shows when a
  list is empty, and `[data-opp-state]` / `[data-opp-if]` drive per-card status pills.
- **The freelancer feed.** A wf-algolia browse feed that the core keeps hidden
  (`visibility: hidden` on the results, injected synchronously) until the member's category
  filter is applied, so cards from a previously-signed-in account never flash. Feed health is
  mirrored into `data-opp30-talent-*` attributes on `<html>` for debugging.
- **Detail-page CTA flash prevention.** On `/opportunities/<id>`, a `<style>` tag
  (`#opp30-detail-hide-until-state`) is injected synchronously to hide every `[data-opp-state]`
  CTA (Apply / Applied / Withdraw / Edit) until the member's real applied state resolves from
  the async `starter/opportunities/detail` fetch, so the wrong CTA never flashes. The first
  `paintState()` removes the guard; if that fetch fails the script paints `not-applied` so the
  member is never stranded with no visible action. (Brand-view state elements sit inside the
  async-hidden talent wrapper, so the guard is a no-op for brands.)
- **Apply / edit-application modals.** Cover-letter submission and the success states.
- **Funnel analytics.** Capture points route through the shared
  [PostHog Track](../utils/posthog-track.md) helper.

## File structure

```
opportunities-3.0.js   (repo root, ~1,600 lines)
```

Load **once** per opportunities page via a page (or site) custom-code embed, **after**
`@xano/js-sdk` and Memberstack have loaded (footer). Run-once guard: a second load returns
early once `window.Opp30` exists.

## Main hooks (overview)

| Hook | Purpose |
| --- | --- |
| `data-opp-role="talent\|brand"` | Role-scoped page wrapper; the non-matching one stays hidden. |
| `data-opp-list="<key>"` / `data-opp-card` / `data-opp-bind="<field>"` | List container, card template, and field slots for rendered Xano data. |
| `data-opp-empty="<key>"` | Empty-state element for a list. |
| `data-opp-state="applied edited …"` | Shown only while the card/root is in one of the named states. |
| `data-opp-if="status === '…'"` | Status-pill conditions on cards. |
| `data-opp-filter` | Optional `<select>` filtering the brand list by status (Active, Pending Review, Closed). |
| `data-opp-detail-link` | Card link wired to the detail view. |
| `data-opp-talent-tab` | Talent feed tab controls (all vs applied). |
| `window.Opp30` | `{ API, ensureXanoToken, diagnoseFreelancerFeed, waitForMemberstackDom }`. |

## Notes & gotchas

- `Opp30.diagnoseFreelancerFeed()` (run it in the console) reports feed health: script tags
  found, wf-algolia state, category refs, leftover filter attributes. It is the first stop
  when the talent feed shows nothing.
- The `DEBUG_LOG` flag at the top of the file controls the verbose `[opp30]` console logging.
- `/opportunities-freelancer-view` must be wired as a **wf-algolia browse feed**; the legacy
  CMS-list markup is detected and warned about, not rendered.
- The core and the create controller share run-once flags, so loading both on one page never
  double-binds the create form.
- **Category prefill is case/whitespace-tolerant.** Incoming values on the `opp30:set-category-values`
  event (e.g. an opportunity's saved `category_names` on the edit-opportunity modal) are
  canonicalized against the option labels, deduped, and capped at `MAX_CATEGORY_SELECTIONS` (3)
  — so a saved value that differs only in case or trailing whitespace still selects, mirroring a
  manual option click. This fixes the edit-opportunity category prefill.
- **Edit-opportunity submits with no reload.** The edit-opportunity modal's `[data-opp-submit="update"]`
  control lives inside a Webflow `.w-form`, whose native submit is suppressed in the capture
  phase (same technique as the create page) so Webflow's own inline toast / reload never fires.
  On success the form is swapped for the modal's native `.w-form-done` "pending for review"
  screen. The modal-reopen rewind (which resets that success screen back to the form) covers the
  apply, edit-application, **and** edit-opportunity modals via the `SUCCESS_SCREEN_MODALS` set.
- Full behaviour notes live in the file's header and JSDoc, and the conventions doc referenced
  there (`product-workflows/opportunities/docs/wf-js-guide.md` in the workspace).
