---
title: "Scroll Filter"
---

Source: `starters-list-filter/custom-algolia-scripts/scroll-filter.js`

## What it is

Scroll reset for long filter option lists. WF-Algolia re-renders/re-sorts a group's option
list after a selection (selected items typically move to the top); if the user had scrolled
deep into the list, they are left staring at the middle of it. For opted-in groups, this
script scrolls the marked list container back to the top after each selection.

It uses a single delegated `change` listener: when an `input` inside a group carrying
`starters-algolia-scroll-on-select="true"` changes, it waits two animation frames (so the
bundle's re-render has happened) and then scrolls the group's
`starters-algolia-scroll-list` element to the top. The scroll is smooth, or instant when the
user has `prefers-reduced-motion: reduce`. Already-at-top lists are a no-op.

## File structure

```
Scroll Filter - JS
```

## Markup contract

```html
<div wf-algolia-element="filter-group"
     starters-algolia-scroll-on-select="true">
  <!-- the scrollable container (overflow: auto in your CSS) -->
  <div starters-algolia-scroll-list>
    <label wf-algolia-element="filter-item"><input type="checkbox" /> …</label>
    <!-- × N -->
  </div>
</div>
```

## API

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `starters-algolia-scroll-on-select="true"` | `true` (literal) | off | Opts a group into scroll-to-top on selection. |
| `starters-algolia-scroll-list` | presence | — | Marks the scrollable list element inside the group (the first match is used). |

## Notes & gotchas

- Only native `input` elements trigger it (`change` events from checkboxes/radios); custom
  non-input toggles will not.
- The marked list must be the element that actually scrolls (it needs its own overflow); if
  the scrolling happens on a different ancestor, nothing visible occurs.
- Both attributes are required: an opted-in group without a `starters-algolia-scroll-list`
  child silently does nothing.
