---
title: "Timepicker"
---

Source: Webflow — `Global Embeds / Form Embeds / Timepicker`

## What it is

Attribute-driven time picker for Webflow, built on jQuery UI plus the Trent Richardson
timepicker-addon (v1.6.3). Tag any input with `data-input-timepicker` and it opens a time widget with
hour/minute dropdowns (or sliders) and Now/Done buttons. Supports standalone time fields and linked
start/end ranges, and shares the datepicker embed's modal-reparenting and scroll-tracking behavior —
plus one extra trick: because the time widget is tall, it flips **above** the input when there's more
room above than below.

The script waits for `window.jQuery` (polling every 50ms), then self-loads jQuery UI 1.14.1 and the
addon's JS and CSS from CDNs if they aren't already present, deduplicating loads through a
`window.__wfInputTimepicker` namespace and by checking for existing script/link tags. Everything runs
as a plain IIFE.

## Markup contract

Standalone field:

```html
<input type="text" placeholder="00:00" data-input-timepicker>
```

Standalone, 12-hour with AM/PM and 15-minute steps:

```html
<input type="text"
       data-input-timepicker
       data-input-timepicker-format="hh:mm tt"
       data-input-timepicker-step="15">
```

Linked start/end range — both inputs inside one group wrapper:

```html
<div data-input-timepicker-group>
  <input type="text" data-input-timepicker data-input-timepicker-role="start" placeholder="00:00">
  <input type="text" data-input-timepicker data-input-timepicker-role="end"   placeholder="00:00">
</div>
```

When paired: picking **start** raises the end picker's `minTime` to the picked time; picking **end**
lowers the start picker's `maxTime` to the picked time (bounds are passed as `HH:mm:ss`). End can't
be earlier than start; an equal time is allowed.

## API

### Required

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-input-timepicker` | each input | Marks the input as a timepicker. Value is ignored. |

### Pairing (start/end range)

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-input-timepicker-group` | wrapper element | Links the start/end pair found inside it. |
| `data-input-timepicker-role="start"` | start input | Start of the range. |
| `data-input-timepicker-role="end"` | end input | End of the range. |

A group missing one of the two roles falls back to initializing every `data-input-timepicker` inside
it as an independent picker.

### Optional — per input

| Attribute | Default | Maps to (addon) | Purpose |
| --- | --- | --- | --- |
| `data-input-timepicker-format` | `HH:mm` | `timeFormat` | Display format (addon tokens: `H`/`HH` 24-hour, `h`/`hh` 12-hour, `mm` minute, `ss` second, `tt` am/pm). |
| `data-input-timepicker-control` | `select` | `controlType` | `select` for hour/minute dropdowns, `slider` for the addon's slider UI. |
| `data-input-timepicker-step` | `5` | `stepMinute` | Minute increment. |
| `data-input-timepicker-step-hour` | `1` | `stepHour` | Hour increment. |
| `data-input-timepicker-min` | — | `minTime` | Earliest selectable time, e.g. `09:00`. |
| `data-input-timepicker-max` | — | `maxTime` | Latest selectable time, e.g. `18:00`. |

An empty attribute value is treated the same as an absent attribute (the default applies).

### Modal support

| Attribute / event | On | Purpose |
| --- | --- | --- |
| `data-input-timepicker-modal` | modal dialog element | When an input lives inside this element, the shared `#ui-datepicker-div` is reparented into it on open so it isn't clipped, forced to `position: absolute`, re-anchored to the input, and clamped to the modal's width. Falls back to the closest `.modal_dialog`. |
| `modal-open` (window `CustomEvent`) | dispatched by your modal code | Re-runs init inside `event.detail.modal`. |

```js
window.dispatchEvent(new CustomEvent('modal-open', { detail: { modal: modalEl } }))
```

### Set by the script (don't author these)

| Attribute / data | On | Purpose |
| --- | --- | --- |
| `data-input-timepicker-initialized="true"` | group wrapper | Idempotency guard — a group inits once. |
| jQuery data `wfTimepickerInited` | input | Per-input idempotency guard. |

### CSS hooks (from `timepicker.css`)

| Selector | Purpose |
| --- | --- |
| `.ui-datepicker` (shell) | Self-contained copy of the picker shell styling, so the timepicker looks right even on pages without the datepicker embed (identical values; harmless if both load). |
| `.ui-timepicker-div` (and descendants) | The addon's body: section header, styled hour/minute selects with an inline SVG chevron, themed slider fallback. |
| `.ui-timepicker-div dl dt.ui_tpicker_time_label`, `dd.ui_tpicker_time` | The read-only selected-time preview row — hidden. |
| `.ui-datepicker .ui-datepicker-buttonpane` | Now/Done button row; the Done (close) button is styled as the primary dark action. |
| `[data-input-timepicker-modal]`, `.modal_dialog` | Forced to `overflow: visible` so the reparented picker isn't clipped. |
| `#ui-datepicker-div` (also scoped inside the two modal selectors) | `z-index: 999999` so the picker sits above modal chrome. |

A `max-width: 30rem` media query caps the picker at `calc(100vw - 1.5rem)` wide and
`calc(100vh - 1.5rem)` tall with internal scrolling, so the dropdowns and Done button stay reachable
on short viewports.

## File structure

```
Timepicker
├── Timepicker - CSS
└── Timepicker - JS
```

The script self-loads jQuery UI and the addon (JS + CSS) — it only needs jQuery on the page
(Webflow includes it by default), so load order relative to other embeds doesn't matter.

## Notes & gotchas

- **Idempotent.** Inputs are marked with jQuery data on init and groups with
  `data-input-timepicker-initialized="true"`; safe to run the embed more than once or re-fire
  `modal-open`. jQuery UI and the addon load once per page.
- **Default format is `HH:mm` (24-hour)** to match a `00:00` placeholder. Switch to `hh:mm tt` for
  AM/PM.
- **Pair bounds allow equal times** (unlike the datepicker embed, which keeps start and end a day
  apart). Also note the pair locks only fire on `onSelect` — values prefilled before init do **not**
  constrain the sibling picker.
- **Flips above the input** when the widget is taller than the space below and there's more room
  above — re-evaluated on every scroll/resize tick while open.
- **Inside a modal**, the same positioning fix as the datepicker applies: the shared
  `#ui-datepicker-div` is reparented into the modal, forced to `position: absolute`, re-anchored
  against its real offset parent, clamped to the modal width, and tracked on scroll (capture phase)
  and resize via `requestAnimationFrame`.
- The addon renders inside jQuery UI's shared singleton `#ui-datepicker-div`, so the timepicker and
  datepicker embeds coexist — they share the same floating element, never open at once.
- The addon's own CSS is injected from cdnjs at runtime (in addition to `timepicker.css`); the embed
  CSS then overrides the addon look.
- If jQuery never appears on the page, the script polls forever and nothing initializes — it does not
  load jQuery itself.
- No ES modules, no wrapper `script` tags in the file — raw IIFE, per the repo's CDN-embed rules.
