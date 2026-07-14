---
title: "Recent Searches"
source: explore-search/explore-search-recent-searches.js
---

Source: `explore-search/explore-search-recent-searches.js`

## What it is

Renders the user's own recent searches as chips through a designer-owned template, persisting them
in `localStorage`. There are **no placeholder recents**: with zero stored entries the wrapper stays
hidden, and it appears the moment there is at least one entry (on load, or live mid-session at the
user's first commit) and re-hides when empty. The template is authored with inline `display: none`
and detached at load; every chip on screen is a clone.

A query **commits** when either:

1. an `explore-search:commit` CustomEvent arrives (dispatched by [Chip Fill](./chip-fill.md) on chip
   clicks — the only cross-file coupling, by design), or
2. typing in the wf-algolia search input pauses for **1.5s** with a trimmed value of length
   **&ge; 3**.

Empty/short values and programmatic resets are never recorded (an empty input cancels a pending
pause-commit). Idempotent via `window.__exploreSearchRecentSearchesInit`; bails out quietly if the
list/template markup is absent.

## File structure

```
Recent Searches - JS
```

Records chip clicks only via the `explore-search:commit` event from [Chip Fill](./chip-fill.md); pair
the two on any page that has clickable chips. Works standalone for typing-pause commits.

## Markup contract

```html
<!-- Optional but recommended: author the wrapper HIDDEN (display:none).
     The script reveals it only while there are stored recents. -->
<div data-explore-search-element="recent-search-wrapper" style="display: none">
  <h2>Recent Searches</h2>
  <div data-explore-search-element="recent-searched-list">
    <button type="button" data-explore-search-element="template" style="display: none">
      <div data-explore-search-element="title"></div>
    </button>
  </div>
</div>
```

- If no `recent-search-wrapper` is authored, the `recent-searched-list` element itself is
  shown/hidden. When a wrapper is authored, the script picks the wrapper that **contains** the
  list.
- Authoring the wrapper hidden is fail-safe by construction: if the script never loads or storage
  is blocked, the authored `display: none` is never cleared, so there is no empty-section flash
  and no orphaned heading.

## xAttribute JSON

The (authored-hidden) outer wrapper:

```json
{ "data-explore-search-element": "recent-search-wrapper" }
```

The list that holds the chips:

```json
{ "data-explore-search-element": "recent-searched-list" }
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
| `data-explore-search-element="recent-search-wrapper"` | wrapper | — | Shown/hidden with the stored state; author hidden. |
| `data-explore-search-element="recent-searched-list"` | list | — | Root the script keys on; holds the template and clones. |
| `data-explore-search-element="template"` | button/element | — | Hidden chip template, detached at load. |
| `data-explore-search-element="title"` | inside template | — | Label slot filled with the stored query. |
| `data-fill-search` | added to each clone | — | Behavior hook consumed by [Chip Fill](./chip-fill.md). |
| `data-explore-search-injected` | added to each clone | — | Marks script-injected clones for re-render cleanup. |

| Event | Direction | Detail | Purpose |
| --- | --- | --- | --- |
| `explore-search:commit` | listened on `document` | `{ query: <string> }` | Records a chip-click commit into recent searches. |

Constants (from source): `localStorage` key `explore-recent-searches` (JSON array of strings);
`RECENT_MAX = 6`; `COMMIT_PAUSE_MS = 1500`; `MIN_QUERY_LENGTH = 3`.

## Notes & gotchas

- Storage is a JSON array of strings, **most-recent first, max 6**, with case-insensitive dedupe
  that keeps the newest casing.
- Every storage access is guarded: in private mode reads return `[]` (section stays hidden) and
  writes fail silently.
- When a chip's `explore-search:commit` arrives, the pending typing-pause timer is cancelled — the
  chip's own `input` event had started one, and it is dropped so the query isn't double-recorded.
- The template-clone helper is intentionally duplicated in [Most Searched](./most-searched.md); keep the
  two copies in sync when editing.
