---
title: "Intro"
source: explore-search
---

Source: `explore-search/`

The **Explore Search** experience is a full-screen, federated Algolia search built on the
[wf-algolia engine](https://cdn.jsdelivr.net/npm/@candid-leap/wf-algolia@1/dist/index.js) (the
`window.WfAlgolia` global). The engine owns the live search: as the user types, it renders hits
into one `[wf-algolia-element="section"]` per Algolia index. This group is a set of **standalone
enhancement embeds** that layer extra behavior on top — chips, tab counts, default results,
loaders, and an open/close overlay.

## Standalone-embeds philosophy

Every script in this group is deliberately independent:

- **Load any subset.** Each file is optional; drop in only the ones a page needs. A file
  **bails out quietly** when its required markup is absent.
- **No shared globals.** Siblings never talk to each other through globals. The only
  cross-file coupling is the `explore-search:commit` CustomEvent that
  [Chip Fill](./chip-fill.md) dispatches and [Recent Searches](./recent-searches.md) listens for.
  Where two files need the same logic (e.g. the fetch/XHR interception in
  [Tab Counts](./tab-counts.md) and [List Loader](./list-loader.md), or the template-clone helper in
  [Most Searched](./most-searched.md) and [Recent Searches](./recent-searches.md)) the code is
  **intentionally duplicated**, not shared.
- **Raw JS, load-order independent.** Each is raw JavaScript (no `<script>` wrapper), served
  over jsDelivr and loaded with `defer`. The relative order of the embeds does not matter.

## Load order vs. the engine

The engine boots on `DOMContentLoaded` via the Webflow ready-queue (`window.Webflow.push(initFn)`).
Because deferred scripts always run **before** `DOMContentLoaded`, embeds that need to observe the
engine get set up first:

- [Tab Counts](./tab-counts.md) and [List Loader](./list-loader.md) install their `fetch`/`XMLHttpRequest`
  interception **before** the engine issues its first Algolia request.
- [Default Results](./default-results.md) captures each section's hit-card template **before** the
  engine detaches those templates at init (with a re-fetch fallback if it loses the race).

## CDN loading pattern

Each embed loads with `defer` from jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/explore-search/explore-search-chip-fill.js" defer></script>
```

`@latest` resolves to the newest git tag; pin an explicit tag (e.g. `@v1.24.0/…`) for production
stability. The overlay transitions live under a sibling folder:
`explore-search-transitions/explore-search-transitions.js` (+ `.css`).

The repo ships a complete, self-contained reference:
[`explore-search/explore-search-demo.html`](https://github.com/the-starters/starters-webflow/blob/main/explore-search/explore-search-demo.html)
is the **source-of-truth demo** page (it is NOT CDN-loaded — it exists to document the full markup
and wiring in one place).

## Embeds in this group

| Embed | Purpose |
| --- | --- |
| [Chip Fill](./chip-fill.md) | Clicking a `[data-fill-search]` chip copies its text into the search input, fires the engine's `input` event, and announces `explore-search:commit`. |
| [Tab Counts](./tab-counts.md) | Live per-index hit counts for the tab bar, by intercepting the engine's own Algolia responses. Zero extra Algolia operations. |
| [Most Searched](./most-searched.md) | Dynamic "Most Searched" chips from an Algolia Query Suggestions index, rendered through a designer-owned template. |
| [Recent Searches](./recent-searches.md) | The user's recent searches as chips, persisted in `localStorage`, recorded via `explore-search:commit`. |
| [Default Results](./default-results.md) | Keeps results visible on an empty query and fills each federated section with its index's default ranking. |
| [Hide Empty](./hide-empty.md) | Hides `[starters-algolia-hide]` wrappers while all their Algolia sections are empty. |
| [List Loader](./list-loader.md) | Shows a designer-authored loader and masks list jank during result transitions. |
| [Transitions](./transitions.md) | Search overlay open/close transitions (GSAP timelines, inert-locked closed state, reduced-motion aware) plus companion CSS. |
