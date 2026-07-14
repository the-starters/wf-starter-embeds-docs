---
title: "Hide Empty"
source: explore-search/explore-search-hide-empty.js
---

Source: `explore-search/explore-search-hide-empty.js`

## What it is

Hides any wrapper marked `[starters-algolia-hide="true"]` while **every** `[wf-algolia-element=
"section"]` it contains is empty, and un-hides it as soon as any section shows real hits. Hiding is
**class-based only** — the script injects a stylesheet rule
`.starters-algolia-hidden { display: none !important; }` and toggles that class; it never touches
the wrapper's inline `display`. That makes it safe on Webflow tab panels: the tabs controller keeps
full ownership of the panel's inline display (block when active, none when inactive), and the
`!important` class wins only while the wrapper is empty.

A section counts as **populated** iff its inline `style.display !== "none"` **and** it has at least
one element child that is not a `[wf-algolia-element="template"]`. Wrappers with no sections at all
are left completely alone.

Runs at `DOMContentLoaded` (or immediately if the DOM is already parsed). Each wrapper is wired
once (guarded by `data-hide-empty-inited="true"`) and re-evaluated by a per-wrapper
`MutationObserver`.

## File structure

```
Hide Empty - JS
```

No dependency, but only meaningful alongside wf-algolia sections. Also reacts to
[Default Results](./default-results.md) clones arriving/leaving.

## Markup contract

```html
<div starters-algolia-hide="true">
  <div wf-algolia-element="section" wf-algolia-index="…">
    <!-- template child does NOT count as populated -->
    <a wf-algolia-element="template" style="display: none"> … </a>
    <!-- real hit children make the section populated -->
  </div>
</div>
```

The wrapper can hold one or more sections; it is hidden only while **all** of them are empty.

## xAttribute JSON

The wrapper hook (value is the string `"true"`):

```json
{ "starters-algolia-hide": "true" }
```

## API

| Attribute | On | Values | Purpose |
| --- | --- | --- | --- |
| `starters-algolia-hide="true"` | wrapper element | `true` | Marks a wrapper to auto-hide while all its sections are empty. |

| Generated hook | Kind | Purpose |
| --- | --- | --- |
| `starters-algolia-hidden` | class | Injected rule `display: none !important;`. Added while empty, removed when populated. |
| `data-hide-empty-inited="true"` | attribute | Per-wrapper wire-once guard. |
| `starters-algolia-hide-empty-style` | `<style>` id | Id-guarded stylesheet so double inclusion injects only once. |

## Notes & gotchas

- **Never touches inline display** — this is deliberate. Writing inline display here would
  un-hide inactive but populated tab panels and render two tabs at once. Removing the class hands
  visibility straight back to whatever inline value the tabs controller last wrote.
- The `MutationObserver` watches `childList`, `subtree`, and `attributes` filtered to `['style']`
  only. Do **not** add `'class'` to the filter: the script's own writes mutate `class`, and
  filtering to `style` is what prevents an observer loop.
- Comment/text nodes and hidden templates never count as content — only non-template element
  children.
- This file has no `window.*Init` flag; idempotency comes from the per-wrapper
  `data-hide-empty-inited` attribute and the id-guarded stylesheet.
