---
title: "Start Project: Generate Contract"
---

Source: Webflow, `Global Embeds / Start Project / Gen Contract`

## What it is

Contract **preview renderer** for the "Start a project / generate contract" modal. Step 1 of the
flow collects form fields; when step 2 (or the success block) becomes visible, this script copies
every filled, visible, enabled field from the step-1 sections into matching preview sections:
label + value rows, single value slots, formatted field groups, and conditional show/hide toggles.
It is display-only: nothing is submitted or sent anywhere by this script (the form's own
submission/webhook is configured separately in Webflow and is not documented here).

Scoping is per form instance: each `form[data-form-flow="generate-contract"]` resolves a scope
(its `.w-form` wrapper, else the enclosing `[data-modal-target]`, else the form's parent), and all
source/destination lookups happen inside that scope, so multiple modals on a page stay independent.

## File structure

```
Start Project / Gen Contract
├── Start Project / Gen Contract - CSS
└── Contract Preview - JS
```

The CSS is one rule (hides the even-row pad items on mobile). The JS has no dependencies
(no GSAP, no jQuery) and is init-guarded via a window flag, so double-inclusion is safe.

## Markup contract

```html
<div class="w-form">
  <form data-form-flow="generate-contract">

    <!-- STEP 1: source section, keyed -->
    <div data-preview-contract-fields="project">
      <label>Project name</label>
      <input type="text" name="project-name">

      <!-- optional: a group renders several fields as ONE entry -->
      <div data-preview-contract-group
           data-preview-contract-group-title="Timeline"
           data-preview-contract-group-format="{Start Date} to {End Date}">
        <label>Start Date</label> <input type="text">
        <label>End Date</label>   <input type="text">
      </div>
    </div>

    <!-- STEP 2: destination section with the same key (LIST mode) -->
    <div data-form-flow-element="step-2">
      <div data-preview-contract="project" class="table-stats_component">
        <div data-preview-contract-element="item" class="table-stats_item">
          <div data-preview-contract-element="title"></div>
          <div data-preview-contract-element="value"></div>
        </div>
      </div>

      <!-- single named field, pulled directly from step 1 -->
      <span data-preview-contract-field="project"
            data-preview-contract-field-name="Start Date"
            data-preview-contract-field-slot="value"></span>

      <!-- conditional block, shown only when a value matches -->
      <div data-preview-contract-reference="project"
           data-preview-contract-reference-field="Payment type">
        <div data-preview-contract-element-toggle="Hourly">…hourly terms…</div>
        <div data-preview-contract-element-toggle="Fixed">…fixed terms…</div>
      </div>
    </div>
  </form>
</div>
```

A destination with an `item` template inside it renders in **LIST mode** (the template is cloned
once per collected field); without one it renders in **SINGLE mode** (the first field's value is
written into the lone `value` slot).

## API

### Sources and destinations

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-form-flow="generate-contract"` | the form | Activates the script for this form; defines the scope. |
| `data-preview-contract-fields="key"` | step-1 section | Source of fields for `key`. Disabled, `type="hidden"`, and fields inside a `[hidden]` ancestor are skipped; empty values are skipped. |
| `data-preview-contract="key"` | step-2 section | Destination rendered from the matching source, in DOM order. |
| `data-preview-contract-element="item"` | row template | Marks a destination as LIST mode; cloned per field (cached on first render). |
| `data-preview-contract-element="title"` / `"value"` | inside a row | Slots that receive the field's label / value. |
| `data-preview-contract-pad` | set by JS | Empty `table-stats_item` appended when a `.table-stats_component` list has an odd row count; the CSS hides pads under 768px. |

### Groups (several inputs → one row)

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-preview-contract-group` | wrapper inside a source | Its fields are consumed as one entry (emitted once, in DOM order). Skipped entirely if every grouped field is empty. |
| `data-preview-contract-group-title` | group wrapper | The rendered row's label. |
| `data-preview-contract-group-format` | group wrapper | Template for the value; each `{Label}` token is replaced by the grouped field whose label matches (case-insensitive). Missing tokens render blank. Without a format, filled values are joined with spaces. |

### Named field slots

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-preview-contract-field-slot` | text element | `value` or `title`; filled with that part of one step-1 field. Cleared when unresolved. |
| `data-preview-contract-field="key"` | slot or ancestor | Which source section to look in. |
| `data-preview-contract-field-name="Label"` | slot or ancestor | Which field, matched by its label text (case-insensitive). |

### Conditional toggles

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-preview-contract-element-toggle="expected"` | any element | Shown (via the `hidden` attribute) only when the resolved actual value equals `expected`, case-insensitive. A legacy `title=` / `value=` prefix in the expected string is stripped. |
| `data-preview-contract-reference="key"` | toggle ancestor | Compare against the destination section `key` instead of the enclosing section. |
| `data-preview-contract-reference-field="Title"` | same ancestor | Within that referenced list, compare against the row whose rendered title matches. |

Field labels are resolved best-effort: a `label[for]` match, then a wrapping label, then the
nearest preceding label up the ancestor chain, then `data-name` / `placeholder` / `name`. Checkbox
and radio inputs contribute their `value` only when checked; selects contribute the selected
option's text.

## Notes & gotchas

- **Render triggers:** the preview repaints when `[data-form-flow-element="step-2"]` or
  `.generate-contract_success` flips from `display: none` to visible (a MutationObserver watches
  `style`, `class`, and `aria-hidden`), plus one initial paint at load. Editing a step-1 field
  while step 2 is already open does **not** live-update; the user must leave and re-enter the
  step.
- Fields inside a `[hidden]` ancestor are treated as inactive. This is how form-filter variant
  sections are excluded, so keep unused variants marked with the `hidden` attribute, not just
  CSS classes.
- Group format tokens match on the field's **label text**, so renaming a label in Webflow silently
  breaks the token (it renders blank). Same for `data-preview-contract-field-name` and
  `data-preview-contract-reference-field`.
- In LIST mode the row template is cached on first render, then removed from the DOM; leave
  exactly one `item` element in the destination as the template.
- The even-row padding only applies to destinations with the `table-stats_component` class, and
  the pad is invisible under 768px thanks to the companion CSS.
- Toggle comparisons are string-equality after whitespace-collapse and lowercasing: `1,000` and
  `1000` do not match.
- Do not put full secret values in this markup: everything the script renders is plain visible
  text on the published page.
