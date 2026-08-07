---
title: "Millify"
source: global-embeds/millify.js
---

Source: `global-embeds/millify.js`

## What it is

Attribute-driven number formatting: long numbers render as `1.2K` / `3.4M` / `5B`. Mark an element
`data-millify` and the embed rewrites its text on load, and again whenever a matching element is
added to the DOM.

The formatting algorithm is adapted from [millify v6.1.0](https://www.npmjs.com/package/millify)
(MIT), inlined rather than bundled so the embed stays a single dependency-free file.

Two sources are supported. With no value, the element's own `textContent` is the number — the CMS
binding case. With a value (`data-millify="12345"`), that value is the number and the visible text
may already be formatted.

## Markup contract

```html
<!-- From the element's own text (CMS-bound). "12,345" parses fine. -->
<div data-millify>12345</div>            <!-- → 12.3K -->

<!-- From the attribute value; the visible text is ignored as a source. -->
<div data-millify="1450000">1,450,000</div>   <!-- → 1.5M -->

<!-- Options -->
<div data-millify data-millify-precision="2">1450000</div>            <!-- → 1.45M -->
<div data-millify data-millify-space="true">1450000</div>             <!-- → 1.5 M -->
<div data-millify data-millify-lowercase="true">1450000</div>         <!-- → 1.5m -->
<div data-millify data-millify-units=",k,m,bn">1450000</div>          <!-- → 1.5m -->
```

Input text is trimmed, then commas and all whitespace (including non-breaking spaces) are stripped,
so CMS text like `12,345` or `12 345` parses.

## xAttribute JSON

Default formatting, reading the element's own text:

```json
{ "data-millify": "" }
```

Two decimal places with a separating space:

```json
{ "data-millify": "", "data-millify-precision": "2", "data-millify-space": "true" }
```

## API

| Attribute | On | Values | Default | Purpose |
| --- | --- | --- | --- | --- |
| `data-millify` | any element | empty, or the number to format | — | Marks the element. Empty reads `textContent`; a value overrides it. |
| `data-millify-precision` | same element | non-negative integer | `1` | Decimal places. Integers stay exact regardless. |
| `data-millify-space` | same element | `"true"` | off | Insert a space before the unit. |
| `data-millify-lowercase` | same element | `"true"` | off | Lowercase the unit (`1.5k`). |
| `data-millify-units` | same element | comma-separated list | `,K,M,B,T,P,E` | Custom unit suffixes, smallest first. The first entry is the "no unit" slot. |
| `data-millify-raw` | same element | — | — | Written by JS: the parsed source number, used for idempotency and re-formatting. |

`window.__startersMillify(value, { precision, units, space, lowercase })` exposes the pure
formatter for testing and console use. It returns `{ ok: true, text, raw }` or `{ ok: false }`.

## Notes & gotchas

- **Failure is graceful and silent to the visitor.** A value that will not parse, is infinite,
  falls outside the safe integer range, or is too large for the available units leaves the
  element's text **untouched** rather than rendering something wrong.
- **Rounding can promote a unit.** At precision 1, `999,999` would round to `1000K`; the formatter
  re-runs its divide loop on the rounded value and renders `1M` instead (the same edge-case fix
  upstream millify carries).
- **The number is localized.** Output goes through `toLocaleString` with the browser's
  `navigator.languages`, so a European locale renders `1,5K`. Fraction digits are pinned to the
  count already produced by rounding, so a high-precision value is never silently re-rounded.
- **Late content is handled.** A MutationObserver watches `document.body` for added nodes and
  processes any `[data-millify]` inside them, so CMS re-renders and injected cards format too. Only
  `childList` is observed, never attributes or `characterData`: the embed's own `textContent` writes
  fire childList mutations whose added nodes are text nodes, and filtering to element matches is
  what keeps it from reprocessing its own output.
- **Re-processing is idempotent, but not free of assumptions.** On the `textContent` path the embed
  stores the parsed number in `data-millify-raw` and re-formats only when the visible text no longer
  matches what it last wrote — which is how a CMS dropping a fresh number in gets picked up. Change
  a formatting option attribute after load and nothing re-runs on its own.
- **Staging-only diagnostics.** Unparseable values and an invalid `data-millify-precision` warn on
  `localhost`, `127.0.0.1`, `*.webflow.io`, and `*.trycloudflare.com`, or when
  `window.STARTERS_DEBUG === true`. Production is silent.
- Idempotent via `window.__startersMillifyInit`; safe to load twice.
- For truncating CMS-fed strings rather than numbers, see [Text Methods](./text-methods.md).
