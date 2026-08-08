---
title: "Opportunities 3.0: Core"
source: opportunities-3.0.js
---

Source: `opportunities-3.0.js` (repo root)

## What it is

The shared **Webflow ↔ Xano binder** for the Opportunities 3.0 pages. It wires the existing
3.0 UI (the opportunities pages, the merged `/opportunities` feed, the `/starter-dashboard`
opportunity sections, and the modals on `/all-modals`) to the authenticated "Opportunities 3.0"
Xano API group, and exposes the core as **`window.Opp30`** for page controllers like
[Opportunities: Create](./opportunities-create.md) to build on.

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
- **Project dashboard actions.** Contract / End / Review controls on brand and
  starter project cards (see [Project dashboard actions](#project-dashboard-actions)).
- **Generate Invoice.** The Starter dashboard's invoice modal against Xano
  `invoices/create/v3` (see [Generate Invoice](#generate-invoice)).
- **Funnel analytics.** Capture points route through the shared
  [PostHog Track](../utils/posthog-track.md) helper.

## File structure

```
opportunities-3.0.js   (repo root, ~3,470 lines)
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
| `data-opp-talent-tab="all\|applied"` | Talent feed tab controls (see [Starter matching](#starter-matching-and-the-applied-tab)). Do not also make them wf-algolia filter controls; the binder removes conflicting filter attributes. |
| `data-opp-page-id` | Binds the numeric Xano opportunity ID on the CMS detail page (see URL identity below). |
| `data-opp-status="active closed"` | Shown only while the opportunity is in one of the named statuses (space-separated, like `data-opp-state`). |
| `data-opp-element="loading-button\|loading-label\|loading-hide\|loading-spinner"` + `data-opp-loading` | Loading UI for the Close/Reopen lifecycle controls (see below). |
| `window.Opp30` | `{ API, ensureXanoToken, diagnoseFreelancerFeed, waitForMemberstackDom, … }` — plus the guard, merged-feed, and matching diagnostics listed in their sections below. |

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
  <span data-opp-element="loading-hide">Optional helper or icon</span>
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

- **Hiding authored content is opt-in** (**v1.27.5**). Use `data-opp-element="loading-label"`
  for the button label and `data-opp-element="loading-hide"` for any other child — an icon,
  helper text — that should become invisible while loading (**v1.38.2**). Both use
  `visibility: hidden` so the button keeps its dimensions. Untagged button content stays visible
  while the spinner runs, and the script never adds either attribute itself.
- **The Close confirmation waits for the request.** The form-flow confirmation
  (`data-close-opp="confirm-button"`) is upgraded to a loading button (cloning the spinner
  from the page-level close trigger when it has none), and the flow advances only after the
  Close request succeeds; an error leaves the confirmation step open and usable.

## The merged `/opportunities` feed

The exact `/opportunities` and `/opportunities/` paths serve **one page** for both the Talent and
the paid-Brand feeds. Keep each role's section inside `[data-opp-role="talent"]` or
`[data-opp-role="brand"]`, and add this anti-flash rule to the page head:

```html
<style>
  html:not([data-opp-role-resolved]) [data-opp-role] {
    display: none;
  }
</style>
```

Both role sections must contain their own `[wf-xano-element="wrapper"][wf-xano-defer="true"]`
feed root, and the page needs **wf-xano v0.28.0 or newer**. Neither root fetches during
wf-xano's automatic boot. Once the stable Memberstack plan resolves, the controller reveals the
allowed wrapper, stamps `html[data-opp-role-resolved]`, and activates only that wrapper's root
through the race-safe `window.WfXano` pre-load queue — **the wrong-role feed is never
initialized**, so it costs nothing and can never flash.

**One navbar, one attribute.** The merged page keeps exactly one native Webflow `Navbar v2`
component. When the role resolves, the controller changes only the root's existing
`data-preview-nav` value (`freelancer` for Talent, `brand` for paid Brand);
`navbar-embeds/navlinks.css` owns descendant visibility. The controller never clones a navbar,
generates navbar HTML, or paints visibility inline. Because Webflow can restore a component
property's authored value after the first resolve, a `MutationObserver` watches
`data-preview-nav` and component DOM replacements and re-applies the resolved role. Keep
`navlinks.css` published with that component: its merged-feed selectors key off the deferred
role-wrapper signature, so they leave `/opportunities/<slug>` detail pages alone.

**Load `v3/route-guard.js` sitewide, before this script.** The merged route allows Talent and
paid Brand, rejects free Brands, and guards both the bare and trailing-slash forms. The
controller waits for the guard to report `allowed` before it evaluates Memberstack role state;
guard errors and redirects leave both feeds hidden. Two two-second budgets absorb hydration
races: the guard polls for a partially hydrated lower Brand Free connection to be replaced by an
allowed role, and the controller polls Memberstack when the first authenticated snapshot has no
`planConnections` (it does **not** retry a non-empty but unmapped snapshot). If a configured
guard never boots and no mapped role appears, the page stays hidden with
`html[data-route-guard-error="member-role-unavailable"]` rather than redirecting to `/`; installs
with no authored guard keep the legacy redirect. The legacy
`/opportunities-freelancer-view` and `/opportunities-brands-view` boot branches remain supported
separately.

Diagnostics: `window.Opp30.routeGuardActive`, `routeGuardConfigured`,
`waitForRouteGuardHandoff`, `waitForMappedMemberRole`, `initMergedOppFeed`,
`syncMergedNavbarRole`, and `activateDeferredFeed`.

## Foreign-brand detail redirect

For a paid Brand, opportunity detail stays **owner-scoped after** the role-level route guard
succeeds. Both `/opportunities/<slug>` and the legacy
`/opportunities-details---brand-view?opp=<id>` entry point probe the authenticated brand's
applicant list:

| Response | Outcome |
| --- | --- |
| `403` / `404` | Redirect to `/opportunities-brands-view` — this brand does not own it. |
| `5xx`, transient, or network failure | **No redirect** — an outage must never bounce the actual owner. |

Xano remains the authorization boundary; this is UX. For console checks,
`window.Opp30.redirectForeignBrandToFeed(error)` applies the same status policy and returns
whether it redirected.

## Close-modal title isolation (v1.59.111)

The Close modal's shared nav header may sit **outside** the form-flow steps. Author its
confirmation title with `data-opp-status="active"` and its success title with
`data-opp-status="closed"` inside the modal's `.modal_nav` bar. At runtime the script upgrades
those legacy status twins to a **modal-local** `data-close-opp-title="confirm|success"` contract.

That indirection is the point: the Close modal is shared by the whole brand list, so treating its
titles as document-level opportunity status made one card's outcome repaint the header for every
other. Opening the modal always restores the confirmation title, and only a successful Close
mutation reveals the success title.

The Withdraw Application modal (`data-modal-target="cancel-application"`) has the same
outside-the-steps header and the same shape, using the talent-state vocabulary instead:
`data-opp-state="applied edited"` for the confirmation title and `data-opp-state="not-applied"`
for the success title.

```sh
node --test opportunities-close-modal-title.test.js
```

## Project dashboard actions

The same file also wires the **Contract**, **End**, and **Review** controls on brand and
starter project cards. The workflow binds only on the dashboard project lists
(`wf-xano-instance="dash-brand-projects"` / `dash-projects`) and only when the path is
`/brand-dashboard` or `/starter-dashboard`. Elsewhere the selectors stay inert.

Cards are `.project_item[data-wf-xano-id]`. The script strips legacy `wf-xano-link` values
and stamps stable `data-project-action` hooks so the Designer can keep either markup style.

| Action | Author as | Runtime stamp |
| --- | --- | --- |
| Contract | `a[href="#contract"]` or `[data-project-action="contract"]` | `data-project-action="contract"` |
| End | `[wf-xano-link="project-end"]` or `[data-project-action="end"]` | strips `wf-xano-link`, stamps `data-project-action="end"` |
| Review | `[wf-xano-link="review_starter"]` or `[data-project-action="review"]` | strips `wf-xano-link`, stamps `data-project-action="review"` and `href="#review-starter"` |

### Lifecycle and visibility

Lifecycle resolution prefers `project.status === 'pending'` over a finer
`lifecycle_state` — pending wins, because cancel is authorized from that phase even when
the lifecycle column has already moved ahead.

| Control | Shown when |
| --- | --- |
| Contract | `pandadoc_document_id` is present **and** `contract_status` is one of `sent`, `viewed`, or `partial` |
| End | Lifecycle is **not** a terminal state (`completed`, `terminated`, `canceled`, `cancelled`) |
| Review | Brand role only, and the project is `review_eligible` with no existing review |

Completed contracts use a separate protected-PDF delivery path; the recipient view/sign
session used here does not cover that case.

The End label follows lifecycle state:

| State | Label |
| --- | --- |
| `pending` | Cancel Project |
| `completion_requested` | Confirm Completion |
| `termination_requested` | Confirm End |
| anything else (non-terminal) | End Project |

Action feedback lands on the control's `.button_main-wrap` (or the control itself) as
`data-project-action-result="success|error"`, then clears after a short timeout.

Invoice remains a separate flow — see [Generate Invoice](#generate-invoice).

## Generate Invoice

The same file drives the Webflow-authored **Generate Invoice** modal used by the
`/starter-dashboard` project list. The delegation is armed **once per page** and stays inert
wherever that modal and its project cards are not authored. It binds only existing elements,
generates no markup, and does **not** touch the V2 Airtable/Make invoice chain — the browser
holds no Airtable or Make credentials.

Author the invoice control on each project card as `data-project-action="invoice"` (a plain
`a[href="#generate-invoice"]` is also accepted), **inside** the card element that already
carries the wf-xano row id `data-wf-xano-id`. That id **is** the `project_id` the invoice
bills, so a control outside a card cannot start the flow: the click is left to `modal.js`'s
own trigger delegation and the mismatch is logged.

The dialog stays the native `dialog[data-modal-target="generate-invoice"]` component, opened
through `window.lumos.modal`'s registry so its paused GSAP entrance timeline, scroll lock, and
focus restore all still run. A direct `showModal()` remains only as a fallback for pages
without `modal.js`.

### Submitting

The modal keeps its authored Webflow form; `Amount` and `Description` are resolved by id or
input name. The amount is rounded to cents and must land between **$0.01 and $1,000,000**,
otherwise the inline message `Enter an amount between $0.01 and $1,000,000.` is shown and
nothing is sent. A submit from a modal that was opened **without** a project card fails closed
with `Open Generate Invoice from the project you want to bill, so we know which project to
invoice.`

A valid submit posts `project_id`, `amount`, `description`, and `idempotency_key` to
`POST invoices/create/v3` through the same authenticated Memberstack → Xano bridge as the rest
of the file. The key (`invoice-v3-<project_id>-<uuid>`) is stored on the form so a retry after
a failure reuses it, and is cleared once an invoice is created. The submit control is disabled
while the request is in flight. After a success the wf-xano project list is refreshed
best-effort — **a failed refresh never reports a created invoice as failed.**

### Markup contract

| Hook | Purpose |
| --- | --- |
| `[data-wf-invoice-bind]` with value `brand`, `project`, `amount`, or `status` | Receive the billed brand, project title, formatted amount, and returned status (`unpaid` when the response omits one). Brand and project come from the card's usual field binds: `title`, plus the first present of `brand`, `company`, and `company_name`, with the last segment of a pipe-separated `heading_display` heading as the only fallback |
| `[data-wf-invoice="payment-link"]` | The pay CTA. Author it as the anchor whose placeholder href is `#invoice-payment-link`; the script stamps this attribute on first use and rewrites the href to the Stripe payment link, opened in a new tab |
| `[data-wf-invoice="error"]` | Error block; the Webflow `.w-form-fail` block is accepted instead |
| `[data-wf-invoice="error-message"]` | Optional text node inside the error block |

The pay CTA's `.button_main-wrap` wrapper is **hidden** when the response carries no payment
link, so the success screen never shows a dead button, and reopening the modal restores the
placeholder href so a stale Stripe link is never left behind the button for a later invoice.
With **neither** error hook present a failure is only a console warning — invisible to the
member — so author one.

A Xano refusal for a Talent member with no connected Stripe account is translated into the
actionable message `Connect your Stripe account from the dashboard before generating
invoices.` The connect flow itself is owned by
[`starter-dashboard-stripe-connect.js`](../v3/dashboards.md).

The sitewide [route guard](../v3/route-guard.md) already lists `/generate-invoice` (and its
trailing-slash twin) as a `talent` page. That guarded page and this modal coexist: the guard
protects the standalone route, while the dashboard flow never leaves the project list.

Run the focused invoice regressions with:

```sh
node --test opportunities-3.0-auth.test.js
```

## Starter matching and the Applied tab

The starter feed's **All** tab reads the authenticated `starter/profile/match-context` response
and applies its positive `category_refs` values to Algolia. Results stay hidden while filter
changes are in flight, and a response is shown only when its facet filters match the requested
tab — that is what prevents an unfiltered or stale feed from flashing.

The **Applied** tab is historical member state, not another category match: it filters Algolia by
the opportunity IDs from the starter's Applied list and **removes** the `category_refs` filter,
so an application stays discoverable after the starter changes or removes profile categories.
Returning to All restores the current category filter.

If the match context has no valid positive category refs, All stays collapsed and the existing
`[wf-algolia-element="no-results"]` state becomes a **Complete profile** prompt linking to
`/starter-edit-profile`; the script never exposes the unfiltered feed. On `/starter-dashboard`
that prompt is painted only into `[wf-xano-instance="dash-applied-opps"] [wf-xano-element="empty"]`,
so existing applied cards are unaffected. A Memberstack account change clears the cached Xano
token, match context, applied IDs, and Algolia results, and in-flight requests reject with
`MEMBER_SCOPE_CHANGED` rather than returning the previous member's data.

Markup this feed needs: `[wf-algolia-element="browse"]`, `["results"]`, `["template"]`, and
`["no-results"]`, with rendered cards exposing `data-wf-algolia-hit-objectid`; the dashboard
applied list keeps `wf-xano-instance="dash-applied-opps"` and its `wf-xano-element="empty"`
descendant. Rollout diagnostics live on the root: `data-opp30-talent-tab`,
`data-opp30-talent-algolia`, `data-opp30-talent-category-count`,
`data-opp30-talent-category-refs`, `data-opp30-profile-categories="missing"`, and
`data-opp30-dashboard-match` (`ready` | `profile-incomplete` | `error`).

### Matching QA mode

Append `?opp_debug=1` to `/starter-dashboard`, `/opportunities`, or
`/opportunities-freelancer-view` to load the shared, authenticated matching QA panel. `1`, `true`,
`yes`, and `on` are accepted case-insensitively; anything else leaves QA mode off. While enabled,
`data-opp30-match-debug` on the document root reports `loading`, `pass`, `check`, or `error`.

**Normal visitors pay nothing.** The production binder lazy-loads `opportunities-3.0-debug.js`,
which then loads `lil-gui@0.21.0`; neither script, the library, nor the extra Xano reads run
without the parameter. Same-origin dashboard links to either feed (including View all) keep the
parameter so one session can inspect both surfaces.

The panel pages through the Active opportunity set and reconciles it independently, checking the
equation `matching + applied - overlap = unique visible`. Loading is capped at 100 pages of 100;
an incomplete Active set changes the status to `CHECK`, as does any disagreement between Xano's
`available_matching_total` / `itemsTotal` and the QA counts. **Floating card labels** annotate
cards in the dashboard list and the live `[wf-xano-instance="talent-opps"]` feed with their
categories, overlap, applied state, and why they are visible; panel filters only hide and show
already-rendered cards and never change the production query.

The structured result is at `window.Opp30MatchDebug.data`, or regenerate it without the panel:

```js
await window.Opp30.diagnoseOpportunityMatching()
```

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
- **Duplicate script tags are ignored** after the first boot, but remove them from Webflow
  rather than relying on that.
- Full behaviour notes live in the file's header and JSDoc, and the conventions doc referenced
  there (`product-workflows/opportunities/docs/wf-js-guide.md` in the workspace).

Run the merged-feed, router, and guard regressions with:

```sh
node --test navbar-role-contract.test.js opportunities-3.0-auth.test.js v3/auth-route.test.js v3/route-guard.test.js
```
