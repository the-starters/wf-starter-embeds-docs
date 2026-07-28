---
title: "Companies"
source: algolia-result-modifiers/companies.js
---

Source: `algolia-result-modifiers/companies.js`

## What it is

Text normalizer for the `also-worked-with` company list on Algolia-injected cards. On
`DOMContentLoaded` it first checks whether the page contains any
`wf-algolia-text="also-worked-with"` element at all and stops immediately if it does not.
Otherwise it finds every such element inside a `.wf-algolia-injected` card and rewrites its
text: the comma-separated list is split, each item is trimmed, hyphens become spaces, runs of
whitespace collapse to one space, empty items are dropped, and the items are rejoined with a
comma plus a space.

If any node actually changed, the script dispatches an `expert-cards:relayout` custom event on
`window` (debounced 60ms) so a card-layout script can re-measure. Already-normalized nodes are
skipped, which prevents a mutation loop.

## How it knows when to run

The pass is driven by the engine's own `results` event, which wf-algolia emits after it has
rendered hits, so the script re-runs on every re-render (new search, filter, sort, pagination).

The engine loads asynchronously, so it may not exist yet when this script boots. The script
waits for it in short intervals with a ceiling of about two seconds, then gives up and falls
back to a `MutationObserver` attached to *every* `wf-algolia-element="browse"` and
`wf-algolia-element="results"` container on the page.

Watching a single container is deliberately avoided. An earlier version resolved one container
with `querySelector`, which took only the first match. On a page with more than one browse
container, where Memberstack removes the section that does not apply to the current member, the
observer could end up bound to a detached element while the engine rendered somewhere else. The
result was that nothing was ever normalized, with no console error to show why.

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
| `wf-algolia-element="browse"` / `"results"` | container | Fallback only. If the engine never appears, every matching container is observed, with no precedence between the two. |
| `.wf-algolia-injected` | card | Only text nodes inside injected cards are processed. |
| `wf-algolia-text="also-worked-with"` | text element | The company list that gets normalized. |

| Event | Fired on | When |
| --- | --- | --- |
| `expert-cards:relayout` | `window` | 60ms after any text actually changed. |

## Notes & gotchas

- If no `wf-algolia-text="also-worked-with"` element exists anywhere on the page, the script
  stops at once and never wires anything up.
- Do not read the `results` event payload. The engine sends two different shapes: the
  single-index path passes the raw Algolia response, which has `hits`, while the federated path
  used on first load passes `{ results, nbHits, nbPages }`, which does not. Re-query the DOM
  instead.
- If neither the engine nor any container is found, the script logs a warning, but only on
  staging hosts (`*.webflow.io`, `localhost`, `*.trycloudflare.com`) or when
  `window.STARTERS_DEBUG` is set. Production stays silent.
- Hyphens are always converted to spaces, so a company name that legitimately contains a hyphen
  will be rewritten (e.g. "Coca-Cola" becomes "Coca Cola").
- Commas are the item separator; a company name containing a comma will be split into two items.
- Only text is changed; no elements are added or removed (contrast with the Roles modifier).
