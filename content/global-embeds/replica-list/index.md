---
title: "Replica List"
source: global-embeds/replica-list/replica-list-relayout.js
---

Source: `global-embeds/replica-list/replica-list-relayout.js` (**v1.59.113**) · wiring notes:
`global-embeds/replica-list/REPLICA-LIST-WIRING.md`

## What it is

A curated "top X" list on any page, rendered by wf-algolia's built-in **static-list mode** from a
hand-ranked Algolia **replica**.

No custom list code ships for this. The engine already loaded globally on every page does the
query, the cloning, and the field binding. The only companion script is
`replica-list-relayout.js`, and it exists purely to close one measurement gap in `expert-card.js`
(see [Relayout companion](#relayout-companion)).

The worked example throughout is the first real placement: a **Top Consultants** list of three
cards, authored inside a modal panel.

### How static-list mode works

Any `[wf-algolia-element="browse"]` block that also carries `wf-algolia-disable-filters="true"` is
a static list. At engine init the engine runs **one** empty-query search against the block's own
index, renders the hits into the block's results container, and stops. There is no search input,
no facet UI, no pagination, and no re-query.

Because the query is empty, the order you get is the index's own ranking. That is the whole trick:
point the block at a replica whose ranking was curated in the Algolia dashboard, and the list is
whatever was decided there.

## File structure

```
Replica List
├── replica-list-relayout.js
└── REPLICA-LIST-WIRING.md   (authoring notes)
```

The list itself needs **no** script beyond the global wf-algolia engine. Load the relayout
companion only where a list can start out hidden and the cards are expert cards; it is a no-op on
any page without a static list, so it is safe to load globally.

## Markup contract

Author this tree in the Designer. Attribute names are case-sensitive.

```html
<!-- Static list wrapper. Never add [data-loader] in here (see Notes & gotchas). -->
<div
  wf-algolia-element="browse"
  wf-algolia-disable-filters="true"
  wf-algolia-index="top-consultants"
  wf-algolia-per-page="3"
>
  <!-- Optional skeleton, shown while the one query is in flight. -->
  <div wf-algolia-element="loader" wf-algolia-display="block">…</div>

  <!-- Results container. Give it a min-height so the page does not jump when
       the cards land (one card row is enough). -->
  <div wf-algolia-element="results">
    <!-- The template must be a DIRECT child of the results container. -->
    <div wf-algolia-element="template" class="expert-card_item" style="display: none">
      <div class="expert-card_name" wf-algolia-text="name"></div>
      <div class="expert-card_headline" wf-algolia-text="professional-headline|tagline"></div>
      <div class="expert-card_company-list" wf-algolia-text="previous-company"></div>
    </div>
  </div>

  <!-- Optional. Only ever shows if the replica returns zero hits. -->
  <div wf-algolia-element="no-results" wf-algolia-display="block">No starters in this list.</div>
</div>
```

The template must be a **direct child** of the results container: the engine anchors a template to
its immediate parent and matches it back by that parent. Nest it one level deeper and the engine
reports `static list has no results container/template; skipping`. In Webflow this is the
"Expert Card - Algolia Template" component, set to Display: None.

Field binding inside the template is the ordinary engine grammar: `wf-algolia-text="<attribute>"`
(a `|` separated list falls back left to right), plus `wf-algolia-image`, `wf-algolia-link` and
friends. Attribute names come from the source index and are case-sensitive.

## API

| Attribute | Where | Required | Notes |
| --- | --- | --- | --- |
| `wf-algolia-element="browse"` | wrapper | yes | Marks the block for the engine. |
| `wf-algolia-disable-filters="true"` | wrapper | yes | This is what selects static-list mode. |
| `wf-algolia-index` | wrapper | yes | The replica name. Missing means a console error and a permanently empty block. |
| `wf-algolia-per-page` | wrapper | no | Defaults to **12**. Use it, or a "top 3" list quietly becomes a top 12. |
| `wf-algolia-filter` | wrapper | no | Facet filter, for lists that genuinely need a cut as well as an order. |
| `wf-algolia-element="results"` | inside | yes | Holds the template and receives the clones. |
| `wf-algolia-element="template"` | direct child of results | yes | Hidden. Cloned once per hit. |
| `wf-algolia-element="loader"` | inside | no | Shown for the duration of the one query. |
| `wf-algolia-element="no-results"` | inside | no | Shown only on zero hits. |
| `wf-algolia-element="results-count"` | inside | no | Filled with shown / total. |

## Relayout companion

`expert-card.js` equalizes `.expert-card_company-list` heights and computes
`--expert-card-jobs-open-height` from `scrollHeight` on window load, `fonts.ready`, resize, and on
the `expert-cards:relayout` window event. Inside a `display: none` modal every `scrollHeight` is
`0`, so that pass measures nothing and bails (it explicitly skips `h <= 0`), and nothing re-measures
when an interaction later opens the panel. The cards then paint with ragged company lists and a
collapsed jobs drawer until the next window resize.

`replica-list-relayout.js` closes exactly that gap and nothing else: it watches every static-list
block that was **hidden at load** and dispatches `expert-cards:relayout` **once**, the first time
that block's cards are actually visible.

A block that was already visible at load gets nothing. `expert-card.js` measured it correctly on
its own passes, and a redundant dispatch would clear and re-apply the min/max heights — a visible
tweak for no reason.

Detection is dual, both paths cheap, whichever wins first:

1. An **IntersectionObserver** (`threshold: 0`) per pending block. This is the normal path in a
   real tab: a modal opening flips the block from `display: none` to intersecting.
2. A single **capture-phase document click listener** that re-checks pending blocks on the next
   task. IO callback delivery is not guaranteed in an occluded or hidden document (the in-app QA
   pane reports `visibilityState: "hidden"`, where rAF is suspended), and any real "open the modal"
   gesture is a click anyway.

Both funnel through the same once-per-block gate, so belt and braces can never double-dispatch.
Once every block has fired, the observer disconnects and the listener is removed, so an
opened-and-closed modal costs nothing afterwards.

The visibility probe is `checkVisibility()` where supported, else `getClientRects().length` —
never `offsetParent`, which is `null` for a perfectly visible `position: fixed` element, and a
Webflow modal panel is usually fixed. A probe failure counts as "not visible", so the block simply
stays pending: that can delay a relayout, never cause a wrong one.

### Embed

```html
<script src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/global-embeds/replica-list/replica-list-relayout.js" defer></script>
```

Production pins the tag, per house convention (`@vX.Y.Z` instead of `@latest`).

## Replica governance

These rules are approved and apply to every curated list.

1. **Naming.** Kebab-case, prefixed `top-`: `top-consultants`, `top-growth-marketers`. The replica
   name ships in the markup, so a rename is a Designer change on every page that uses it.
2. **Standard replicas, not virtual.** Curated ranking is the point, and a standard replica owns
   its own ranking rules and custom ranking outright.
3. **One source index.** All curated replicas hang off `Freelancers3.0-dev`, so every list draws
   from the same records the rest of the site indexes.
4. **Curation happens in the Algolia dashboard.** No ordering logic lives in Webflow or in the
   scripts repo.
5. **Ranking only, not filtering.** A replica reorders the same records the source index holds; it
   does not remove anyone. A list that needs an actual cut (one role, one country) uses
   `wf-algolia-filter` on the wrapper, and the replica still controls the order of what survives.
6. **The replica must exist and answer a query before the wrapper ships.** A typo'd or
   not-yet-created index name produces an empty section with nothing on screen to explain it.

Check it first with the site's public search-only credentials (the same pair served in every page's
HTML):

```sh
curl -sS -X POST "https://PKVW6M9OPZ-dsn.algolia.net/1/indexes/top-consultants/query" \
  -H "X-Algolia-Application-Id: PKVW6M9OPZ" \
  -H "X-Algolia-API-Key: 296cba989b67e9a61f8edf6592c3870e" \
  -d '{"query":"","hitsPerPage":3}'
```

A healthy replica returns `nbHits` plus the first hits in curated order.

## Notes & gotchas

- **Requires wf-algolia >= v1.0.9 on any page that also has an interactive browse list.** Before
  v1.0.9 the engine resolved browse render targets document-wide, so a static list earlier in the
  DOM than the interactive wrapper (the membership modals on `/all-starters`) silently swallowed
  every browse render: the browse list stayed empty while its pagination still updated, and the
  static list's own render then wiped the leaked hits — the theft was invisible at both ends. Fixed
  in wf-algolia PR #6, tag v1.0.9, live on `@latest` since 2026-08-06. If the symptom reappears,
  check for a stale browser-cached engine bundle first (jsDelivr `@latest` caches in browsers for
  up to ~7 days — hard refresh).
- **Never put `[data-loader]` inside the wrapper.** The global
  [Expert Card Browse Loader](../expert-card/browse-loader.md) binds to the first browse block that
  has both a `[data-loader]` and a results list, then drives a masking session off the engine's
  browse events. A static list emits none of those events, so the loader it grabbed would be left in
  whatever state it happened to be in, and the real `/all-starters` browse block would go unmanaged.
  Use `wf-algolia-element="loader"` for the skeleton, never `data-loader`.
- **Never Memberstack-gate the wrapper's DOM.** Static lists render exactly once, at engine init.
  Content absent from the DOM at that moment never renders, and there is no retry: no `refresh`, no
  re-scan, no mutation hook. Gate the trigger button or the surrounding section instead and leave
  the wrapper in the page. **Hidden is fine, absent is fatal.**
- **`WfAlgolia` refresh does not re-run a static list.** The engine's `refresh` event only re-runs
  browse mode; static lists are one-shot by construction.
- **Static lists emit no bus events.** The `results` and `error` events on `window.WfAlgolia` are
  browse-mode only, so nothing can hook "the static list finished" that way. A companion script that
  needs to react to the cards landing must observe the results container.
- **Inline `display: block` clobbers grid.** The engine reveals elements by writing inline
  `display: block`, which flattens a grid or flex wrapper. Use both fixes where they apply: put
  `wf-algolia-display="block"` (or `flex` / `grid`) on the loader and no-results elements, and force
  the container's own display back in CSS while it is not inline-hidden:

```css
[wf-algolia-element="results"] { display: grid; }
[wf-algolia-element="results"]:not([style*="none"]) { display: grid !important; }
```

- **A wrong index name fails silently to the visitor.** A missing `wf-algolia-index` logs
  `[wf-algolia] static list ... missing required wf-algolia-index`; a nonexistent index name logs
  `[wf-algolia] static list query failed`. Either way the visitor sees an empty section: the
  `no-results` element only shows on a **successful** query that returned zero hits, never on an
  error. Run the curl check above before shipping.
- **Staging-only diagnostics** for the relayout companion, per house convention: `*.webflow.io`,
  `localhost`, `127.0.0.1`, `*.trycloudflare.com`, or `window.__replicaListDebug` /
  `?replica-list-debug`. Production is silent, and every path is wrapped — the embed must never
  throw on a page it does not understand.
- Local harness: `local-demos/replica-list/replica-list-demo.html` (real engine, real
  `expert-card.js`, one list inside a fake modal and one visible list, plus an on-page log of every
  `expert-cards:relayout`). Unit tests:
  `node --test global-embeds/replica-list/replica-list-relayout.test.js`.
- Related: [Expert Card](../expert-card/index.md) owns the measurement this embed triggers.
