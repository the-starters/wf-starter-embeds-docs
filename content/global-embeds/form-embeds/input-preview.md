---
title: "Input Preview"
---

Source: Webflow — `Global Embeds / Form Embeds / Input Preview - JS`

## What it is

Global, per-field live preview. Mirrors a single input's value into a matching preview slot as
the user types or selects, keyed by a unique field name. It is 1:1 and controlled: only inputs
inside a `data-input-preview` wrapper are ever scanned, and each field writes to exactly the
slot(s) whose name matches — no mass collection of a whole section.

The script is a plain IIFE with a global init guard (`window.__inputValuePreviewInited`), listens
for `input`/`change` in the capture phase on `document`, and does an initial paint on init (so
pre-filled and deep-linked values preview immediately). When `window.jQuery` is present it also
delegates `change`/`input` through jQuery, because jQuery UI datepicker/timepicker set values
programmatically and fire a jQuery-only `change` that native listeners never see. Both the jQuery
bridge and a re-paint run again on `window` `load` in case jQuery finishes wiring late.

## Markup contract

```html
<!-- Source side: fields must live inside a data-input-preview wrapper -->
<div data-input-preview="booking-form">
  <!-- attribute directly on the control… -->
  <input type="text" name="First-Name" data-input-preview-field="first-name" />

  <!-- …or on a wrapper around a Webflow custom radio/checkbox group -->
  <div data-input-preview-field="plan">
    <label class="w-radio">
      <input type="radio" name="Plan" value="Hourly" />
      <span class="w-form-label">Hourly</span>
    </label>
    <label class="w-radio">
      <input type="radio" name="Plan" value="Fixed" />
      <span class="w-form-label">Fixed</span>
    </label>
  </div>
</div>

<!-- Destination side: anywhere on the page -->
<div data-input-preview-value="first-name">
  <span data-input-preview-element="value"></span>
</div>
<div data-input-preview-value="plan">
  <span data-input-preview-element="value"></span>
</div>
```

Matching is by the **field name** (`first-name`, `plan`), not by the wrapper's value — the value
on `data-input-preview` itself is just a marker/label. Field names are whitespace-normalized
before matching.

## API

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-input-preview="<name>"` | source wrapper | Marks a region as previewable. Only fields inside one of these are scanned; the value is a label only. |
| `data-input-preview-field="<field-name>"` | input/select/textarea, or a wrapper around a radio/checkbox group | The field to read. The name is the matching key. |
| `data-input-preview-value="<field-name>"` | destination wrapper | Receives the value of the source field with the exact same name. Several destinations may share one name; all get filled. |
| `data-input-preview-element="value"` | child of the destination | Text node that gets the value. Falls back to the destination wrapper itself when absent. |

How values are read:

| Control | Value shown |
| --- | --- |
| text/number/textarea | The trimmed `value`. |
| select | The selected option's visible text. |
| radio | The checked option's `value`; if the value is empty or Webflow's default `on`, the visible label text is used instead. |
| checkbox | Same as radio, but multiple checked boxes join with a comma and space. |
| group wrapper with non-toggle controls | The last filled non-toggle control acts as a fallback when no toggle is checked. |

Disabled and `type="hidden"` controls inside a group wrapper are skipped.

## File structure

```
Form Embeds
└── Input Preview - JS
```

JS only — no CSS file. If you use the jQuery-based Datepicker/Timepicker embeds, load order
does not matter: the script re-binds its jQuery bridge on `window` `load`.

## Notes & gotchas

- **Names must match exactly** (after whitespace collapsing). A source field with no matching
  `data-input-preview-value` destination simply writes nowhere; a destination with no matching
  source stays empty.
- Fields with a `data-input-preview-field` attribute **outside** any `data-input-preview` wrapper
  are ignored — the wrapper is the opt-in scope.
- Webflow's default checkbox value `on` is deliberately treated as empty so the visible label
  text wins. Set an explicit `value` on the input if you want something other than the label.
- The destination is filled via `textContent`, so HTML in values is rendered as plain text.
- `data-input-preview-field-value` is declared in the source but never used — it is not a working
  option.
- The init guard is global: the script runs once per page no matter how many times it is included,
  but it also means fields added to the DOM later are still picked up (listeners are delegated on
  `document`), while the initial paint only covers what existed at init/load time.
