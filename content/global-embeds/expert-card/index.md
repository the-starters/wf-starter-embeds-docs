---
title: "Expert Card"
source: global-embeds/expert-card
---

Source: Webflow, `Global Embeds / Expert Card`

## What it is

Layout + touch helper for the expert card grid (JS only; the visual styling lives in Webflow).
It does three things:

1. **Measures the jobs list.** For every `.expert-card_jobs-wrapper` it reads the full
   `scrollHeight` and writes it to the card as the CSS variable
   `--expert-card-jobs-open-height`, so your Webflow CSS can animate the jobs reveal to that exact
   height.
2. **Equalizes company lists.** All `.expert-card_company-list` elements get the same
   `min-height` / `max-height` (the tallest one on the page), so cards in a row line up.
3. **Tap-to-open on touch devices.** On touch UIs (`hover: none`), tapping anywhere on an
   `.expert-card_item` (except on links, buttons, or form controls) toggles the
   `expert-card_item--jobs-open` class (plus `aria-expanded="true"` while open). On hover-capable
   devices nothing is toggled, and switching from touch to hover clears any open cards.

## File structure

```
Expert Card
├── Expert Card - JS
└── expert-card-browse-loader.js   (see [Browse Loader](./browse-loader.md))
```

Path in the CDN repo: `global-embeds/expert-card/expert-card-browse-loader.js`.

There is no companion CSS; the reveal/equalize styles consuming the class and variable above are
built in Webflow.

## Markup contract

```html
<div class="expert-card_item">
  <!-- …name, avatar, etc.… -->
  <div class="expert-card_company-list">…companies…</div>
  <div class="expert-card_jobs-wrapper">…jobs list (revealed on hover/tap via your CSS)…</div>
</div>
```

Each jobs wrapper must sit inside (`closest`) an `.expert-card_item`; wrappers outside a card are
ignored.

## API

No configuration attributes.

| Class | On | Purpose |
| --- | --- | --- |
| `expert-card_item` | card | Tap target on touch; receives the open class and the height variable. |
| `expert-card_jobs-wrapper` | jobs list | Measured to compute the open height. |
| `expert-card_company-list` | company list | Height-equalized across all cards on the page. |
| `expert-card_item--jobs-open` | card (set by JS) | Touch-open state; style the jobs reveal off this. |

| Hook | Type | Purpose |
| --- | --- | --- |
| `--expert-card-jobs-open-height` | CSS variable on the card | Pixel height of the fully open jobs list. |
| `expert-cards:relayout` | `window` event | Dispatch this after mutating card content to force a re-measure. |
| `expert-cards:relayout:done` | `window` event | Dispatched by this script when a measurement pass finishes; other embeds settle on it. |

## Notes & gotchas

- Measurement runs on `window.load`, again when web fonts finish loading, and on resize, but the
  resize pass is debounced a full **1 second** and only fires when the width actually changed
  (mobile URL-bar height jitter is ignored).
- Other embeds can trigger a recalc: `window.dispatchEvent(new Event('expert-cards:relayout'))`.
- The company-list equalization uses a double `requestAnimationFrame` and a run id, so overlapping
  runs cancel cleanly, but it equalizes across **all** lists on the page, not per row.
- The tap toggle is a document-level listener, so cards added later still work; the height
  measurement, however, only sees cards present when a layout pass runs (use the relayout event
  after injecting content).
- `aria-expanded` is set on the card itself, which is a plain `div`: fine as a styling/state
  hook, but not announced as a control by screen readers.
- **Every layout pass ends with `expert-cards:relayout:done`** on `window`, so other embeds can
  wait for the height writes instead of guessing at a delay. It fires from the window-load,
  `fonts.ready`, and resize passes as well as from a requested `expert-cards:relayout`, so a
  listener that only cares about one particular pass has to arm itself first — see
  [Browse Loader](./browse-loader.md), which ignores `relayout:done` until the engine's first
  `results` event.
- **Companion embeds.** [Browse Loader](./browse-loader.md) masks the `/all-starters` browse list
  while the engine re-renders and settles on `relayout:done`.
  [Replica List](../replica-list/index.md) covers the opposite gap: cards rendered inside a
  `display: none` modal measure as `0` and are never re-measured, so its relayout companion
  dispatches `expert-cards:relayout` the first time such a list becomes visible.
