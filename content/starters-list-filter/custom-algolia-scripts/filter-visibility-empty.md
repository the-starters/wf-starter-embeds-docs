---
title: "Filter Visibility Empty"
source: starters-list-filter/custom-algolia-scripts/filter-visibility-empty.js
---

Source: `starters-list-filter/custom-algolia-scripts/filter-visibility-empty.js`

## What it is

An opt-out for WF-Algolia's hide-on-empty behavior. The bundle inline-hides
(`display: none`) filter groups whose dynamic facet comes back empty or all-zero; marking an
element with `starters-algolia-hide-on-empty="false"` keeps it visible anyway.

For each marked element the script clears an inline `display: none` on init, then attaches a
`MutationObserver` on the element's `style` attribute and re-clears it every time the bundle
hides it again (which happens on every response). The restore value is the empty string, so
the element falls back to whatever your Webflow class/CSS says. The un-hide only runs when the
element is actually at `display: none`, so the script's own write never re-triggers the
observer into a loop. Each element gets a `data-hide-on-empty-inited` guard so wiring is
one-time.

## File structure

```
Filter Visibility Empty - JS
```

## Markup contract

```html
<div wf-algolia-element="filter-group"
     wf-algolia-field="availability"
     starters-algolia-hide-on-empty="false">
  …
</div>
```

## API

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `starters-algolia-hide-on-empty="false"` | `false` (literal) | off | Keeps the element visible even when WF-Algolia inline-hides it. Works on any element the bundle hides, not just groups. |

## Notes & gotchas

- The attribute value must be the literal string `false`; the selector matches exactly that.
- Restoring to `''` relies on your CSS class providing the visible display value; if the
  element for some reason needs an explicit `block`/`flex`, that is a source-level constant
  (`SHOWN_DISPLAY`), not a per-element attribute.
- Elements added to the DOM after the script initializes are not picked up; the query runs
  once (on `DOMContentLoaded`, or immediately if the DOM is already parsed).
- Only the inline `style` hide is countered; the script does not fight class-based hiding.
