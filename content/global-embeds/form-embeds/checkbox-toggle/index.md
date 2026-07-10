---
title: "Checkbox Toggle"
---

Source: Webflow, `Global Embeds / Form Embeds / Checkbox Toggle`

## What it is

Shows or hides an element depending on whether a checkbox is checked. A plain IIFE (no GSAP, no
modules) that inits every `data-checkbox-toggle` wrapper on `DOMContentLoaded` (or immediately if
the DOM is already ready). Idempotent: each wrapper is stamped with
`data-checkbox-toggle-inited="true"` and skipped on re-runs, so including the script twice is safe.
Visibility is driven by the native `hidden` attribute on the item, synced on every checkbox
`change` and once on init.

## File structure

```
Checkbox Toggle
├── Checkbox Toggle - CSS
└── Checkbox Toggle - JS
```

## Markup contract

```html
<div data-checkbox-toggle>
  <div data-checkbox-toggle-element="checkbox">
    <label class="w-checkbox">
      <input type="checkbox" name="Show-Details" />
      <span class="w-form-label">Show details</span>
    </label>
  </div>
  <div data-checkbox-toggle-element="item">
    <!-- content shown when the checkbox is checked -->
  </div>
</div>
```

One wrapper per toggle pair. The script looks for the checkbox inside the
`data-checkbox-toggle-element="checkbox"` slot first, and falls back to the first
`input type="checkbox"` anywhere in the wrapper, so the `checkbox` slot is optional and the `item`
slot is required. If either the input or the item is missing, the wrapper is silently skipped.

## API

| Attribute | On | Values | Purpose |
| --- | --- | --- | --- |
| `data-checkbox-toggle` | wrapper | empty (default) · `invert` | One toggle pair. Default: item is shown when checked. `invert`: item is **hidden** when checked. |
| `data-checkbox-toggle-element="checkbox"` | slot | — | Contains the checkbox input (optional; falls back to first checkbox in the wrapper). |
| `data-checkbox-toggle-element="item"` | slot | — | The content that gets shown/hidden (required). |
| `data-checkbox-toggle-inited` | wrapper | `true` | Set by the script; do not add manually. |

The companion CSS does two things:

| Rule | Purpose |
| --- | --- |
| item hidden until wrapper has `data-checkbox-toggle-inited` | Avoids a flash of the item before JS wires the toggle (safe for the default "show when checked" with an unchecked start). |
| `[hidden]` forced to `display: none !important` on the item | The item may carry a `.display-contents` utility (`display: contents`), which would beat the `hidden` attribute's UA style; this makes `hidden` win. |

## Notes & gotchas

- The pre-init CSS hides the item unconditionally, so with `invert` **and** a checkbox that starts
  unchecked, the item is hidden until the JS runs, then shown: a brief pop-in rather than a flash
  of unwanted content. The comment in the CSS calls this out as safe only for the common default.
- If the JS never loads, the item stays hidden forever (the pre-init rule has no fallback), so keep
  the CSS and JS deployed together.
- State is synced on init, so a checkbox pre-checked in the Designer (or restored by the browser)
  shows the item correctly on load.
- One checkbox per wrapper: the fallback query grabs the **first** checkbox it finds, so don't put
  multiple checkboxes inside one wrapper.
- Wrappers added to the DOM after init are not picked up automatically; there is no MutationObserver.
