---
title: "Transparent Nav"
source: navbar-embeds/transparent-nav-bg.js
---

Source: `navbar-embeds/transparent-nav-bg.js` + `navbar-embeds/transparent-nav-bg.css`

## What it is

Support code for the navbar v2 **transparent variants**
(`data-wf--navbar-v2--variant="transparent"` and `"transparent-light"`), which start with no
background over the page hero.

- **`transparent-nav-bg.js`** fades the navbar's `.nav_bg` layer in once the page scrolls past
  10px and back out at the top, by toggling the layer's `opacity`. It runs the check once on
  load too, so a page restored mid-scroll starts in the right state.
- **`transparent-nav-bg.css`** covers the mobile menu: while Webflow's menu is open
  (`[data-nav-menu-open]` present), the navbar section gets its solid background color from
  the `--_navbar---main--background` variable, so the menu never floats over the hero with a
  see-through bar.

## Markup contract

```html
<div class="section_navbar" data-wf--navbar-v2--variant="transparent">
  <div class="nav_bg"></div>   <!-- the fading background layer -->
  …
</div>
```

## Notes & gotchas

- The script binds one scroll listener per matching navbar and does nothing on the solid
  variants; a transparent navbar without a `.nav_bg` child is skipped.
- Opacity is set inline (`0` / `1`); give `.nav_bg` its transition in Webflow if you want the
  fade eased.
