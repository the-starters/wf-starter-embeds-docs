---
title: "Pre-fill Attribute Value"
---

Source: `freelancer-cms/pre-fill-attr-val.js`

## What it is

Click-to-prefill for forms. When an element tagged `data-sp-fill="button"` is clicked, the script
gathers category/value pairs — from `data-sp-fill-category` + `data-sp-fill-value` on the trigger
itself and on any of its descendants — and writes each value into the form field tagged
`data-sp-fill="input"` with the matching `data-sp-fill-category`. Typical use: a CMS card whose
"Apply" button fills a form (in a modal or elsewhere on the page) with that item's data.

The click handler is delegated on `document`, so triggers rendered later (Webflow CMS lists)
work without re-init. The trigger click is not `preventDefault`-ed or stopped, so the same
element can also act as a modal trigger for a separate script. A run-once guard on the `html`
element (`data-sp-prefill-inited`) keeps a double paste harmless.

Values are applied per field type:

- **Text input / textarea** — value assigned, then bubbling `input` and `change` fired.
- **Select** — the matching `option` is selected (matched by option value exact, then value
  case-insensitive, then option text exact, then text case-insensitive); unchanged if nothing
  matches. `input` and `change` fired.
- **Radio group** — the radio whose `value` matches (exact, then case-insensitive) receives a
  real `click`, so Webflow's custom radio visuals update and `change` fires natively.
- **Checkbox** — `true`/`false` (case-insensitive) sets the checked state; a value equal to the
  checkbox's own `value` means checked. Applied via a real `click` only when the state differs.

Disabled fields are always skipped (their value would not submit anyway).

## File structure

```
Pre-fill Attribute Value - JS
```

No dependencies.

## Markup contract

```html
<!-- Trigger: pairs can sit on the trigger itself and/or on descendants -->
<a href="#" data-sp-fill="button"
   data-sp-fill-category="role" data-sp-fill-value="Designer">
  <div data-sp-fill-category="rate" data-sp-fill-value="75"></div>
  <div data-sp-fill-category="remote" data-sp-fill-value="true"></div>
  Apply
</a>

<!-- Targets: tag the field itself, or a wrapper around a radio/checkbox group -->
<form>
  <input type="text" data-sp-fill="input" data-sp-fill-category="role">
  <select data-sp-fill="input" data-sp-fill-category="rate">
    <option value="50">50</option>
    <option value="75">75</option>
  </select>
  <div data-sp-fill="input" data-sp-fill-category="remote">
    <input type="checkbox" value="Remote">
  </div>
</form>
```

A target tagged on a non-field element (like the wrapper `div` above) resolves to the
`input`/`select`/`textarea` elements inside it — that is how radio groups are matched.

## API

| Attribute | On | Description |
| --- | --- | --- |
| `data-sp-fill="button"` | trigger | Clicking it (or anything inside it) applies the pairs. |
| `data-sp-fill="input"` | field or field wrapper | Marks the fill target for one category. |
| `data-sp-fill-category` | trigger, trigger descendants, targets | Names the pair. Trigger-side and target-side values are matched exactly first, then case-insensitively (with a console warning asking you to align the casing). |
| `data-sp-fill-value` | trigger, trigger descendants | The value to write for that category. Required — a category without it is skipped with a warning. |
| `data-sp-prefill-inited` | set by script on `html` | Run-once guard. |

There are no other options. Pairs with an empty category are skipped; a category with no tagged
field, or a tagged wrapper containing no fields, is skipped with a warning.

## Notes & gotchas

- Debug logging (`[sp-prefill]` prefix) only prints on `.webflow.io` staging domains — on a
  production custom domain the log calls no-op, but skip/mismatch behavior is identical, so
  debug on staging.
- Target lookup ignores any `data-sp-fill="input"` element that sits inside a trigger, so a
  trigger can safely contain form fields of its own.
- If several fields share the same category, only the first match in DOM order is filled.
- Select matching never adds options — if no `option` matches the value, the select is left
  unchanged.
- For checkboxes, use `true`/`false` or the checkbox's own `value`; anything else is rejected
  with a warning.
- Radios and checkboxes are driven with a real `click`, so Webflow's custom-styled inputs stay
  visually in sync; text fields and selects get synthetic bubbling `input`/`change` events
  instead.
