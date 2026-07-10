---
title: "Companies"
---

Source: `algolia-result-modifiers/companies.js`

## What it is

Text normalizer for the `also-worked-with` company list on Algolia-injected cards. On
`DOMContentLoaded` it finds every element with `wf-algolia-text="also-worked-with"` inside a
`.wf-algolia-injected` card and rewrites its text: the comma-separated list is split, each item
is trimmed, hyphens become spaces, runs of whitespace collapse to one space, empty items are
dropped, and the items are rejoined with a comma plus a space.

If any node actually changed, the script dispatches an `expert-cards:relayout` custom event on
`window` (debounced 60ms) so a card-layout script can re-measure. Already-normalized nodes are
skipped, which prevents a mutation loop.

A `MutationObserver` on the results container re-runs the whole pass whenever results are
re-rendered (new search, pagination, load more).

## File structure

```
Companies - JS
```

Load after the Algolia integration script, on pages that render Algolia expert cards.

## Markup contract

```html
<div wf-algolia-element="browse"> <!-- or wf-algolia-element="results" -->
  <div class="wf-algolia-injected">
    <!-- injected card -->
    <p wf-algolia-text="also-worked-with">acme-corp, globex ,  initech</p>
    <!-- becomes: "acme corp, globex, initech" -->
  </div>
</div>
```

## API

No options; the field name is hard-coded to `also-worked-with`.

| Hook | On | Purpose |
| --- | --- | --- |
| `wf-algolia-element="browse"` / `"results"` | container | Watched for mutations; `browse` is preferred if both exist. |
| `.wf-algolia-injected` | card | Only text nodes inside injected cards are processed. |
| `wf-algolia-text="also-worked-with"` | text element | The company list that gets normalized. |

| Event | Fired on | When |
| --- | --- | --- |
| `expert-cards:relayout` | `window` | 60ms after any text actually changed. |

## Notes & gotchas

- If neither `wf-algolia-element="browse"` nor `"results"` exists, the script still runs once on
  load but won't react to later result updates.
- Hyphens are always converted to spaces, so a company name that legitimately contains a hyphen
  will be rewritten (e.g. "Coca-Cola" becomes "Coca Cola").
- Commas are the item separator; a company name containing a comma will be split into two items.
- Only text is changed; no elements are added or removed (contrast with the Roles modifier).
