---
title: "Tab No-Results"
description: "Per-tab empty-state message for the tabbed federated explore search."
source: explore-search/explore-search-tab-no-results.js
---

Source: `explore-search/explore-search-tab-no-results.js` — **v1.59.136**

## What it is

Per-tab "No matches found." for the tabbed federated search. The wf-algolia engine only
reveals the shared no-results element when the **whole** federated search (all indices
combined) returns zero hits; when the **active** tab's section is empty but another tab
still has hits, the engine leaves it hidden and the active tab looks blank. This embed shows
that shared element whenever the query is non-empty **and** the active panel is empty.

The decision rule is deliberately add-only:

```
SHOW  iff  the query is NON-EMPTY  AND  the active panel is empty.
Otherwise RELEASE — remove our class and never write display.
```

It does **not** require another panel to have hits (that older rule left the all-empty case
with no rescue after `tabs.js` clobbered the engine's reveal). It also never force-hides:
"not showing" means removing `starters-es-no-results--show` and handing the element back to
whatever inline `display` the engine and `tabs.js` set.

On an **empty query** it never adds the message, because
[Default Results](./default-results.md) fills the sections then — a "no matches" label would
be wrong. That gate also covers the pre-render initial load.

## File structure

```
explore-search/explore-search-tab-no-results.js
```

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/explore-search/explore-search-tab-no-results.js"></script>
```

Standalone (no imports, no shared globals with the sibling embeds). Idempotent via
`window.__exploreSearchTabNoResultsInit`; bails out quietly unless the tabbed layout is
present. Every handler is wrapped so it can never break the page.

## Markup contract

The live page nests the shared no-results element **inside** `panel-list` (last child), not
as a sibling of it:

```html
<div wf-algolia-element="search-wrapper">
  <input wf-algolia-element="search-input" type="text">
  <div wf-algolia-element="results" data-tab-component="wrapper">
    <div data-tab-component="button-list">…</div>
    <div data-tab-component="panel-list">
      <div><!-- panel --> <div wf-algolia-element="section">…</div> </div>
      <div><!-- panel --> <div wf-algolia-element="section">…</div> </div>
      <div wf-algolia-element="no-results">No matches found.</div>
    </div>
  </div>
</div>
```

[Tabs](../global-embeds/tabs/index.md) flips `data-tab-active="true"` onto the active panel.
Because no-results is a direct child of `panel-list`, `tabs.js` can miscount it as a third
panel and stamp `display:none` on it — this embed's panel candidate test rejects the
no-results element (and honors `data-tab-component-skip`).

### Resolving the right results container

The same page also carries wf-algolia **browse** widgets, each with their own
`[wf-algolia-element="results"]`. A bare `document.querySelector('[wf-algolia-element="results"]')`
can hit a browse widget first and leave this embed with no panel-list / no-results (the
v1.59.136 fix). Resolution walks a ladder and skips browse-owned containers:

1. The search wrapper's own results container that carries the tabbed markup
2. Else any document container that carries that tabbed markup
3. Else the first results container a browse widget does not own

Everything else (input, panel-list, no-results) is derived **from** that resolved container.
The search input has **no** document-wide fallback — a foreign empty input would silently
disable the message. Prefer no-results as a direct child of the resolved panel-list.

## How it decides and how it wins

- **"Empty" section:** the engine signals a 0-hit section by inline-setting the section's own
  `style.display = "none"`, so that test comes first; only then does the embed look for a
  non-template child. (An empty section still contains a structural section label, so counting
  children alone would misread it as populated.)
- **Show class only:** to beat the engine's / `tabs.js`'s inline hide, the embed adds
  `starters-es-no-results--show` (`display: block !important`). There is **no** hide class —
  release removes the show class and never writes `display`.

Accepted risk: if the engine ever strands its own reveal while the active panel has hits,
this embed cannot correct it. A spurious message is cheaper than a blank panel with no
explanation.

## Deferrals (no reveal-then-jump)

Two situations would place the message at the wrong height and make it visibly jump, so the
reveal is deferred and re-evaluated once they end:

- **While [List Loader](./list-loader.md) masks the panel-list** (inline
  `visibility: hidden` during an Algolia `/queries` request).
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
- Do not "resync" this file's container ladder with
  [Default Results](./default-results.md) without reading both — they diverged on purpose
  (this one gates every rung on tabbed markup).
