---
title: "Tab Counts"
source: explore-search/explore-search-tab-counts.js
---

Source: `explore-search/explore-search-tab-counts.js`

## What it is

Live per-index hit counts for the search tab bar, at **zero extra Algolia cost**. Loaded with
`defer` so its network interception is installed **before** the wf-algolia engine initializes on
`DOMContentLoaded`. The script observes (never alters) the engine's own Algolia responses and
writes the bare hit number into each tab's count span.

How it works:

- **Interception.** It patches both `fetch` and `XMLHttpRequest` and watches for URLs containing
  both `"algolia"` and `"/queries"`. It pairs the request body's `requests[]` (each `indexName` +
  `query`) positionally with the response's `results[]` (`nbHits`) and writes the number into each
  `[data-tab-count-for="<indexName>"]` span. The underlying request is untouched.
- **clickAnalytics guard.** Only requests carrying `clickAnalytics=true` are counted (the engine's
  live search and the [Default Results](./default-results.md) embed both send it). Unrelated `/queries`
  batches — e.g. a navbar mega-menu's category preloads, or the engine's facet-stat queries — are
  ignored so they cannot pollute the counts.
- **Per-query memory.** Every intercepted batch is recorded into a
  `{ trimmedQuery -> { indexName: nbHits } }` store. This defeats the algoliasearch client's
  **in-memory cache**: a repeat query (e.g. re-picking a Most Searched chip) is served from that
  cache with **no network traffic**, so the interceptor never fires. On every `input` event the
  script looks the current query up in this store and repaints from memory, so repeat queries show
  correct counts instantly instead of stale numbers.
- **Query-match guard.** An intercepted batch only paints when its request query equals the search
  input's **current** value at response time — this drops out-of-order responses (a slow
  empty-query default arriving after a fast live-search response can no longer overwrite the live
  counts). Non-matching batches are still recorded in the per-query store for later
  repaint-from-memory.
- **Active-tab mirror.** Every `[data-active-tab-count]` element is kept equal to the active tab's
  count. Re-synced after each update, and on `[data-tab-component="button-list"]` clicks (deferred
  with `setTimeout(…, 0)` so the tab controller flips the active class first — no new query fires
  on a tab switch).

Idempotent via `window.__exploreSearchTabCountsInit`; bails out quietly if neither
`[data-tab-count-for]` nor `[data-active-tab-count]` is present.

## File structure

```
Tab Counts - JS
```

No hard dependency, but only meaningful alongside the wf-algolia engine (it observes the engine's
Algolia traffic). Must load with `defer` (and before the engine initializes) so the interception
is in place for the first request.

## Markup contract

```html
<!-- Tab bar: each button holds the count span for its index -->
<div data-tab-component="button-list">
  <button class="is-active" data-tab-active="true">
    Starters <span data-tab-count-for="Freelancers3.0-dev">0</span>
  </button>
  <button>
    Intelligence <span data-tab-count-for="Intelligence-index">0</span>
  </button>
</div>

<!-- Optional: mirrors the ACTIVE tab's count anywhere on the page -->
<span data-active-tab-count>0</span>
```

The active tab button is matched as `.is-active` **or** `[data-tab-active="true"]` inside
`[data-tab-component="button-list"]`; its child `[data-tab-count-for]` span says which index it
represents.

## xAttribute JSON

Per-index count span (value = the Algolia index name):

```json
{ "data-tab-count-for": "Freelancers3.0-dev" }
```

The tab button list wrapper:

```json
{ "data-tab-component": "button-list" }
```

Active-tab mirror element:

```json
{ "data-active-tab-count": "" }
```

## API

| Attribute | On | Values | Purpose |
| --- | --- | --- | --- |
| `data-tab-count-for` | span inside a tab button | Algolia index name | Its text is set to that index's `nbHits` (or `0`). |
| `data-active-tab-count` | any text element | — | Its text mirrors the active tab's count. |
| `data-tab-component="button-list"` | tab bar wrapper | — | Scopes active-tab detection and the tab-switch click re-sync. |
| `data-tab-active="true"` | active tab button | `true` | Marks the active tab (alternative to the `is-active` class). |

## Notes & gotchas

- **Zero extra Algolia operations** — the script only reads responses the engine already made.
- Counts are painted by iterating the spans, not the response, so an index missing from the latest
  response paints `0` rather than keeping a stale number.
- Within one batch it takes **last-wins** per `(query, index)` pair (it never sums), because a tab
  represents one section's count.
- Clearing the input to a value with no remembered counts resets every span to `0`.
- The active-tab detection relies on the page's own tabs controller having flipped `.is-active` /
  `data-tab-active`; on first load, before that happens, the mirror reads `0`.
