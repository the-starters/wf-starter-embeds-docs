---
title: "Total Filters"
---

Source: `starters-list-filter/total-filters.js`

## What it is

A live "active filters" counter. The script reads `window.WfAlgolia.getFilterState()` and
writes the total into the text of every `data-total-filter-count` element. Counting rule per
state field: an array counts its length, any other truthy value counts as 1.

Updates arrive three ways:

- **Events.** It subscribes to WF-Algolia's `ready` and `filter` events and re-renders on
  each.
- **API polling on boot.** If `window.WfAlgolia` is not ready when the script runs, it
  retries wiring every 100ms for up to 10 seconds.
- **Safety net.** An unconditional 400ms interval re-reads the committed state forever, in
  case an event is missed.

## File structure

```
Total Filters - JS
```

For pages using WF-Algolia filters. Works regardless of load order relative to the WF-Algolia
bundle (it polls for the API).

## Markup contract

```html
<!-- Text is replaced with the count, e.g. "3" -->
<span data-total-filter-count></span>
```

## API

| Hook | On | Purpose |
| --- | --- | --- |
| `data-total-filter-count` | any text element | Its `textContent` is replaced with the current active-filter count. Multiple elements are all updated. |

## Notes & gotchas

- If `getFilterState()` is unavailable, nothing is written; placeholder text you put in the
  element stays until the API appears, then gets replaced.
- The count is of state fields/values, not visible chips: a range filter stored as a single
  value counts as 1, a multi-select array counts once per selected value.
- The 400ms interval runs for the life of the page; it is cheap but means the counter always
  reflects committed state within half a second even without events.
