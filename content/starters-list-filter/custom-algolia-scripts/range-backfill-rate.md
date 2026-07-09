---
title: "Range Backfill Rate"
---

Source: `starters-list-filter/custom-algolia-scripts/range-backfill-rate.js`

## What it is

A guard for range filters (built for the rate slider): if the user clears one of the two
range inputs, or leaves it non-numeric, the script restores it to its authored bound so
WF-Algolia always reads two valid numbers instead of a `NaN`.

It listens for `input` and `change` in the capture phase — so the backfill happens **before**
WF-Algolia's own handler sees the value — on any `wf-algolia-element="range-min"` /
`"range-max"` input inside a `wf-algolia-element="filter-group"` with
`wf-algolia-type="range"`. Authored bounds are read from the Finsweet wrapper attributes
`fs-rangeslider-min` / `fs-rangeslider-max` on the group first, falling back to the inputs'
own `min` / `max` attributes. An init guard on the root element makes re-running the script a
no-op.

## File structure

```
Range Backfill Rate - JS
```

For pages with a range filter.

## Markup contract

```html
<div wf-algolia-element="filter-group"
     wf-algolia-type="range"
     fs-rangeslider-min="0"
     fs-rangeslider-max="500">
  <input wf-algolia-element="range-min" type="number" min="0" />
  <input wf-algolia-element="range-max" type="number" max="500" />
</div>
```

Both inputs must exist inside the group; if either is missing the group is skipped.

## API

No options — behavior is driven entirely by the standard attributes:

| Hook | On | Purpose |
| --- | --- | --- |
| `wf-algolia-type="range"` + `wf-algolia-element="filter-group"` | group | Marks a group as eligible for backfill. |
| `fs-rangeslider-min` / `fs-rangeslider-max` | group | Primary source for the authored bounds. |
| `min` / `max` | the range inputs | Fallback bounds when the wrapper attributes are absent. |
| `wf-algolia-element="range-min"` / `"range-max"` | inputs | The inputs whose values get backfilled. |

## Notes & gotchas

- If no bound can be found on either the group or the input, that side is left empty — set
  `fs-rangeslider-min`/`-max` (or input `min`/`max`) or the guard cannot help.
- Because it runs in capture on the same event, the user never sees an empty field submitted:
  the value is rewritten in place before the bundle reads it.
- It only reacts to `input`/`change` events; programmatic `value` writes that do not dispatch
  an event are not backfilled.
