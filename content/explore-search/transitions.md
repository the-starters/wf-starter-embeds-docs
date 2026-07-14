---
title: "Transitions"
source: explore-search-transitions
---

Source: `explore-search-transitions/` (`explore-search-transitions.js` + `explore-search-transitions.css`)

## What it is

Open/close transitions for the full-screen search overlay. On init the overlay is **locked
closed**: the wrapper loses its `is-active` class and gains `inert` + `aria-hidden="true"` (nothing
inside is focusable or clickable). Toggle buttons open it, close buttons and `Escape` close it.

When GSAP is present the open sequence is a clip-path reveal — the wrapper's `clip-path` animates
from a collapsed line at the top to the full rectangle — followed by a staggered fade-up of the
search row (logo, input, close button) and then the filter groups / results header / results body.
On complete, the input is focused. The close sequence fades and lifts the wrapper, then re-locks it
and clears the GSAP-set inline props. Without GSAP the script degrades to a plain
lock/unlock + focus fallback (no animation). It is reduced-motion aware: under
`(prefers-reduced-motion: reduce)` all durations and staggers collapse to `0`.

## File structure

```
Explore Search Transitions
├── explore-search-transitions.css   (companion styles)
└── explore-search-transitions.js
```

GSAP is **optional** — the script checks `typeof gsap !== 'undefined'` and animates only when GSAP
is loaded (using `gsap.matchMedia` for reduced-motion when available). Load with `defer`. Load the
companion CSS so the closed overlay is clipped and non-interactive before the JS runs.

## Markup contract

```html
<!-- Open/close trigger anywhere on the page -->
<button data-brilliance-button>Search</button>

<div data-search-brilliance-wrapper>
  <div class="search-brilliance_search-wrapper">
    <div class="navbar_logo"> … </div>
    <div class="search-brilliance_search-input-wrapper">
      <input id="search-brilliance-input" type="text">
    </div>
    <div class="button_main-wrap">
      <button data-search-brilliance-close>Close</button>
    </div>
  </div>

  <div class="search-brilliance_filter-group"> … </div>
  <div class="search-brilliance_results-header"> … </div>
  <div class="search-brilliance_results-body"> … </div>
</div>
```

The animated targets are matched by **class**: `.search-brilliance_search-wrapper` (and inside it
`.navbar_logo`, `.search-brilliance_search-input-wrapper`, `.button_main-wrap`), plus
`.search-brilliance_filter-group`, `.search-brilliance_results-header`, and
`.search-brilliance_results-body`. Missing targets are skipped gracefully.

## xAttribute JSON

The overlay wrapper:

```json
{ "data-search-brilliance-wrapper": "" }
```

Open/close toggle button (page-level):

```json
{ "data-brilliance-button": "" }
```

Close button (inside the wrapper):

```json
{ "data-search-brilliance-close": "" }
```

Designer-preview toggle (see CSS notes below):

```json
{ "data-search-brilliance-preview": "True" }
```

## API

| Attribute / hook | On | Values | Purpose |
| --- | --- | --- | --- |
| `data-search-brilliance-wrapper` | overlay root | — | The overlay the script controls; gains/loses `is-active`, `inert`, `aria-hidden`. |
| `#search-brilliance-input` | input (by id) | — | Focused when the open timeline completes (or immediately in the fallback). |
| `data-brilliance-button` | any button | — | Click toggles the overlay open/closed. |
| `data-search-brilliance-close` | button inside wrapper | — | Click closes the overlay. |
| `is-active` | class on wrapper | — | Present only while open; drives `pointer-events` in the CSS. |
| `data-search-brilliance-preview` | wrapper (Designer only) | `True` / `False` | In `.wf-design-mode`, previews the open (`True`) or closed (`False`) clip-path. |

Timings (from source, GSAP path): wrapper clip-path `0.6s` `power4.inOut`; row/step fade-up
`0.35s` `power2.out` with `y: 12` and `blur(4px)`; row stagger `0.1s`; close fade `0.35s`
`power2.in` with `y: 16`. All become `0` under reduced motion.

## Companion CSS

`explore-search-transitions.css` handles the closed state and interactivity (GSAP animates
`clip-path`; there is no CSS transition):

- `[data-search-brilliance-wrapper]` — `clip-path: polygon(0 0, 100% 0, 100% 0, 0 0)` (collapsed
  to a flat line at the top) and `pointer-events: none`, so nothing inside is clickable/focusable
  while hidden.
- `[data-search-brilliance-wrapper].is-active` — `pointer-events: auto` (interaction restored
  while open).
- Webflow Designer preview: under `.wf-design-mode`, `data-search-brilliance-preview='True'`
  expands the clip-path (open) and `='False'` collapses it (closed), so you can design either
  state in the canvas.

## Notes & gotchas

- On init the overlay is locked (`lock()`): `is-active` removed, `inert` + `aria-hidden="true"`
  set. Load the CSS so the wrapper is already clipped/non-interactive before the JS runs.
- `isClosing` guards against re-entrancy: open/close calls are ignored while a close is in
  progress.
- Without GSAP, open/close still work but there is no animation — the wrapper is simply
  unlocked/locked and the input focused.
- Reduced motion: when `gsap.matchMedia` is available it drives the `reduceMotion` flag; otherwise
  the script reads `window.matchMedia('(prefers-reduced-motion: reduce)')`.
- Focus uses `input.focus({ preventScroll: true })` with a plain `focus()` fallback.
