---
title: "Custom Algolia Scripts"
---

Source: `starters-list-filter/custom-algolia-scripts/`

Small, single-purpose patches layered on top of the WF-Algolia filter UI. Each script keys off
the `wf-algolia-*` attributes the bundle already renders (plus a few opt-in
`starters-algolia-*` attributes) and fixes one specific behavior. They are independent; load
only the ones a page needs.

## Scripts in this subgroup

- **Disable Apply** (`disable-apply.js`): keeps an Apply button visually and functionally
  disabled until the filter groups it commits actually have a selection.
- **Filter Visibility Empty** (`filter-visibility-empty.js`): opt-out attribute that keeps an
  element visible when WF-Algolia inline-hides it for being empty.
- **Filters Text** (`filters-text.js`): humanizes raw facet keys and values in filter chips
  and selected-value slots ("also-worked-with" → "Company").
- **Range Backfill Rate** (`range-backfill-rate.js`): restores an emptied range input to its
  authored bound so WF-Algolia always reads two numbers.
- **Scroll Filter** (`scroll-filter.js`): scrolls an opted-in filter option list back to the
  top after a selection re-sorts it.
- **Clear Filter Visibility** (`clear-filter-visibility/`): makes the reset button clear all
  filters and the browse search globally, and hides it until there is something to reset
  (JS + CSS pair).
