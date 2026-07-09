---
title: "Datepicker"
---

Source: Webflow — `Global Embeds / Form Embeds / Datepicker`

## What it is

Attribute-driven jQuery UI datepicker for Webflow. Tag any input with `data-input-datepicker` and it
becomes a calendar field — no ids, no class hooks, no per-field code. Supports standalone date fields
and linked start/end ranges, and knows how to survive inside a modal (the shared picker div is
reparented into the modal so it isn't clipped, then re-anchored under its input and tracked on
scroll/resize).

The script waits for `window.jQuery` (polling every 50ms — Webflow loads jQuery by default), then
self-loads jQuery UI 1.14.1 from the jQuery CDN if `datepicker` isn't already available. Loading is
guarded through a `window.__wfInputDatepicker` namespace, so multiple copies of the embed on one page
fetch jQuery UI only once. Everything runs as a plain IIFE.

## File structure

```
Datepicker
├── Datepicker - CSS
└── Datepicker - JS
```

The script self-loads jQuery UI — it only needs jQuery on the page (Webflow includes it by
default), so load order relative to other embeds doesn't matter.

## Markup contract

Standalone field:

```html
<input type="text" placeholder="MM/DD/YYYY" data-input-datepicker>
```

Standalone with options:

```html
<input type="text"
       data-input-datepicker
       data-input-datepicker-format="yy-mm-dd"
       data-input-datepicker-months="2"
       data-input-datepicker-min="0">
```

Linked start/end range — both inputs inside one group wrapper:

```html
<div data-input-datepicker-group>
  <input type="text" data-input-datepicker data-input-datepicker-role="start" placeholder="MM/DD/YYYY">
  <input type="text" data-input-datepicker data-input-datepicker-role="end"   placeholder="MM/DD/YYYY">
</div>
```

When paired: picking **start** pushes the end picker's `minDate` to start + 1 day; picking **end**
pulls the start picker's `maxDate` to end − 1 day — so start and end can never be the same day. The
same locks are also applied once at init from any value already sitting in the fields, so dates
prefilled by Webflow defaults or another embed constrain the sibling picker exactly like a manual pick.

## API

### Required

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-input-datepicker` | each input | Marks the input as a datepicker. Value is ignored. |

### Pairing (start/end range)

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-input-datepicker-group` | wrapper element | Links the start/end pair found inside it. |
| `data-input-datepicker-role="start"` | start input | First date of the range. |
| `data-input-datepicker-role="end"` | end input | Second date of the range. |

A group missing one of the two roles falls back to initializing every `data-input-datepicker` inside
it as an independent picker.

### Optional — per input

| Attribute | Default | Maps to (jQuery UI) | Purpose |
| --- | --- | --- | --- |
| `data-input-datepicker-format` | `mm/dd/yy` | `dateFormat` | Display/parse format (jQuery UI tokens: `d`/`dd` day, `D`/`DD` weekday, `m`/`mm` month, `M`/`MM` month name, `y`/`yy` year). |
| `data-input-datepicker-months` | `1` | `numberOfMonths` | How many months the calendar shows. |
| `data-input-datepicker-min` | — | `minDate` | Earliest selectable date. Accepts jQuery UI values — absolute (in `format`) or relative like `0` (today), `+1d`, `-1w`. |
| `data-input-datepicker-max` | — | `maxDate` | Latest selectable date. Same formats as min. |

An empty attribute value is treated the same as an absent attribute (the default applies).

### Modal support

| Attribute / event | On | Purpose |
| --- | --- | --- |
| `data-input-datepicker-modal` | modal dialog element | When an input lives inside this element, the shared `#ui-datepicker-div` is reparented into it on open so it isn't clipped, forced to `position: absolute`, re-anchored directly under the input, and clamped to the modal's width. Falls back to the closest `.modal_dialog`. |
| `modal-open` (window `CustomEvent`) | dispatched by your modal code | Re-runs init inside `event.detail.modal`, picking up inputs that were added or hidden at page load. |

```js
window.dispatchEvent(new CustomEvent('modal-open', { detail: { modal: modalEl } }))
```

### Set by the script (don't author these)

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-input-datepicker-initialized="true"` | group wrapper | Idempotency guard — a group inits once. |

### CSS hooks (from `datepicker.css`)

| Selector | Purpose |
| --- | --- |
| `.ui-datepicker` (and descendants) | Full restyle of the jQuery UI calendar: light shell, custom chevron prev/next arrows, 2.75rem day cells, dark selected day. |
| `[data-input-datepicker-modal]`, `.modal_dialog` | Forced to `overflow: visible` so the reparented picker isn't clipped. |
| `#ui-datepicker-div` (also scoped inside the two modal selectors) | `z-index: 999999` so the picker sits above modal chrome. |

A `max-width: 767px` media query caps the picker at `calc(100vw - 6rem)`, switches the calendar table
to fixed layout, and shrinks day cells to 2.5rem so all seven columns fit on phones.

## Notes & gotchas

- **Idempotent.** Standalone inputs are skipped if jQuery UI already holds datepicker data for them;
  groups are skipped once `data-input-datepicker-initialized="true"` is set. Safe to run the embed
  more than once or re-fire `modal-open`.
- **Same-day ranges are blocked by design** — the pair locks keep each side a full day clear of the
  other. If you need same-day start/end, this embed's pairing doesn't allow it.
- **Range locks fire at init too.** Prefilled values never trigger `onSelect`, so the script applies
  the min/max locks from whatever is already in the fields when the pair initializes.
- **Inside a modal**, jQuery UI positions the picker in document (or viewport) coordinates and can
  leave it `position: fixed`; once reparented into the modal both break. The script forces
  `position: absolute`, recomputes top/left against the picker's real offset parent, and keeps
  re-anchoring on scroll (capture phase, so inner scroll containers count) and resize via
  `requestAnimationFrame`. Tracking stops when the picker closes or its input leaves the DOM.
- The picker markup is jQuery UI's shared singleton `#ui-datepicker-div` — one calendar element serves
  every input on the page.
- If jQuery never appears on the page, the script polls forever and nothing initializes — it does not
  load jQuery itself, only jQuery UI.
- No ES modules, no wrapper `script` tags in the file — raw IIFE, per the repo's CDN-embed rules.
