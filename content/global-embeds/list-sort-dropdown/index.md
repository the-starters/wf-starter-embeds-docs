---
title: "List Sort Dropdown"
source: global-embeds/list-sort-dropdown
---

Source: Webflow, `Global Embeds / List's Sort Dropdown`

## What it is

Tiny helper for a Finsweet List Sort dropdown. One second after `DOMContentLoaded`, the JS clicks
every `fs-list-element="clear"` link found inside `.list-sort_dropdown-links-wrapper`, so the
dropdown starts on its "clear" (default/unsorted) option instead of showing no selection.

The CSS handles the selected-state checkmark: the `.icon-12` icon inside each
`.list-sort_dropdown-link` is invisible by default, shown only on the option that has
`aria-selected="true"` (which Finsweet sets), and always hidden inside the
`fs-list-element="dropdown-label"` element so the checkmark never appears in the closed dropdown's
label.

## File structure

```
List's Sort Dropdown
├── List's Sort Dropdown - CSS
└── List's Sort Dropdown - JS
```

Finsweet Attributes must be on the page for the click to do anything.

## Markup contract

```html
<div class="list-sort_dropdown-links-wrapper">
  <a class="list-sort_dropdown-link" fs-list-element="clear">
    Default <span class="icon-12">✓</span>
  </a>
  <a class="list-sort_dropdown-link" fs-list-field="name" fs-list-direction="asc">
    Name A–Z <span class="icon-12">✓</span>
  </a>
  <!-- more sort options -->
</div>
```

This is the usual Finsweet List Sort dropdown structure; only the pieces above are what this
embed actually touches.

## API

| Hook | On | Purpose |
| --- | --- | --- |
| `.list-sort_dropdown-links-wrapper` | dropdown list | Scope the script searches within. |
| `fs-list-element="clear"` | default option link | Auto-clicked once, 1s after `DOMContentLoaded`. |
| `.list-sort_dropdown-link` and `.icon-12` | option links / checkmark icon | CSS shows the icon only on the `aria-selected="true"` option. |
| `fs-list-element="dropdown-label"` | dropdown toggle label | CSS hides any `.icon-12` inside it. |

## Notes & gotchas

- The 1-second delay is a fixed `setTimeout` to give Finsweet Attributes time to initialize; on
  very slow loads the clear click could still fire before Finsweet is ready.
- The auto-click briefly changes the dropdown state on load. This is expected; it just selects the
  default option.
- Selected-state styling relies on Finsweet setting `aria-selected="true"` on the active option.
