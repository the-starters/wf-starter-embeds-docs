---
title: "Intro"
source: starters-list-filter
---

Source: `starters-list-filter/`

Companion scripts for the Starters list/browse pages whose filtering is powered by the
WF-Algolia bundle (the `window.WfAlgolia` global). Everything in this group either adapts the
filter UI for mobile or patches WF-Algolia's default behavior. None of these scripts talk to
Algolia directly; they all work through `window.WfAlgolia` and the `wf-algolia-*` attributes
that the bundle renders.

## Scripts in this group

- **Filters Mobile** (`filters-mobile.js`): moves the filter panel between its desktop home
  and a mobile landing slot at the Webflow mobile breakpoint, and auto-commits staged filter
  picks on desktop.
- **Modal Mobile** (`modal-mobile.js`): re-fires `resize` after the mobile filter modal opens
  so layout-dependent widgets recalculate.
- **Total Filters** (`total-filters.js`): renders a live count of active filters into any
  `data-total-filter-count` element.

## Custom Algolia Scripts (subgroup)

Targeted patches on top of the WF-Algolia filter UI:

- **Disable Apply.** Disables an Apply button until its filter groups have a selection.
- **Filter Visibility Empty.** Opts elements out of WF-Algolia's hide-on-empty behavior.
- **Filters Text.** Prettifies raw facet keys/values in chips and value slots.
- **Range Backfill Rate.** Backfills emptied range inputs to their authored bounds.
- **Scroll Filter.** Scrolls a filter option list back to the top after a selection.
- **Clear Filter Visibility.** Global reset button behavior plus hide-until-useful visibility
  (JS + CSS pair).
