---
title: "Default Results"
source: explore-search/explore-search-default-results.js
---

Source: `explore-search/explore-search-default-results.js`

## What it is

Reverses the engine's default "hidden until you type" UX. Whenever the wf-algolia search input is
**empty**, this embed keeps the results container visible and fills every federated section with
its index's full default ranking (an empty-query search returns all records in "top" order). The
moment a real query is typed, the engine takes over and renders its own hits — its pre-render sweep
of `.wf-algolia-injected` clones removes the defaults, so there is never any mixing or duplication.
On clear, the defaults come back. Escape / outside-click hides from the engine are countered, so
the results area is always visible.

Rendering goes entirely through the engine's public API: `WfAlgolia.multiSearch` for the
empty-query fetch and `WfAlgolia.cloneAndPopulate(templateEl, hit)` per hit (which stamps
`wf-algolia-injected`, so the engine's own sweep can later remove these clones).

Idempotent via `window.__exploreSearchDefaultResultsInit`. Defensive try/catch throughout — never
throws. Bails out quietly if the results / sections / input markup is absent, or if no section
template can be recovered.

## File structure

```
Default Results - JS
```

Depends on the wf-algolia engine (`window.WfAlgolia.multiSearch` + `cloneAndPopulate`). Must load
with `defer` so it can capture the section templates **before** the engine detaches them at init.

## Markup contract

```html
<div wf-algolia-element="search-wrapper">
  <input wf-algolia-element="search-input" type="text">
  <div wf-algolia-element="results" style="display: none">
    <div wf-algolia-element="section" wf-algolia-index="Freelancers3.0-dev"
         data-explore-default-hits="6">
      <!-- hit-card template: direct child, hidden -->
      <a wf-algolia-element="template" style="display: none"> … </a>
    </div>
    <!-- …one or more sections… -->
    <div wf-algolia-element="no-results" style="display: none">No matches found.</div>
  </div>
</div>
```

The section hit-card template **must** be authored in the page markup (hidden) — the recovery
fallback re-fetches and parses the page HTML to get it back if the engine detached it first.

## Template capture (two-step, race-proof)

`cloneAndPopulate` needs each section's hit-card template, but the engine detaches those on init.
The embed captures them by:

1. **Live DOM:** if the deferred run beats engine init (the normal Webflow case), it clones each
   section's direct-child `[wf-algolia-element="template"]` in place.
2. **Fallback:** if the engine already detached them (e.g. a cached engine module that initialized
   first), it re-fetches the current page's HTML with `fetch(location.href, { credentials:
   "same-origin" })`, parses it, and matches each template to its section by `wf-algolia-index`.

It then polls for `window.WfAlgolia` (which exists only after the engine inits) and bails quietly
on a ~15s timeout, leaving native behavior intact.

## xAttribute JSON

Per-section default-hits override (optional):

```json
{ "data-explore-default-hits": "6" }
```

The engine's own section hooks (documented here for completeness):

```json
{
  "wf-algolia-element": "section",
  "wf-algolia-index": "Freelancers3.0-dev"
}
```

## API

| Attribute | On | Values | Default | Purpose |
| --- | --- | --- | --- | --- |
| `data-explore-default-hits` | a section | positive integer | see below | How many default items that section fetches/renders on the empty query. |
| `wf-algolia-index` | a section | Algolia index name | — | Which index the section's defaults come from (engine attribute). |
| `wf-algolia-hits` | a section | positive integer | — | Engine's per-search hit count; used as the default-hits fallback. |

Default-hits resolution order: **`data-explore-default-hits` &gt; `wf-algolia-hits` &gt; 6** — so
by default the unfiltered view shows exactly as many items as a search would.

Constants (from source): `DEFAULT_HITS_CAP = 6`, `ENGINE_TIMEOUT_MS = 15000`,
`ENGINE_POLL_MS = 150`, `RENDER_DEBOUNCE_MS = 150`.

## Notes & gotchas

- A `MutationObserver` watches the results element's `style` attribute; whenever the engine sets
  `display: none` (empty query / Escape / outside click), the embed re-shows it immediately, and
  repaints the defaults (debounced) if the query is empty.
- The results container stays authored `display: none` until the first default render completes, so
  there is no empty flash.
- Empty-query requests are sent with `clickAnalytics: true`, so [Tab Counts](./tab-counts.md) counts
  them; this embed does **not** touch tab counts itself.
- A section whose default query returns zero hits is hidden; the `no-results` element is never
  shown for the empty-query default view.
- If the user types during a round-trip, the response is discarded (`inputValue() !== ""`), so a
  slow default never overwrites live search results.
