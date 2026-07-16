---
title: "Styles"
source: explore-search/explore-search.css
---

Source: `explore-search/explore-search.css`

## What it is

The `/search-brilliance` page stylesheet (added in **v1.25.1**), with each block marked by a
section comment in the file. Where the rest of this group is behavior, this file carries the
page-level CSS that the search UI assumes:

- **Filter checkboxes and radios.** The check icon (`.icon-20.is-checkbox-starters`) stays
  hidden until its input is checked, then the label whitens and the box tints; small radio
  filters whiten their label the same way. Built on `:has(input:checked)`.
- **Result grids.** Experts render in a 3-column grid, learn content in a 2-column grid;
  both collapse to flex under 768px.
- **Selected filters reveal.** `[data-selected-filters]` stays hidden until the engine
  actually injects a filter tag (`:has(… > .wf-algolia-injected)`), and is forced visible in
  the Designer for styling.
- **Loader.** The spinning-ring animation for the [List Loader](./list-loader.md)'s
  `[data-loader]` element, colored by the `--_colors---search-brilliance--loader-*` tokens.
- **Active tab.** The active tab button takes its fill and color from the
  `--_colors---tabs--*` tokens.
- **Learn type visibility.** `[data-learn-type]` cards are hidden except
  `[data-learn-type='session']`.

## File structure

```
Explore Search Styles - CSS
```

Load it once on the search page. There is no JS in this file and no init; the selectors do
all the work.

## Notes & gotchas

- The checkbox and selected-filters reveals rely on `:has()`, so they need a browser that
  supports it (all evergreen browsers do).
- `.wf-design-mode` rules force the results wrapper and selected-filters row visible on the
  Designer canvas, where the engine never runs.
