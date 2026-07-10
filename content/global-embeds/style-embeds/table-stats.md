---
title: "Table Stats"
---

Source: Webflow, `Global Embeds / Table Stats` · repo mirror: `global-embeds/table-stats.css`

## What it is

The layout for the label/value stat tables used in the contract flow:
`.table-stats_component` is a **two-column grid with a 1px gap** (the gap shows the background
through as hairline dividers), collapsing to one column under 768px.

This is the grid that the [Gen Contract preview](../start-proj-gen-contract/index.md) renders
its `data-preview-contract` LIST-mode rows into, including the invisible pad items the script
appends so an odd row count doesn't leave a hole in the two-column layout (the pads are hidden
on mobile by that embed's own CSS, where the grid is single-column anyway).

## Markup contract

```html
<div class="table-stats_component">
  <div class="table-stats_item">…label + value…</div>
  <div class="table-stats_item">…label + value…</div>
</div>
```

## Notes & gotchas

- The hairline-divider effect depends on the parent/section background showing through the
  `1px` gap, so put the component on the surface color you want the lines to be.
- Keep this file and the Gen Contract preview's pad logic in sync: the pads exist *because*
  the grid is two columns ≥768px. Changing the breakpoint or column count here changes where
  pads are needed there.
