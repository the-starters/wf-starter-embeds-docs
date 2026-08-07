---
title: "Opportunities: Create"
source: opportunities---create.js
---

Source: `opportunities---create.js` (repo root)

## What it is

The **`/opportunities---create` page controller**. Binds the brand "create opportunity" form to
the Xano `brand/opportunities/create` endpoint through the shared core
([Opportunities 3.0: Core](./opportunities-3-0.md), `window.Opp30`).

It reads the form with role-aware helpers (selected `[data-opp-role-value]` chips, checked
radios/checkboxes, project-type mapping to the human strings Xano stores) and submits through
the core's authenticated API wrapper.

The **same form contract** is implemented by both this controller and the core, because the core
also drives the Brand feed's post-opportunity modal and the edit-opportunity modal. Everything
below therefore applies to the create form wherever it is rendered.

## File structure

```
opportunities---create.js   (repo root, ~260 lines)
```

**Load order matters** (page footer, after the existing Memberstack + Xano scripts):

1. `opportunities-3.0.js`: the shared core, exposes `window.Opp30`
2. `opportunities---create.js`: this file

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/opportunities-3.0.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/opportunities---create.js"></script>
```

## Form contract

Publish **`data-opp-form="create"`** on the one full Webflow create form rendered on each
supported page — `/opportunities---create` and the Brand feed's post-opportunity modal — before
releasing either controller. Both resolve the form **only** through that stable role: generated
form IDs and styling classes are not supported fallbacks, so the Webflow display name, ID, and
classes can be cleaned up independently afterwards.

The form may keep its native submit control. An optional `data-opp-submit="create"` control
inside the form is still owned by the form's own submit handler.

| Rule | Contract |
| --- | --- |
| **Category required** | The existing `Category-option` input stays; the controller makes it required **from the selected tags**, not from the visible search text, so a missing category produces the inline message `Please select at least one category.` instead of silently blocking submission. |
| **Title: 15 words** | The authored `wf-validate-maxwords="15"` rule on `Opportunity-title` is kept as-is. |
| **Title: 120 characters** | The controller adds `maxlength="120"` plus `wf-validate-message-maxlength` = `Please keep the title to 120 characters or fewer.`, and enforces the same limit **against the submitted payload** — so a scripted or prefilled value that bypasses the input's `maxlength` is still rejected. It does not generate the title input. |
| **Estimated hours** | The Ongoing Part Time variant needs Webflow-authored inputs named `Estimated-Hours` and `Part-Time-Budget`. |
| **Budgets** | The three authored budget inputs (`One-Time-Budget`, `Part-Time-Budget`, `Full-Time-Budget`) are synchronized so only the selected Project Type's budget is required — otherwise hidden budget inputs disable the form's Submit control. |

### Estimated hours for Ongoing Part Time

Author the hours label, plain-text input, helper text, and field group in Webflow, in **both** the
Create and Edit components. Give that group `data-project-type="part-time"` and place it before
the existing part-time budget group. Label the field **Estimated hrs/week** with the placeholder
**Example: 25 hrs/week**.

The controller binds the native input, supplies its required-message attribute, and requires and
reveals it only while `Project-Type` resolves to `Ongoing Part Time`, hiding the authored group
for the other project types. It generates none of that markup, so both components must publish it
before the controller is released.

Create and update requests send the input's trimmed value as the existing Xano `est_hours` field,
and edit prefill restores it. One Time and Full Time requests send an empty `est_hours` and do
not require the field.

### Success screen

After a successful create or edit, the controller **paints the Webflow-authored review success
screen in place** — it binds only existing elements and generates no markup:

- The saved opportunity title goes into the success block's `data-opp-bind="title"` element,
  falling back to an authored `[Job Name]` placeholder span, then to an empty span inside
  `.heading-style-h1`.
- The `.text-size-medium` confirmation message is rewritten to opportunity-specific copy when the
  authored text still reads as *application* copy, so both flows read "Our team is carefully
  reviewing your opportunity."

### Validation

Keep [`utils/wf-validate.js`](../utils/wf-validate.md) on these forms. The controller registers
the fields it configures through **`window.WfValidate.refresh(form)`**, so category and
estimated-hours failures use the form's normal inline error treatment instead of a separate error
style. `refresh()` adds only new controls, preserves existing groups and touched/error state, and
recomputes the submit-disable state without duplicating listeners.

Client-side checks are **UX only**; Xano retains authority over accepted payloads.

## Notes & gotchas

- Run-once guard: `window.__opp30CreatePage`. The flag is **shared with the core's standalone
  create handler**, so the form is never double-bound when both scripts load on one page.
- The `PROJECT_TYPE` map translates the Webflow radio `id`s (`One-Time`,
  `Ongoing-Part-Time`, `Full-Time`) into the exact strings Xano stores (`One Time`,
  `Ongoing Part Time`, `Full Time`); renaming those radios in the Designer breaks the mapping.
  `BUDGET_FREQUENCY` then maps those strings to `project` / `month` / `year`.
- `est_project_duration` reads the radio's **value** (e.g. `≤ 1 months`), not its `id`.
- **The edit modal refreshes its saved values after each form-flow reset**, so Webflow's authored
  default radio cannot replace the opportunity's current Project Type when the modal reopens.
  Project Type prefill also emits the native `change` event the authored tab controller listens
  for, keeping its active pill and conditional panel aligned with the checked radio.
- `DEBUG_LOG` at the top of the file controls the `[opp30:create]` console logging; flip to
  `false` for production quiet.
- Conventions and the wider flow are documented in
  `product-workflows/opportunities/docs/wf-js-guide.md` (workspace).

Run the focused form-selector, feedback, validation, and create-page authentication regressions
with:

```sh
node --test opportunities-form-contract.test.js opportunities-create-auth.test.js opportunities-create-feedback.test.js wf-validate.test.js
```
