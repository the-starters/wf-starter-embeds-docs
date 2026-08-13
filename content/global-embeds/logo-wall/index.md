---
title: "Logo Wall"
source: global-embeds/logo-wall/logo-wall.js
sources:
  - global-embeds/logo-wall/logo-wall.css
---

Source: `global-embeds/logo-wall/logo-wall.js` · companion stylesheet:
`global-embeds/logo-wall/logo-wall.css` (same `@release`)

## What it is

Attribute-driven **Logo Wall**: a CMS list of brand logos split into looping
horizontal **Tracks**. The motion is Marquee UX (continuous, no snap) — the same
*feel* as the homepage testimonials strip, not a shared engine and not that
strip's markup.

On init the script unwraps Webflow Collection List / `display: contents` wrappers,
deals unique logos round-robin across Tracks (default 3), clones inside each Track
until it overflows, then runs GSAP's `horizontalLoop` helper. Odd Tracks run RTL.
Hover pauses that Track. `prefers-reduced-motion: reduce` freezes the bands.

GSAP must already be on the page (it is, sitewide). Without GSAP the Tracks still
build; they just do not loop.

## File structure

```
Logo Wall
├── Logo Wall - CSS
└── Logo Wall - JS
```

Load CSS in **Head**, JS with `defer` before `</body>` (or Footer Code):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/global-embeds/logo-wall/logo-wall.css">
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/global-embeds/logo-wall/logo-wall.js"></script>
```

Production pins the tag (`@vX.Y.Z` instead of `@latest`).

## Markup contract

```html
<div class="logo-wall_list-wrapper" data-logo-wall-element="wrapper">
  <!-- Collection List; unwrapped on init -->
  <div class="logo-wall_logo-item" data-logo-wall-element="item">
    <img class="logo-wall_logo-image" alt="" />
  </div>
</div>
```

Homepage can omit every config attribute and still get 3 tracks, default speed,
and pause-on-hover. Put `data-logo-wall-element="item"` on the inner logo cell
(the first visible child of each Collection Item) so it survives unwrap.

`data-logo-wall-element="track"` is **script-owned**. Do not author it.

## xAttribute JSON

`wrapper` is the overflow root:

```json
{ "data-logo-wall-element": "wrapper" }
```

`item` is each logo cell:

```json
{ "data-logo-wall-element": "item" }
```

Optional config on the same wrapper node:

```json
{
  "data-logo-wall-element": "wrapper",
  "data-logo-wall-tracks": "3",
  "data-logo-wall-speed": "0.4",
  "data-logo-wall-pause-on-hover": "true"
}
```

## API

| Attribute | Where | Required | Default |
| --- | --- | --- | --- |
| `data-logo-wall-element="wrapper"` | overflow root | yes | — |
| `data-logo-wall-element="item"` | each logo cell | yes | — |
| `data-logo-wall-element="track"` | row | script | — |
| `data-logo-wall-tracks` | wrapper | no | `3` |
| `data-logo-wall-speed` | wrapper | no | `0.4` (~40px/s) |
| `data-logo-wall-pause-on-hover` | wrapper | no | on; set `false` to opt out |

Booleans are `"true"` / `"false"`. Alternate direction is always on (odd Tracks RTL).

## Notes & gotchas

- **Classes do nothing.** Missing wrapper or zero `item` nodes is a no-op.
  After unwrap, any leftover child that is not an `item` skips that instance
  with a staging warning (`*.webflow.io` / localhost / `STARTERS_DEBUG`) — no
  class fallback.
- **Designer canvas is skipped** (`html.wf-design-mode`) so Collection Lists stay editable.
- **Logo size and gap stay Designer.** Companion CSS only forces column overflow,
  flex tracks, and `column-gap: inherit` from the wrapper.
- **Short rows clone** until the Track is at least 2× the wrapper width, capped at
  24 extra copies, including on reduced-motion freeze and when GSAP is absent, so
  a handful of logos still fill the band.
- **A single logo still loops** once the Track is filled; there is no “need two
  children” gate.
- **Images.** Loops arm after in-wall images have loaded (or errored), then again
  on resize (debounced 150ms).
- **Off-screen Tracks pause** via `IntersectionObserver` on the wrapper (intended).
  Hover pause is per Track (`mouseenter` / `mouseleave` only).
- **Not the testimonials marquee** and not `data-marquee="title-company"` (that
  attribute hides empty title@company slots on marquee cards).
