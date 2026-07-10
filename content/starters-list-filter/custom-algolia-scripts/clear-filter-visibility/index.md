---
title: "Clear Filter Visibility"
---

Source: `starters-list-filter/custom-algolia-scripts/clear-filter-visibility/`

## What it is

A JS + CSS pair that upgrades the WF-Algolia reset button in two ways:

**1. Global reset behavior.** A delegated click listener catches every
`wf-algolia-button="reset"` click (desktop reset and the separate mobile-dialog reset alike,
wherever each lives) and calls `window.WfAlgolia.clearAllFilters()` directly. That call is
global, ignoring browse scope, which is what makes the button inside the moved mobile modal
work. It also clears any `wf-algolia-element="browse-search"` input that has text and resets
the query via `WfAlgolia.setQuery('')`.

**2. Hide-until-useful visibility.** Reset buttons are hidden (via the `wf-reset-hidden`
class, which the companion CSS turns into `display: none !important`) until there is
something to reset. A button shows when any filter field in `getFilterState()` has values,
or when the browse-search input inside that button's own `wf-algolia-element="browse"`
wrapper has text.

Boot sequence: buttons are pre-hidden immediately, then the script polls every 100ms (up to
150 tries, about 15s) until both `window.WfAlgolia` and at least one reset button exist. Once
wired, visibility syncs on the WF-Algolia `filter` and `response` events, on `input` in the
browse-search fields, and via a 350ms polling backstop that diffs a snapshot of the filter
state plus all search values, so it stays correct even when custom filter UIs bypass the
events.

## File structure

```
Clear Filter Visibility
├── Clear Filter Visibility - CSS
└── Clear Filter Visibility - JS
```

Without the CSS the JS still toggles the class, but nothing hides. Load order relative to
the WF-Algolia bundle does not matter; the boot poll waits for it.

## Markup contract

```html
<div wf-algolia-element="browse">
  <input wf-algolia-element="browse-search" type="text" />
  <a wf-algolia-button="reset">Clear all</a>
</div>
```

Standard WF-Algolia attributes only; there is no extra opt-in attribute. Every reset button on the
page is managed.

## API

| Hook | On | Purpose |
| --- | --- | --- |
| `wf-algolia-button="reset"` | button | Clicks are intercepted for a global clear; visibility is managed. |
| `wf-algolia-element="browse-search"` | search input | Cleared on reset; its text also keeps the sibling reset button visible. |
| `wf-reset-hidden` (class) | button | Written by the JS, styled by the CSS: `display: none !important`. |

The CSS file contains that single rule:

```css
[wf-algolia-button="reset"].wf-reset-hidden { display: none !important; }
```

## Notes & gotchas

- The reset is global by design: any reset button clears **all** filters and the search,
  regardless of which browse wrapper it sits in.
- Buttons stay hidden forever if `window.WfAlgolia` never appears (the poll gives up after
  about 15 seconds); the feature degrades to "no reset button" rather than a broken one.
- Query-driven visibility is scoped: a search term only reveals the reset button inside the
  same `browse` wrapper, while active filters reveal every reset button.
- Expect a brief flash-then-hide on load if the buttons are visible by default; the class is
  applied as early as the script runs, but that is still after first paint. Repeated
  `preHide()` calls during the boot poll re-hide anything WF-Algolia re-renders.
