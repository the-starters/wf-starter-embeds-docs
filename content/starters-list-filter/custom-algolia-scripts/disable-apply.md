---
title: "Disable Apply"
source: starters-list-filter/custom-algolia-scripts/disable-apply.js
---

Source: `starters-list-filter/custom-algolia-scripts/disable-apply.js`

## What it is

Disables a WF-Algolia Apply button until the filter groups it would commit actually have a
selection. Opt in per button by adding `starters-algolia-disable-empty` next to
`wf-algolia-button="apply"`. The script is idempotent (an init guard on the root element makes
re-running a no-op) and never caches button references: every evaluation re-queries the DOM,
so buttons that WF-Algolia re-renders or that get moved into the mobile dialog keep working.

**Which groups a button watches** mirrors the WF-Algolia scope cascade:

1. If the button has `wf-algolia-fields` (CSV), it watches the groups in scope whose
   `wf-algolia-field` (or `wf-algolia-facet`) matches a listed field. An empty CSV means the
   button watches nothing and stays disabled.
2. Otherwise, if the button sits inside a `wf-algolia-element="filter-group"`, it watches just
   that group.
3. Otherwise it watches every group inside its closest `wf-algolia-element="browse"` wrapper
   (or the whole document if there is none).

**What counts as a selection** is type-aware. A group with `data-wf-algolia-staged="true"`
always counts. Then, by group type:

- **Range** (`wf-algolia-type="range"` or a `range-min` input present): active once either
  handle/input is off its authored bound. Bounds come from `fs-rangeslider-min` /
  `fs-rangeslider-max` on the group, falling back to the inputs' own `min` / `max`
  attributes; current values come from the inputs (or `aria-valuenow` on slider handles).
- **Select** (`wf-algolia-type="select"` or a `select` present): any select with a non-empty
  value.
- **Items** (checkbox/radio, the default): any `wf-algolia-element="filter-item"` that is
  checked, has `aria-pressed="true"`, `data-wf-algolia-active="true"`, or the `is-active`
  class. Items carrying `wf-algolia-reset` ("All"/"Any" options) never count.

**Disabled treatment**: the button's `data-button-theme` is swapped to a disabled theme
(default `disabled`, overridable per button with `data-disabled-theme`), the original theme is
parked in `data-active-theme` for restoring, `aria-disabled="true"` is set, and any inner
native `button` elements get `disabled`. A capture-phase click handler blocks disabled clicks
before they reach WF-Algolia.

**When it re-evaluates**: on any `input` / `change` / `click` inside a filter group, on a
body-wide `MutationObserver` (class, `aria-pressed`, `data-wf-algolia-active`,
`data-wf-algolia-staged`, `value` changes plus DOM insertions), on the WF-Algolia events
`ready`, `filter`, `filter:parent-stage-change`, and `response`, on window `load`, and via a
settle loop that re-runs every 250ms for about 10 seconds after boot while the bundle and UI
finish rendering.

## File structure

```
Disable Apply - JS
```

For pages with a deferred-apply filter UI. Load order relative to the WF-Algolia bundle does
not matter; the script polls for `window.WfAlgolia` and works from the DOM until it appears.

## Markup contract

```html
<div wf-algolia-element="browse">
  <div wf-algolia-element="filter-group" wf-algolia-field="roles">
    <label wf-algolia-element="filter-item">
      <input type="checkbox" /> Designer
    </label>
  </div>

  <!-- Opt-in Apply button; scope here = every group in this browse wrapper -->
  <a wf-algolia-button="apply"
     starters-algolia-disable-empty
     data-button-theme="primary"
     data-disabled-theme="disabled">Apply</a>
</div>
```

## API

Options sit on the Apply button.

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `starters-algolia-disable-empty` | presence | off | Opts the button into disable-when-empty management. |
| `wf-algolia-fields` | CSV of field names | unset | Restricts which groups the button watches (WF-Algolia's own scoping attribute; read, not invented, by this script). Empty CSV = permanently disabled. |
| `data-disabled-theme` | theme name | `disabled` | The `data-button-theme` value applied while disabled. |

State the script writes:

| Attribute / class | On | Meaning |
| --- | --- | --- |
| `aria-disabled="true"` | button | Currently disabled; clicks are blocked. |
| `data-button-theme` | button | Swapped to the disabled theme and back. |
| `data-active-theme` | button | Parking spot for the original theme while disabled. |
| `disabled` | inner `button` elements | Kept in sync for keyboard and assistive tech. |

## Notes & gotchas

- Disabled styling is theme-driven: nothing changes visually unless your CSS styles the
  disabled `data-button-theme` value. The click blocking works regardless.
- The click blocker relies on `aria-disabled`, so do not set that attribute on these buttons
  yourself.
- Range detection compares against authored bounds; if neither `fs-rangeslider-min/max` nor
  input `min`/`max` are set, a range group can never register as active (only staging will
  enable the button).
- The body-wide observer plus 250ms settle loop are deliberate belt-and-braces for late
  rendering; expect evaluations to be frequent but cheap.
