---
title: "Remove CMS Wrapper"
source: global-embeds/remove-cms-wrapper.js
---

Source: Webflow, `Global Embeds / Remove CMS Wrapper - JS`

## What it is

Strips Webflow's Collection List wrappers so CMS items become direct children of your own layout
element. On `DOMContentLoaded`, for every element with `data-remove-cms` that has a `.w-dyn-list`
as a direct child, the script promotes each collection item's first visible child (skipping
`w-condition-invisible` conditionally-hidden ones) into the `data-remove-cms` element, then
removes everything that was originally in it: the `.w-dyn-list`, its `.w-dyn-items` /
`.w-dyn-item` wrappers, and any other original children.

Useful when the CMS wrappers break layouts that need the cards to be direct children of a grid or
flex parent, or when a script (slider, accordion, etc.) expects a flat list of items.

## File structure

```
Remove CMS Wrapper - JS
```

No CSS.

## Markup contract

```html
<!-- Before (as built in Webflow) -->
<div class="my-grid" data-remove-cms>
  <div class="w-dyn-list">
    <div class="w-dyn-items">
      <div class="w-dyn-item">
        <div class="my-card">…</div>
      </div>
      <!-- × N -->
    </div>
  </div>
</div>

<!-- After (at runtime) -->
<div class="my-grid" data-remove-cms>
  <div class="my-card">…</div>
  <!-- × N -->
</div>
```

## API

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-remove-cms` | the layout element that directly contains the Collection List | Opt in to unwrapping. No value needed. |

## Notes & gotchas

- The Collection List must be a direct child of the `data-remove-cms` element; nothing happens if
  no `.w-dyn-list` is found there.
- Only the first visible child of each Collection Item is promoted, so wrap the whole card in a
  single element inside the Collection Item, or anything after the first element is lost.
- All original direct children of the `data-remove-cms` element are removed, including static
  siblings placed next to the Collection List, so keep static content outside the wrapper.
- The unwrapping removes Webflow's `.w-dyn-item` styling hooks, so style the promoted card
  element itself.
- The same unwrapping is built into the [Accordions](./accordions/index.md) script; you do
  not need this embed there.
