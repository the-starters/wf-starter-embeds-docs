---
title: "Loader"
---

Source: Webflow, `Global Embeds / Loader` · repo mirror: `global-embeds/loader/loader.js`

## What it is

A shared **loading-overlay helper**. The embed defines one global function, `setLoader()`, that
other scripts call to show or hide the `[data-loader]` overlay element while an async operation
(Xano call, form submit) is in flight:

```js
setLoader(true)              // show the page's loader
setLoader(false)             // fade it out (300ms), then display: none
setLoader(true, someModal)   // scope: the [data-loader] inside that wrapper
```

Showing sets the overlay to `display: flex` with visible/opacity/pointer-events on; hiding
flips those off and, after a 300ms opacity transition, sets `display: none` so the overlay
stops intercepting clicks.

Not to be confused with the [Utils Loader](../utils/loader.md) (`loadEnvScript`, a script
loader), which has the same name but an unrelated job.

## File structure

```
Loader
└── Loader - JS
```

The overlay's spinner styling comes from the [Spinner](style-embeds/spinner.md) style embed.

## Markup contract

```html
<div data-loader class="loader_overlay">
  <div data-spinner="1"></div>
</div>
```

One `[data-loader]` per scope: page-level by default, or one inside each modal/wrapper that
scripts pass as the second argument.

## Notes & gotchas

- This is a **bare function definition, not an IIFE**. It's a helper for other embeds, and it
  depends on the shared `qs()` selector helper being defined by the page's controller scripts.
  Load it alongside them; on a page with no `qs` global, calling `setLoader` throws.
- Visibility is written as an **inline `style` attribute**, so it wins over classes; don't try
  to override the shown/hidden state with CSS alone.
- The 300ms hide delay matches the opacity transition, so a rapid show → hide → show sequence
  can race the `setTimeout` and end up hidden; re-call `setLoader(true)` after async steps
  rather than assuming it stayed visible.
