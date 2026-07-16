---
title: "Tab No-Results"
source: explore-search/explore-search-tab-no-results.js
---

Source: `explore-search/explore-search-tab-no-results.js`

## What it is

Per-tab "No matches found." for the tabbed federated search. The wf-algolia engine only
reveals the shared no-results element when the **whole** federated search (all indices
combined) returns zero hits; when only the active tab's section is empty but another tab
still has hits, the engine leaves it hidden and the active tab looks blank. This embed shows
that shared element whenever the **active tab's** panel has no populated section, and hides
it again the moment the active tab has one. The engine's global behavior (all tabs empty)
still works.

On an **empty query** it always force-hides the message, because
[Default Results](./default-results.md) fills the sections with default items then, so "No
matches found." would be wrong. That guard also covers the pre-render initial load, so there
is no flash.

## File structure

```
Tab No-Results - JS
```

Standalone (no imports, no shared globals with the sibling embeds); loads with `defer` from
jsDelivr. Idempotent via `window.__exploreSearchTabNoResultsInit`; bails out quietly unless
the tabbed layout is present (results, no-results, panel-list, and at least one section).
Every handler is wrapped so it can never break the page. Shipped in **v1.25.3**, with the
animated-tab-switch deferral added in **v1.25.5**.

## Markup contract

The tabbed federated layout it detects:

```html
<input wf-algolia-element="search-input" type="text">
<div wf-algolia-element="results">
  <div data-tab-component="panel-list">
    <div><!-- panel, one per tab --> <div wf-algolia-element="section">…</div> </div>
  </div>
  <div wf-algolia-element="no-results">No matches found.</div>
</div>
```

[Tabs](../global-embeds/tabs/index.md) flips `data-tab-active="true"` onto the active panel;
before it runs, the first panel counts as active.

## How it decides and how it wins

- **"Empty" section:** the engine signals a 0-hit section by inline-setting the section's own
  `style.display = "none"`, so that test comes first; only then does the embed look for a
  non-template child. (An empty section still contains a structural section label, so counting
  children alone would misread it as populated.)
- **Forcing the toggle:** when one tab has hits, the engine inline-hides the shared no-results
  element, and a plain inline write would just be fought. The embed instead toggles two
  injected `!important` classes (`starters-es-no-results--show` / `--hide`) on the element; an
  `!important` stylesheet declaration beats a normal inline declaration in the cascade.

## Deferrals (no reveal-then-jump)

Two situations would place the message at the wrong height and make it visibly jump, so the
reveal is deferred and re-evaluated once they end:

- **While [List Loader](./list-loader.md) masks the panel-list** (inline
  `visibility: hidden` during an Algolia `/queries` request). The no-results element sits
  after the panel-list, so revealing it under the reserved height would drop it low, then
  snap it up when the mask lifts.
- **During an animated tab switch.** A GSAP switch keeps the outgoing panel visible during
  the fade. Clicks on `[data-tab-component="button-list"]` open a deferral window sized from
  the wrapper's `data-duration` (clamped 400 to 1500ms); the window always ends and
  re-evaluates, so the message can never stay stuck hidden.

## Notes & gotchas

- Re-evaluation is driven by a MutationObserver on the results container (childList plus
  `style` attribute changes) and an `input` listener on the search field. Bursts coalesce
  onto a single 0ms timeout rather than `requestAnimationFrame`, because rAF callbacks are
  suspended in background tabs and a timeout still runs.
- Loop safety: the embed mutates only the no-results element's `classList`, which the
  observer doesn't watch. Don't add `class` to its `attributeFilter`.
- No loader on the page means the panel-list is never masked, so that deferral simply never
  gates.
