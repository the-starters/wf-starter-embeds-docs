---
title: "Most Searched"
source: explore-search/explore-search-most-searched.js
---

Source: `explore-search/explore-search-most-searched.js`

## What it is

Renders dynamic "Most Searched" chips from an **Algolia Query Suggestions** index through a
designer-owned template. At `DOMContentLoaded` it queries the QS index with an **empty query**
(QS indices rank by popularity, so an empty query returns the most-searched entries first,
`hitsPerPage: 7`), and clones one chip per suggestion — each chip's label is the record's `query`
field.

On **any** failure (404, network error, or zero hits) it renders a built-in fallback list through
the same template, logging one `console.info` notice. Every clone is stamped with
`data-fill-search` (the behavior hook — chips do nothing visible without
[Chip Fill](./chip-fill.md)) and `data-explore-search-injected` (re-render bookkeeping).

Credentials are read from the engine's own script tag (`script[data-app-id]`: `data-app-id` +
`data-search-key`) and never hardcoded. Idempotent via `window.__exploreSearchMostSearchedInit`;
bails out quietly if the list/template markup is absent.

## File structure

```
Most Searched - JS
```

Depends on an Algolia **Query Suggestions** index and on the engine script tag exposing
`data-app-id` / `data-search-key`. Pairs with [Chip Fill](./chip-fill.md) to make the chips actually
search.

## Markup contract

```html
<div data-explore-search-element="most-searched-list"
     data-explore-most-search-index="explore_query_suggestions">
  <!-- Authored HIDDEN, detached at load, cloned once per suggestion -->
  <button type="button" data-explore-search-element="template" style="display: none">
    <div data-explore-search-element="title"></div>
  </button>
</div>
```

- The template must carry inline `display: none` (no pre-init flash); it is **detached** from the
  DOM at load and every chip on screen is a clone.
- `data-explore-most-search-index` is optional — the default index name is
  `explore_query_suggestions`.
- If the template has a `[data-explore-search-element="title"]` slot, the label goes there;
  otherwise the label is written to the clone's own `textContent`.

## xAttribute JSON

The list wrapper (index attribute optional):

```json
{
  "data-explore-search-element": "most-searched-list",
  "data-explore-most-search-index": "explore_query_suggestions"
}
```

The hidden chip template:

```json
{ "data-explore-search-element": "template" }
```

The title slot inside the template:

```json
{ "data-explore-search-element": "title" }
```

## API

| Attribute | On | Values | Purpose |
| --- | --- | --- | --- |
| `data-explore-search-element="most-searched-list"` | wrapper | — | Root the script keys on; holds the template. |
| `data-explore-most-search-index` | list wrapper | QS index name | Overrides the default `explore_query_suggestions`. |
| `data-explore-search-element="template"` | button/element | — | Hidden chip template, detached at load and cloned per suggestion. |
| `data-explore-search-element="title"` | inside template | — | Label slot filled with the suggestion's `query`. |
| `data-fill-search` | added to each clone | — | Behavior hook consumed by [Chip Fill](./chip-fill.md). |
| `data-explore-search-injected` | added to each clone | — | Marks script-injected clones for re-render cleanup. |

Constants (from source): `QS_HITS = 7`; default index `explore_query_suggestions`. Fallback
labels: `Marketing & Growth`, `Creative & Brand`, `Retention & CRM`,
`Ops, Finance & Product`, `People & Leadership`, `Technology`, `Retail & Marketplace`.

## Notes & gotchas

- The QS query is a direct `POST` to
  `https://<appId>-dsn.algolia.net/1/indexes/<index>/query` with
  `X-Algolia-API-Key` / `X-Algolia-Application-Id` headers and body
  `{ query: "", hitsPerPage: 7 }`.
- The fallback notice logs at most once: `"[explore-demo] query-suggestions index not available
  yet — using static Most Searched chips"`.
- A debug handle `window.__exploreSearchMostSearched.load()` lets the console re-run the loader
  (e.g. right after the QS index is created) without a page reload.
- The template-clone helper is intentionally duplicated in [Recent Searches](./recent-searches.md);
  keep the two copies in sync when editing.
