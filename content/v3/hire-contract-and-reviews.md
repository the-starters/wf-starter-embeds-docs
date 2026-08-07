---
title: "Hire: Contract & Reviews"
source: v3/project-form.js
sources:
  - v3/project-form.js
  - v3/reviews.js
---

Source: `v3/project-form.js`, `v3/reviews.js`

## What it is

The two adapters behind the **direct-hire loop**: a Brand generates a contract from a
Starter's `/hire/<slug>` profile, and once the project completes, reviews it from the Brand
dashboard — with approved reviews rendering back onto that public profile.

Both are adapters, not renderers. Webflow owns every form control, every card, and every
piece of copy. Xano remains authoritative for identity, ownership, project creation,
PandaDoc, lifecycle state, duplicate prevention, review eligibility, moderation, points,
reversals, aggregates, and ranking.

## `project-form.js` — the Contract Generation form

Load on the `/hire/<slug>` CMS template, **after `opportunities-3.0.js`**, whose
authenticated Memberstack → Xano bridge it submits through:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/project-form.js"></script>
```

Scope is deliberately narrow — the existing Hire triggers
`[data-modal-trigger="generate-contract"]`, the existing modal
`dialog[data-modal-target="generate-contract"]`, and the Brand Contract Generation form
inside it. **Do not attach it to the separate `start-project` modal.**

The adapter binds the form to the selected Starter's stable Memberstack identity,
serializes the existing named Webflow controls into the published
`projects/create-direct/v3` contract, supplies a retry-stable idempotency key, and projects
pending/success/error state into the authored elements. It also owns the conditional
visibility of three field groups and the three prefills that used to live in the page's Code
Embeds — both covered below.

### Markup contract

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-project-form-v3="brand"` | the `.w-form` Form Block wrapper | Marks the target form. Webflow applies Form Block custom attributes to this wrapper, not the generated native `<form>`; the adapter resolves the form beneath it. |
| `data-project-form-container="true"` | the same wrapper | Scopes the authored success/failure siblings |
| `#pushMemID` | inside the generate-contract modal | The CMS-bound selected-Starter control, emitted by the modal's existing Code Embed |
| `data-project-contract-choice` | the Standard / My Own Contract radios | One choice is required before submission |
| `data-project-field` | any control | Optional explicit field marker; the adapter otherwise matches on the existing native `name` allowlist |
| `data-project-form-state="success"` | the authored success element | Reused for success |
| `data-project-form-status` | written to the form | Pending/success/error state, alongside `aria-busy` |
| `data-project-required-hidden` | written by the adapter | Marks a `required` it temporarily removed |
| `data-project-invoice-frequency-hidden` | written by the adapter | Marks the invoice-frequency control it hid for My Own Contract |
| `data-project-hours-cap-hidden` | written by the adapter | Marks the two maximum-hours controls the selected cap period does not use |
| `data-project-monthly-end-date-hidden` | written by the adapter | Marks the Monthly Recurring end-date control it hid |

No new per-field Designer attributes are required. The adapter uses an allowlist of the
form's **existing** native Webflow names, matched case- and separator-insensitively —
`Invoice Frequency`, `Invoice-Frequency`, and `invoice_frequency` all resolve to the same
control. An authored `data-project-field` naming the backend field still wins over the
native name, and the invoice-frequency and Hours Cap Period visibility syncs below resolve
their controls in that same order, so adding those attributes in the Designer can never make
visibility and serialization disagree. The Monthly and Hourly end-date syncs are the
exception: they resolve `endDateInput` and `no-end-date` by native name **inside their fee
panel only**.

| Backend field | Existing control | Notes |
| --- | --- | --- |
| `title` | `Project-Name` | required |
| `service` | `Services` | required |
| `engagement_type` | `fee-structure` | Flat Fee, Ongoing Hourly, Monthly Recurring, Weekly Recurring |
| `total_cost` | Flat Fee `Amount` | required for Flat Fee |
| `paid_upfront_pct` | `Percent-Paid-Upfront` | optional, 0–100 |
| `hourly_rate` | Ongoing Hourly `Amount` | required for Hourly |
| `hourly_billing_frequency` | Hourly `Frequency` | The **hours-cap period**, not an invoicing cadence: option values `one_time`, `weekly`, `monthly`; required for Hourly |
| `maximum_total_hours` | `Maximum-Hours-Billed` | **required positive** cap for the `one_time` period |
| `maximum_hours_per_week` | `Maximum-Hours-Billed-per-Week` | **required positive** cap for the `weekly` period |
| `maximum_hours_per_month` | `Maximum-Hours-Billed-per-Month` | **required positive** cap for the `monthly` period |
| `monthly_rate` | Monthly Recurring `Amount` | required for Monthly |
| `number_of_months` | `Number-of-Months` | The fixed Monthly duration the server derives the end date from; omitted for ongoing Monthly |
| `weekly_rate` | Weekly Recurring `Amount` | required for Weekly |
| `number_of_weeks` | `Number-of-Weeks` | The fixed Weekly duration the server derives the end date from; omitted for ongoing Weekly |
| `start_date` | active fee panel start date | required |
| `estimated_end_date` | Flat Fee or Ongoing Hourly end date | Required for Standard Flat Fee, optional for Hourly, **never submitted for Monthly or Weekly**; when present it must be after `start_date` |
| `project_scope` | `Project-Scope` | required |
| `invoice_frequency` | `Invoice-Frequency` / `invoice-frequency` | Weekly, Bi-Weekly, Monthly, or Upon completion of the project. Its **own** select; required for Standard Contract and omitted for My Own Contract |

The repeated date and rate controls stay in their authored fee panels
(`startDateInput`, `endDateInput`, `Amount`, and the panel's own extras). The adapter picks
the **visible** conditional panel, with a nonblank fallback for test and preview DOMs;
hidden blank controls never replace the active value. The panel is resolved in exactly one
place, so the duration sync and the serializer can never disagree about which one is active:
a `data-project-field="engagement_type"` control wins, otherwise the authored native
`Fee-Structure` control.

### Canonical fee-panel values

The Fee Structure option values and the conditional-panel attributes must use the same
canonical values, because
[Form Input Filter](../global-embeds/form-embeds/form-input-filter/index.md) compares them
exactly. This is a **values-only** cutover — the visible option labels read exactly as they
do today:

| Option label | Option value | Fee panel attribute | Legacy value it replaces |
| --- | --- | --- | --- |
| Flat Fee | `flat_fee` | `data-input-filter-item="flat_fee"` | `Flat Fee` |
| Ongoing Hourly | `hourly` | `data-input-filter-item="hourly"` | `Ongoing Hourly` |
| Weekly Recurring | `weekly` | `data-input-filter-item="weekly"` | `Weekly Recurring` |
| Monthly Recurring | `monthly` | `data-input-filter-item="monthly"` | `Monthly Recurring` |

The adapter reads the canonical values **first** and keeps the legacy labels only as a
transition reader, so a CDN release can precede the Designer cutover without hiding every
fee panel. **New markup must use the canonical values.** Because the canonical values are
generic, the Fee Structure filter group must not contain a nested `[data-input-filter-item]`
— the Hours Cap Period select shares those values, so a nested `weekly` item inside the
Hourly panel would shadow the Weekly fee panel.

### Independent visibility the adapter owns

Three visibility rules belong to this adapter rather than to Form Input Filter. Each hides
the control, its authored `<label for="…">`, and the nearest **exclusive** wrapper through a
conservative walk that stops at the first ancestor holding another control or another
control's label, and never touches the `data-input-filter-item` panel itself. No sibling
input, select, textarea, label, or shared wrapper is ever hidden.

- **Invoice frequency** follows the contract choice, not the pricing model. Standard
  Contract shows, enables, and requires the select; My Own Contract hides and disables it,
  marks it `data-project-invoice-frequency-hidden`, and leaves the key out of the payload
  entirely — the only shape Xano ever sees for an absent invoice schedule is the absent key.
  The adapter never rewrites the value, so returning to Standard Contract restores the
  Brand's previous selection. A blank one there fails closed with `Choose an invoice
  frequency.` before any request is issued. Invoice Frequency is **not** a second
  `data-input-filter` controller.
- **Hours Cap Period** reveals exactly one maximum-hours control for the selected option
  (Entire project → `one_time`, Per week → `weekly`, Per month → `monthly`). The other two
  are hidden, disabled, and marked `data-project-hours-cap-hidden`, but their **values are
  never cleared**, so switching cap periods and back restores what the Brand typed; the
  serializer nulls the two the selected period does not use, so a preserved value can never
  cross the API. Remove `data-input-filter="wrapper"`, `="select"`, `="list"`, and every
  nested `data-input-filter-item` from this group.
- **Monthly Recurring end date** is hidden on the control itself, plus the authored
  `<label for="…">` bound to that exact control id, and marked
  `data-project-monthly-end-date-hidden`. The caption lookup is scoped to the Monthly panel
  because the Designer defaults a field id to its name and the panels repeat
  `endDateInput` — an unscoped search would strip the still-required Ongoing Hourly caption.
  Monthly and Weekly end dates are server-derived from their count, so the adapter also
  hard-clears `estimated_end_date` for both.

The authored Hourly panel supports either a fixed end date or the explicit **No end date**
checkbox, and the adapter makes those mutually valid: an entered end date removes the
checkbox requirement, while a checked ongoing choice clears and disables the end date.

### The hidden-`required` problem

Webflow keeps conditional branches in the native form when they are hidden, and the browser
runs interactive validation **before** it dispatches `submit`. A `required` control inside a
`display:none` branch therefore aborts submission before the adapter is ever called
("An invalid form control … is not focusable").

Following the same pattern as
[Form Input Filter](../global-embeds/form-embeds/form-input-filter/index.md), the adapter
removes `required` from inactive controls, marks them `data-project-required-hidden`, and
restores the authored attribute the moment the branch becomes visible. The sync runs on
`input`, on `change`, on click before the browser validates the submit, and again in the
adapter's own pre-submit check before it delegates to native `reportValidity()`. The three
visibility syncs above run at each of those points too, plus once when the adapter installs,
so the Monthly end date is already hidden and cleared before the first interaction.

### What the browser never decides

Fee structure becomes `flat_fee`, `hourly`, `monthly`, or `weekly`, and contract choice
becomes `standard` or `own_contract`. The two billing vocabularies stay separate on purpose:

- **Invoice frequency** becomes `weekly`, `bi_weekly`, `monthly`, or `upon_completion`,
  serialized from its own select and never derived from the hourly Hours Cap Period.
- **Hours Cap Period** becomes `one_time`, `weekly`, or `monthly`, serialized to the
  compatibility key `hourly_billing_frequency`. It decides which maximum-permitted-hours
  field applies and **does not control invoicing**.

**Xano derives the PandaDoc template key** — the browser never chooses a template UUID and
never sends Brand or Starter authority fields. Hiring Manager, Company, Email, and
display-name fields are UI/prefill only; Xano derives the authoritative records from the
authenticated Brand plus the selected Starter identity.

Success dispatches `starters:project-created` on the document with only `project_id` and
`replayed`. Payload controls and submit buttons are locked while a request is pending, and
the authored Webflow Error Message sibling receives a safe message plus `role="alert"`.

### Prefills the adapter now owns

Three behaviours that used to live in `/hire/<slug>` Webflow **Code Embeds** are part of the
adapter, so the form's authored attributes keep working with no embed on the page. None of
them generate markup, and all three skip a control that already holds a value — a Brand's own
edit survives reopening the modal. The two prefills run when the adapter installs and again
each time a Hire trigger opens the modal, because CMS content and Memberstack often settle
after page load; the preset filling is a delegated click, so a CMS-rendered trigger needs no
rebinding.

| Behaviour | Hooks | What it does |
| --- | --- | --- |
| Hiring-manager prefill | `[data-mscustom-fullname]`, native `Hiring-Manager-Name` | Fills blank controls with the member's first + last custom field from `getCurrentMember()` (`free-user` is this site's legacy first-name key). Memberstack is polled every 100ms for up to 50 tries, then abandoned silently. The value is prefill only and never serialized |
| CMS attribute presets ("smart fill") | `[data-sp-fill="button"]` trigger, `[data-sp-fill="input"]` target | A delegated click applies every `data-sp-fill-category` / `data-sp-fill-value` pair on the trigger and its descendants. The click is **not** suppressed, so the same node can also be the Hire modal trigger. `fee_structure` resolves to the authored `Fee-Structure` control and `invoice_frequency` to the invoice-frequency control the serializer reads — independently, so a fee-structure preset can never write the invoice select |
| Current-date init | `[data-set-current-date]` | Blank controls receive today's date, formatted by jQuery UI's datepicker when loaded and by an `mm`/`dd`/`yy` fallback when not. Visited controls are marked `data-set-current-date-inited="true"` |

Values are applied the way a Brand would apply them: a select matches an option by value then
by visible text, a radio preset widens to the whole same-named group and `click()`s it so
Webflow's conditional panels react, and everything else dispatches an `input`/`change` pair.
For the two cutover categories a preset that matches nothing literally is retried by
canonical value, so a CMS card written in either grammar still fills the control. Disabled
controls are never touched.

The `freelancer-cms/` copies of these embeds stay authoritative for the other CMS pages that
still load them — do not paste them back onto `/hire/<slug>`. A copy still published there is
harmless, since both implementations skip an already-filled control and share the
`data-set-current-date-inited` marker, but delete it the next time Webflow is edited so the
behaviour has one owner.

Generating an **invoice** against a created project is a different surface with a different
owner: it is the Starter dashboard's Generate Invoice modal in
[Opportunities 3.0: Core](../page-scripts/opportunities-3-0.md#generate-invoice). Nothing on
`/hire/<slug>` issues an invoice request.

## `reviews.js` — Brand review form and public profile reviews

Load after the authored Webflow surfaces and the wf-xano runtime:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/reviews.js"></script>
```

One file serves two surfaces.

### Brand dashboard — the review form

Author the form as native Webflow HTML, keep the `dash-brand-projects` wf-xano instance, and
set that instance's wf-xano form name to `project-review`.

| Hook | Purpose |
| --- | --- |
| `data-review-form-v3` | on the `<form>`; the binding selector |
| `wf-xano-field="project_id"` | the project identifier control |
| `wf-xano-field="idempotency_key"` | the hidden idempotency key |

The adapter binds `project_id` **only** when the canonical `dash-brand-projects` result
contains exactly one project, accepting that project's positive numeric `project_id` or
`id`. An already-rendered `.project_item[data-wf-xano-id]` works as a startup and
submit-time fallback, again only when exactly one exists. Zero, multiple, missing, or
invalid identities **clear the control and block submission**, so wf-xano can never send a
blank or stale ID.

For a valid binding it also replaces the authored `.review-v3_intro` text and writes a fresh
`review-ui:{project_id}:{random}` key in capture phase on every submit. A successful
`project-review` submission emits the document event `starters:review-submitted`; the
adapter performs no second write.

### Public profile — the approved reviews section

Use one wf-xano wrapper with `wf-xano-instance="starter-reviews"` and `data-reviews-v3`.

| Hook | Purpose |
| --- | --- |
| `data-reviews-v3` | the wrapper / section root |
| `data-reviews-v3-average` | the aggregate average rating |
| `data-reviews-v3-count` | the aggregate review count |
| `data-reviews-v3-list` | the card target — the only place cards render |

The adapter derives the decoded slug **only** from a canonical `/hire/{slug}` path and sets
`wf-xano-param-starter_slug` before the wrapper initializes. When the wrapper has no
authored `wf-xano-element="template"`, it adds a hidden `aria-hidden` placeholder so wf-xano
can initialize; if site-level wf-xano already booted and skipped that formerly incomplete
wrapper, it calls the runtime's idempotent `init()` for this root only.

The canonical Xano envelope:

```json
{
  "reviews": [],
  "aggregate": {
    "review_count": 0,
    "average_rating": 0
  }
}
```

`items` is accepted for the array and `aggregates` for the object, plus the wf-xano raw-item
fallback. **Aggregate values are never recalculated** from a paginated list. The section is
shown only when the approved review array is non-empty, though zero aggregates are still
painted when it is empty.

Cards render as stacked bordered blocks with five Bootstrap star icons, a `Verified Review`
badge, the review text, and reviewer identity from `brand.full_name` falling back to
`brand.company_name`.

## Notes & gotchas

- Both the contract choice and the invoice-frequency select are resolved **anywhere in the
  form**, not inside a particular step wrapper, so a Designer step reorganization that moves
  the contract choice ahead of the pricing fields needs no change here.
- **Reviewer identity and review text are never interpreted as HTML.** Cards are built from
  DOM nodes and `textContent` only.
- The Xano response is the authority for what is public — it must expose **only approved
  reviews**.
- Do not enable any points, ranking, rank-projector, or `rank_status` write as part of the
  reviews integration.
- Neither module contains an Airtable or Make integration, a private token, or a direct
  authenticated fetch path of its own.
- `reviews.js` replaces the legacy CMS projection inside `data-reviews-v3-list`, so the old
  CMS-bound markup in that container is expected to disappear once the adapter runs.
