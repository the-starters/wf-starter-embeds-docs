---
title: "Chip Fill"
source: explore-search/explore-search-chip-fill.js
---

Source: `explore-search/explore-search-chip-fill.js`

## What it is

A single delegated `click` listener on `document`. When the click lands inside any element
carrying `[data-fill-search]`, the script copies that element's trimmed `textContent` into the
wf-algolia search input, dispatches a **real bubbling `input` event** (a plain value assignment
does nothing — the engine's debounced live-search listener only reacts to the event), and focuses
the input.

It then announces the committed query so optional companions can record it:

```js
document.dispatchEvent(new CustomEvent("explore-search:commit", { detail: { query: <value> } }))
```

No storage logic lives here — [Recent Searches](./recent-searches.md) is what listens for that event.
The script is idempotent via a `window.__exploreSearchChipFillInit` guard, and bails out quietly
per click if the search input is absent.

## File structure

```
Chip Fill - JS
```

No dependencies. Standalone; the chips rendered by [Most Searched](./most-searched.md) and
[Recent Searches](./recent-searches.md) do nothing visible without this file.

## Markup contract

```html
<!-- Any element (button, div, …). Its trimmed text becomes the query. -->
<button data-fill-search>Marketing &amp; Growth</button>

<!-- Somewhere on the page, the wf-algolia search input: -->
<input wf-algolia-element="search-input" type="text">
```

The listener is delegated, so chips added after load (e.g. by the recent/most-searched embeds)
work with no re-wiring.

## xAttribute JSON

The chip hook is an empty-valued attribute on each chip element:

```json
{ "data-fill-search": "" }
```

The search input hook (also used by the whole group):

```json
{ "wf-algolia-element": "search-input" }
```

## API

| Attribute | On | Values | Purpose |
| --- | --- | --- | --- |
| `data-fill-search` | any clickable element | — | On click, its trimmed `textContent` is copied into the search input and searched. |
| `wf-algolia-element="search-input"` | `input` | — | The target search input. Selected as `input[wf-algolia-element="search-input"]`. |

| Event | Direction | Detail | Purpose |
| --- | --- | --- | --- |
| `explore-search:commit` | dispatched on `document` | `{ query: <input value> }` | Announces that a chip fill committed a search, so companions (Recent Searches) can record it. |

## Notes & gotchas

- The event dispatched is `new Event("input", { bubbles: true })` — this is what triggers the
  engine's live search; setting `input.value` alone would not.
- Bails out **per click** if `input[wf-algolia-element="search-input"]` is not found — there is no
  page-level bail, so adding the input later still works.
- The `explore-search:commit` dispatch is wrapped in try/catch and never breaks the page.
- Text is read with `chip.textContent.trim()`, so nested markup inside the chip is flattened to
  its text.
