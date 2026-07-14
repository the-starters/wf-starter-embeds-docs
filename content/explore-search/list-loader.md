---
title: "List Loader"
source: explore-search/explore-search-list-loader.js
---

Source: `explore-search/explore-search-list-loader.js`

## What it is

Masks layout jank while result lists change. While a result-list transition is in flight (typing,
filtering, or clearing all fire Algolia `/queries` requests), the embed **shows** a
designer-authored loader element and hides the list content with `visibility: hidden` (visibility,
**not** display — the layout space is kept and it never fights the engine's or
[Default Results](./default-results.md)' display writes). When the transition settles, the loader hides
and the list reappears.

Transitions are detected by patching `fetch` + `XMLHttpRequest` (observe only) and watching for
URLs containing both `"algolia"` and `"/queries"` (plural — this naturally excludes the Query
Suggestions `/query` fetch). Overlapping requests coalesce into one session that ends only when
**both** the minimum display time has elapsed **and** every in-flight request has settled.
Visibility is restored on success, error, and abort paths alike, so the list can never stay hidden.

Idempotent via `window.__exploreSearchListLoaderInit`; bails out quietly if no `[data-loader]`
exists inside the search wrapper.

## File structure

```
List Loader - JS
```

No hard dependency; observes the engine's Algolia traffic. Load with `defer`. The interception is
deliberately duplicated from [Tab Counts](./tab-counts.md) so each embed stays independent.

## Markup contract

```html
<div wf-algolia-element="search-wrapper">
  <input wf-algolia-element="search-input" type="text">

  <!-- Author HIDDEN. Optional numeric value overrides the min display (ms). -->
  <div data-loader="350" style="display: none">Loading…</div>

  <div wf-algolia-element="results">
    <div data-tab-component="panel-list">
      <!-- list content hidden via visibility during transitions -->
    </div>
  </div>
</div>
```

The loader must live **inside** `[wf-algolia-element="search-wrapper"]`. The hidden list content is
`[data-tab-component="panel-list"]` inside `[wf-algolia-element="results"]`, falling back to the
results element's first element child.

## Arming (skips initial-load queries)

The engine fires `/queries` for default results during page load, before any interaction — those
must not flash the loader. The loader stays **disarmed** until the **first**
`pointerdown` / `keydown` / `input` inside the search wrapper (the `input` listener also covers
IME/paste/autofill text insertion that fires no keydown). Listeners are bound in the **capture**
phase, `once`, so arming lands before the engine's own handlers issue the request in that same
interaction. Un-armed requests are ignored entirely.

## xAttribute JSON

The loader element (empty value = default 200ms; a number overrides the minimum display):

```json
{ "data-loader": "" }
```

Numeric override example:

```json
{ "data-loader": "350" }
```

## API

| Attribute | On | Values | Default | Purpose |
| --- | --- | --- | --- | --- |
| `data-loader` | element inside the search wrapper | empty, or a non-negative integer (ms) | `200` | Marks the loader; the numeric value sets the minimum display duration. |
| `wf-algolia-display` | the loader | CSS display value | — | Honored when showing the loader; otherwise the inline `display` is cleared. |

Constants (from source): `DEFAULT_MIN_MS = 200`. The list is hidden via
`[data-tab-component="panel-list"]`; requests match URLs containing `"algolia"` **and**
`"/queries"`.

## Notes & gotchas

- The list is hidden with `visibility: hidden`, never `display: none`, so layout height is
  preserved and it does not fight the engine's display writes.
- **Self-heal at init:** the contract says author the loader hidden, but if the page ships it
  visible, the embed force-hides it once at init — the loader must never be user-visible outside a
  session.
- A session ends only when both (a) the minimum display time elapsed since the loader was shown,
  and (b) every in-flight request has settled. Rapid typing coalesces into one session that ends
  after the last request settles.
- The XHR hook uses `loadend`, which covers load, error, abort, and timeout in one place; the
  fetch hook settles on both fulfillment and rejection, and even on a synchronous throw.
