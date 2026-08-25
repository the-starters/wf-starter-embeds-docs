---
title: "Millify"
source: global-embeds/millify.js
---

Source: `global-embeds/millify.js`

## What it is

Attribute-driven number formatting: long numbers render as `1.2K` / `3.4M` / `5B`. Mark an element
`data-millify` and the embed rewrites its text on load, and again whenever a matching element is
added to the DOM.

One deferred tag in **Project Settings → Custom Code → Footer Code** (or a page footer):

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/global-embeds/millify.js"></script>
```

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
<div data-millify="1450000">1,450,000</div>   <!-- → 1.4M -->

<!-- Options -->
<div data-millify data-millify-precision="2">1450000</div>            <!-- → 1.45M -->
<div data-millify data-millify-space="true">1450000</div>             <!-- → 1.4 M -->
<div data-millify data-millify-lowercase="true">1450000</div>         <!-- → 1.4m -->
<div data-millify data-millify-units=",k,m,bn">1450000</div>          <!-- → 1.4m -->
<div data-millify data-millify-max="1000000">12312312</div>           <!-- → untouched -->
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
| `data-millify-units` | same element | comma-separated list | `,K,M,B,T,P` | Custom unit suffixes, smallest first. The first entry is the "no unit" slot. |
| `data-millify-max` | same element | non-negative number (commas ok) | — | Domain ceiling. A value above it is treated as bad data and the text is left untouched. `0` formats nothing but zero itself. |
| `data-millify-raw` | same element | — | — | Written by JS: the parsed source number, used for idempotency and re-formatting. |

`window.__startersMillify(value, { precision, units, space, lowercase, max })` exposes the pure
formatter for testing and console use. It returns `{ ok: true, text, raw }`, or
`{ ok: false, reason }` where `reason` is `parse`, `range`, `max`, or `units`.

## Notes & gotchas

- **Failure is graceful and silent to the visitor.** A value that will not parse, is infinite,
  falls outside the safe integer range, exceeds an authored `data-millify-max`, or is too large
  for the available units leaves the element's text **untouched** rather than rendering
  something wrong. This is deliberate: a value the embed cannot represent is usually a data
  bug, and leaving it visible is what surfaces it. Do not "fix" this into a dash or a zero.
- **The practical ceiling is `Number.MAX_SAFE_INTEGER`** (9,007,199,254,740,991 → `9P`), which is
  why the default units stop at `P`. A `1e18` value is refused, not rendered as `1E`.
- **Rounding can promote a unit.** At precision 1, `999,999` would round to `1000K`; the formatter
  re-runs its divide loop on the rounded value and renders `1M` instead (the same edge-case fix
  upstream millify carries).
- **The number is *not* localized.** Output goes through `toLocaleString` pinned to `en-US`,
  because every consumer renders a USD price and a European locale would turn `$1.5K` into
  `$1,5K` — a typo at best, a hundredfold error at worst. Fraction digits are pinned to the
  count already produced by rounding, so a high-precision value is never silently re-rounded.
- **Rounding is `toFixed`, so a `.x5` boundary goes whichever way its double falls.**
  `1450000` renders `1.4M` because the binary double for `1.45` sits just *under* it —
  but `1350000` renders `1.4M` too, because `1.35`'s double sits just *over*. Don't
  predict the direction from the decimal; raise `data-millify-precision` when the extra
  digit matters.
- **`data-millify-max` is a domain guard, not a formatting one.** It exists so a page can say
  "a price above this is bad data". Exceeding it produces the same silent refusal as any other
  unrenderable value, but the staging warning names the ceiling rather than blaming the number,
  so the author is sent to their own attribute. The default is no ceiling; `0` is a real ceiling
  meaning "format nothing but zero", which is how you switch formatting off for one element.
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
