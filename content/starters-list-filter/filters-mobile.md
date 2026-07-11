---
title: "Filters Mobile"
source: starters-list-filter/filters-mobile.js
---

Source: `starters-list-filter/filters-mobile.js`

## What it is

Responsive re-parenting for the filter panel, plus desktop auto-apply. On `DOMContentLoaded`
the script finds the panel and its two possible parents, then watches the Webflow mobile
breakpoint (`max-width: 767px` via `matchMedia`):

- **Placement.** On mobile the panel is appended into the `data-filter-landing` element
  (typically inside the filter modal); on desktop it moves back into `data-filter-home`.
  The move only happens when the panel is not already in the right parent.
- **Desktop auto-commit.** A `MutationObserver` watches every
  `wf-algolia-element="filter-group"` inside the panel for `data-wf-algolia-staged`
  flipping to `true`. On desktop that immediately calls `window.WfAlgolia.commitStaging()`,
  so staged picks apply instantly without an Apply button. On mobile staged picks are left
  alone (the user commits via Apply).
- **Breakpoint change.** Crossing the breakpoint re-places the panel and runs a commit, so
  picks staged on mobile are flushed when the viewport enters desktop.

## File structure

```
Filters Mobile - JS
```

For pages that have the filter panel. Load it alongside the WF-Algolia bundle; the commit
call is guarded, so it is safe even if `window.WfAlgolia` is not ready yet.

## Markup contract

```html
<!-- Desktop position -->
<div data-filter-home>
  <div data-filter-panel>
    <!-- WF-Algolia filter groups live in here -->
    <div wf-algolia-element="filter-group">…</div>
  </div>
</div>

<!-- Mobile position (e.g. inside the filter modal) -->
<div data-filter-landing></div>
```

All three attributes are required; if any one is missing the script silently does nothing.

## API

| Hook | On | Purpose |
| --- | --- | --- |
| `data-filter-panel` | the filter panel | The element that gets moved between the two slots. |
| `data-filter-home` | desktop slot | Parent of the panel above 767px. |
| `data-filter-landing` | mobile slot | Parent of the panel at 767px and below. |

The script also reads (does not set) `data-wf-algolia-staged` on
`wf-algolia-element="filter-group"` elements inside the panel; that attribute is written by
the WF-Algolia bundle.

## Notes & gotchas

- Only the first match of each attribute is used (`querySelector`): one panel per page.
- Filter groups are collected once on `DOMContentLoaded`. Groups rendered into the panel
  later are not observed, so their staged changes will not auto-commit on desktop.
- The panel is moved with `appendChild`, so it always lands at the end of the target slot.
- The 767px breakpoint is hard-coded to match Webflow's mobile breakpoint.
