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
| `data-opp-page-id` | Binds the numeric Xano opportunity ID on the CMS detail page (see URL identity below). |
| `data-opp-status="active closed"` | Shown only while the opportunity is in one of the named statuses (space-separated, like `data-opp-state`). |
| `data-opp-element="loading-button\|loading-label\|loading-spinner"` + `data-opp-loading` | Loading UI for the Close/Reopen lifecycle controls (see below). |
| `window.Opp30` | `{ API, ensureXanoToken, diagnoseFreelancerFeed, waitForMemberstackDom }`. |

## URL identity: slug labels, ID identity (v1.25.6)

Opportunity detail URLs use the Webflow CMS **slug** as their label, while the immutable
numeric Xano opportunity **ID** stays the API identity. The two are decoupled on purpose: a
brand can retitle an opportunity (new slug) without breaking applications keyed to the ID.

- **Detail page.** Bind the ID to `data-opp-page-id` on the `/opportunities/<slug>` CMS detail
  page. A nonnumeric or missing bound value is **not** inferred from a text slug; the script
  requires an unambiguous ID.
- **Links out of lists.** List and Algolia projections should provide either a same-origin
  `url_path` matching `/opportunities/<slug>` or a `webflow_slug`. Custom-rendered cards can
  expose these as `data-opp-url-path` and `data-opp-webflow-slug`. A card link that already
  points at a valid detail path is preserved; generated links prefer `url_path`, then
  `webflow_slug`, and finally the Xano ID.
- **Backwards compatible.** Existing `/opportunities/<id>` URLs keep working, including detail
  pages that haven't added `data-opp-page-id` yet. V2 opportunity scripts and query-parameter
  URLs are unchanged.

## Lifecycle: status painting and loading states (v1.27.x)

Since **v1.27.0** the brand detail page paints Close/Reopen by the opportunity's status with
**no reload**: `[data-opp-status="active|closed"]` elements toggle with the status, the status
badge (`data-opp-status-badge` / the `status_label` bind) repaints, and a synchronously
injected guard (`#opp30-detail-hide-until-status`) hides the status controls until the real
status resolves, so the wrong button never flashes. `<html>` gets `data-opp-status-ready`
once painted. The script auto-tags the existing modal triggers
(`data-modal-trigger="close-opportunity"` gets `data-opp-status="active"`, the reopen trigger
gets `"closed"` plus `data-opp-submit="reopen"`), so already-published markup keeps working.
A successful Close or Reopen repaints from the mutation response (**v1.27.2**).

While a lifecycle request is pending, the pressed control shows a loading state
(**v1.27.3**):

```html
<div data-opp-element="loading-button" data-opp-loading="false">
  <span data-opp-element="loading-label">Reopen opportunity</span>
  <span data-opp-element="loading-spinner">…</span>
</div>
```

Style the label and spinner off the wrapper's `data-opp-loading="false|true"` **value**;
Webflow does not reliably preserve empty custom attributes, so the hooks are valued on
purpose. While the request is in flight the script sets the value to `true`, adds
`is-wf-xano-mutating`, marks the control `aria-busy` and disabled for assistive technology,
disables any nested native control, and suppresses duplicate clicks. The original state is
restored after an error or a successful repaint.

Two behaviors to keep in mind when authoring:

- **Hiding the label is opt-in.** Only text explicitly tagged
  `data-opp-element="loading-label"` should be hidden by loading CSS; untagged button text
  stays visible while the spinner runs, and the script never adds the label attribute itself.
- **The Close confirmation waits for the request.** The form-flow confirmation
  (`data-close-opp="confirm-button"`) is upgraded to a loading button (cloning the spinner
  from the page-level close trigger when it has none), and the flow advances only after the
  Close request succeeds; an error leaves the confirmation step open and usable.

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
- **v1.26.3 to v1.26.5** hardened the brand actions: opportunity actions keep working after an
  applicant click re-renders the card, the detail view repaints after an edit, and a
  double-submitted Close only sends one request.
- The opt-in loading-label rule (untagged button text stays visible) merged after **v1.27.4**
  and is not in a tag yet; `@latest` serves it once the next tag lands.
- Full behaviour notes live in the file's header and JSDoc, and the conventions doc referenced
  there (`product-workflows/opportunities/docs/wf-js-guide.md` in the workspace).
