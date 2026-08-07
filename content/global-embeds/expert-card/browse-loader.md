---
title: "Browse Loader"
source: global-embeds/expert-card/expert-card-browse-loader.js
---

Source: `global-embeds/expert-card/expert-card-browse-loader.js`

## What it is

Masks browse-list jank behind the loader on `/all-starters`.

The wf-algolia browse engine re-queries and re-renders on every filter, sort, paginate, clear,
commit, and refresh — and it fires the query **twice per click**, about 70ms apart. Freshly
injected cards paint raw, then ~380ms later the result-modifier embeds rewrite text and
[Expert Card](./index.md) equalizes heights: a visible reflow.

This embed hides that churn. While a browse transition is in flight it **shows** the
designer-authored loader and masks the results list with `visibility: hidden` + `opacity: 0` +
`pointer-events: none` — never `display`, so the layout space is kept and it never fights the
engine's own display writes. When the transition settles (cards rendered **and** heights
equalized), the loader hides and the list reappears in its final layout with a short fade.

Unlike [Explore Search List Loader](../../explore-search/list-loader.md), which sniffs network
traffic, this embed hooks the engine directly: cache-served browse queries produce zero network
traffic, so it watches the engine's own loader show/hide writes and its `results` / `error` bus
events instead.

## File structure

```
Expert Card
├── Expert Card - JS            (measurement + touch: see Expert Card)
└── expert-card-browse-loader.js
```

Load with `defer`. Standalone — no imports and no shared globals with the sibling expert-card
embeds; it coordinates with them only through the `expert-cards:relayout:done` window event.
Idempotent via `window.__expertCardBrowseLoaderInit`. It bails out quietly when the contract markup
is absent, and if `WfAlgolia` never appears within 10s it force-restores everything and stays off.

## Markup contract

```html
<div wf-algolia-element="browse">
  <!-- The loader is a SIBLING of the results list, so masking the list never
       hides the loader. Numeric value = minimum display duration in ms. -->
  <div data-loader="1000">…spinner…</div>

  <div wf-algolia-element="results">
    <div class="expert-card_item">…</div>
  </div>
</div>
```

The loader must be a **sibling** of the results list, not inside it. Both must live inside the same
`[wf-algolia-element="browse"]` block.

## Block resolution

A page can carry several browse blocks. `/all-starters` ships one per Memberstack gate variant plus
satellites that hold only a results-count — **5 blocks in its raw HTML, and the first has neither a
`[data-loader]` nor a results list.** A plain `querySelector()` therefore grabbed a block this embed
cannot drive and bailed at init, managing nothing (reproduced live 2026-07-28).

Two rules make resolution deterministic:

1. **Only a block with both a `[data-loader]` and a `[wf-algolia-element="results"]` can be
   driven.** Skip the others instead of bailing on the first miss.
2. **Prefer a visible qualifying block, and wait for the gates to settle first.** Memberstack
   *removes* the non-matching variants, but only after it resolves — and this embed runs at defer
   time, before that. Binding the first qualifying block too early picks a variant that is about to
   be deleted, leaving the surviving one unmanaged.

So it waits on `window.memberReady` (the site's own helper, the strongest signal that gates are
settled) and polls every 100ms for a visible match, for up to 10s. After that it falls back to a
hidden qualifying block rather than nothing. With no qualifying block at all, it stops polling and
stays off.

Visibility is `offsetParent !== null || getClientRects().length > 0`: `offsetParent` is `null`
inside a `display: none` subtree, so a gate variant Memberstack has hidden but not yet removed is
skipped, and `getClientRects` is the second opinion for `position: fixed` subtrees where
`offsetParent` is also null. A probe failure counts as visible, so it never blocks resolution.

## Session lifecycle

**Start.** A MutationObserver on the loader's `style` attribute drives a *convergent* state machine
— there is no write attribution, because observer callbacks are async microtasks, so a synchronous
suppress flag is always reset by the time the callback runs. When the engine shows the loader while
idle, a session begins (record the shown time, mask the list). While a session is active the loader
is kept visible: if the engine hides it mid-session, the re-show rewrites the style, which re-fires
the callback, which then sees visible + active and no-ops. It converges without looping.

**Settle.** Each `WfAlgolia` `results` event (re)starts a settle-wait that resolves on the next
window `expert-cards:relayout:done`, with a 600ms timeout fallback for pages that lack
`expert-card.js`. Then two `requestAnimationFrame`s raced against a short timeout — hidden tabs
suspend rAF entirely — to let the height writes paint.

`relayout:done` events are **ignored until the session's first `results` event**. `expert-card.js`
also dispatches it from its window-load, `fonts.ready`, and resize passes, and a stray one mid-query
(e.g. `fonts.ready` during initial load) would otherwise settle the session before cards render.
The engine's double-fire, or a new engine loader-show during the wait, **restarts** the session
rather than ending it early.

**Bounded image wait.** After the layout settles, freshly revealed cards may still have
`loading="lazy"` photos that finish 1–1.5s later and visibly pop in, so the settle-wait also waits
for any not-yet-complete `<img>` in the list to load or error, raced against a 1200ms timeout. Each
wait is stamped with a settle-attempt counter (bumped on session begin, restart, and end), so a
stale image wait completing after a restart can never end a newer session.

**End.** Only when **both** the settle-wait completed **and** the minimum display time elapsed:
hide the loader, restore the list. An `error` event ends the session after minimum display without
waiting for `relayout:done` or images. A 6s failsafe ceiling force-ends unconditionally. Every path
is wrapped in try/catch and restores the list, so it can never stay hidden — on success, error,
timeout, and exception alike.

## API

| Attribute | On | Values | Default | Purpose |
| --- | --- | --- | --- | --- |
| `data-loader` | sibling of the results list, inside the browse block | empty, or a non-negative integer (ms) | `200` | Marks the loader; the numeric value sets the minimum display duration. |
| `wf-algolia-element="loader"` | the loader | — | — | Written by this embed when promoting (below); authored only if you want a different element to be the engine's loader. |
| `wf-algolia-display` | the loader | CSS display value | `block` | Written by this embed when promoting; prevents the engine's `display:block` console warning. |

| Hook | Type | Purpose |
| --- | --- | --- |
| `expert-cards:relayout:done` | `window` event (listened for) | Emitted by `expert-card.js` when a measurement pass finishes; the primary settle signal. |
| `WfAlgolia.on('results' \| 'error')` | engine bus | Restarts the settle-wait / ends the session. |

Constants (from source): `DEFAULT_MIN_MS = 200`, `SETTLE_TIMEOUT_MS = 600`,
`SESSION_CEILING_MS = 6000`, `IMAGE_WAIT_MS = 1200`, `POLL_INTERVAL_MS = 100`,
`POLL_MAX_MS = 10000`, `RESOLVE_MAX_MS = 10000`.

## Notes & gotchas

- **Opacity is load-bearing, not decoration.** `visibility: hidden` alone can be punched through by
  a descendant carrying an explicit inline `visibility: visible` (interaction-written styles on the
  favorite wrapper did exactly this), which left bookmarks floating over the emptied grid
  mid-mask — reproduced live. Ancestor opacity composites the whole subtree and cannot be overridden
  by a descendant; `pointer-events: none` blocks interaction with the invisible cards.
- **The reveal fade is free.** The mask already zeroed opacity, so `showList` adds an
  `opacity 180ms ease` transition *before* clearing the mask, then clears the transition ~250ms
  later. Masking clears the transition first, so re-masking is always instant.
- **Self-heal at init.** The page ships the loader permanently visible with no script managing it,
  so this embed force-hides it once at init. The loader is never user-visible outside a session.
- **Loader promotion.** The engine's `runBrowseQuery()` shows a `[wf-algolia-element="loader"]`
  before every query — re-querying the DOM each call, so a late-added attribute is honored — and
  hides it before injecting hits, including for cache-served repeats. This embed promotes *our*
  `[data-loader]` to that contract by adding `wf-algolia-element="loader"` and
  `wf-algolia-display="block"`. If the browse block already has a **different**
  `[wf-algolia-element="loader"]`, promotion is skipped but show/hide is still driven through the
  `[data-loader]` element.
- **No arming logic is needed.** The `results` / `error` events and the loader show/hide are emitted
  **only** by browse mode, so every trigger here is browse-scoped by construction. The initial
  page-load query also shows the loader via the engine, which is desirable — it masks initial-load
  tweaking too.
- **Accepted limitation.** A mid-session query that resolves *later* than the remaining
  minimum-display time after a settle can render unmasked, because the session will already have
  ended. This is rare (the engine's double-fire queries run ~70ms apart, well inside the default or
  authored minimum), it self-corrects via the relayout pipeline, and it can never leave the list
  hidden.
- **Never author a `[data-loader]` inside a static replica list.** This embed would bind to it,
  and a static list emits none of the browse events that drive a session — see
  [Replica List](../replica-list/index.md).
