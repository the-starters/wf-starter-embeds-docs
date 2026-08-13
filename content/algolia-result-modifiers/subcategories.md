---
title: "Subcategories"
source: algolia-result-modifiers/subcategories.js
---

Source: `algolia-result-modifiers/subcategories.js`

> **Not on the CDN — do not install.** This Script Path is not in `starters-webflow` `main`.
> The walkthrough below is the intended contract if/when the modifier ships. Until then the
> reserved-stub allowlist keeps ownership CI green.

## What it is

Turns a Starter's `categories.lvl1` hierarchical paths into one element per
**Subcategory** — the leaf after `>`. It boots on `DOMContentLoaded`, or
immediately if the document is already ready. It first checks whether the page
contains any `wf-algolia-text="categories.lvl1"` element at all and stops
immediately if it does not. Otherwise it finds every such element inside a
`.wf-algolia-injected` card and rewrites it.

The engine writes an array through `textContent`, which stringifies as
`Array#toString` (comma, no spaces). Each item is a hierarchical path such as
`Paid Media > Performance Creative Strategy`. Parent **Category** names in this
taxonomy contain commas (`Influencer, Affiliate & PR`), so this script must
**not** split on comma the way [Roles](./roles.md) does. It splits on ` > `,
treats a comma inside a later fragment as the end of the current path, and
emits the last segment of each path. Labels are left in the capitalization the
index already stores; there is no display-name map and no hyphen-to-space pass.

- **One Subcategory.** The text is replaced in place and the `wf-algolia-text`
  attribute is removed so the node is never re-processed.
- **Multiple Subcategories.** The original element is replaced by one shallow
  clone per leaf. Each clone keeps the original's tag and classes, gets one
  Subcategory as its text, and has `wf-algolia-text` removed.
- **Nothing left.** An empty value, or punctuation-only text such as `,` or
  `>`, has its text blanked and its hook removed. The node stays in the tree.
  Missing lvl1 does **not** fall back to lvl0 Category names.

This sits **alongside** roles on the same card. It does not replace them.

When a pass actually changes something it dispatches an `expert-cards:relayout`
custom event on `window` (debounced 60ms) so a card-layout script can
re-measure. A pass that changes nothing dispatches nothing.

## How it knows when to run

Two triggers, both always active:

1. A `MutationObserver` on **every** `wf-algolia-element="browse"` and
   `wf-algolia-element="results"` container on the page.
2. The engine's own `results` event, which wf-algolia emits after it has
   rendered hits.

Both are needed. The engine emits `results` from browse mode only, and the
search overlay (the `results` role) renders through a path that fires no event
at all. The observer covers the overlay; the event covers browse re-renders
without waiting on mutation batching.

Watching a single container is deliberately avoided. On `/all-starters` several
browse containers exist and Memberstack removes the section that does not apply
to the member. Binding to the first match can leave the observer on a detached
node while the engine renders somewhere else.

The script also stops immediately at boot if the page contains no
`wf-algolia-text="categories.lvl1"` element at all, and it binds only once even
though the component that loads it is instantiated twice per page.

## File structure

```
Subcategories - JS
```

Load after the Algolia integration script, with `defer`, on pages that render
Algolia expert cards, alongside the other result modifiers.

## Markup contract

```html
<div wf-algolia-element="browse"> <!-- or wf-algolia-element="results" -->
  <div class="wf-algolia-injected">
    <p class="subcategory-tag" wf-algolia-text="categories.lvl1">Paid Media > Performance Creative Strategy,Creative > Video & Production</p>
    <!-- becomes two p.subcategory-tag elements:
         "Performance Creative Strategy" and "Video & Production" -->
  </div>
</div>
```

The seed must be text-only. Style chips off its class (the class survives
cloning) and make the parent a flex/grid container, since one element can
become several siblings.

## API

No options; the field name is hard-coded to `categories.lvl1`.

| Hook | On | Purpose |
| --- | --- | --- |
| `wf-algolia-element="browse"` / `"results"` | container | Every matching container is observed. No precedence between the two. |
| `.wf-algolia-injected` | card | Only elements inside injected cards are processed. |
| `wf-algolia-text="categories.lvl1"` | text element | Split into one element per Subcategory; attribute removed after processing. |

| Event | Fired on | When |
| --- | --- | --- |
| `expert-cards:relayout` | `window` | 60ms after a pass that actually changed something. |

## Notes & gotchas

- Do **not** copy Roles' `split(',')`. A Starter in `Influencer, Affiliate & PR`
  would otherwise become the tags `Influencer` and `Affiliate & PR > …`.
- **Subcategory labels must not contain commas.** That is the constraint that
  makes reconstructing paths from the engine-joined string possible. If a leaf
  ever contains a comma, add a flattened leaf-only index field instead of
  widening this parse.
- A three-level path `A > B > C` displays as `C` (last segment), matching how
  quiz results already define a Subcategory.
- A path with no `>` displays as the whole string.
- Clones are shallow: tag and classes are copied, but any child elements inside
  the original are not.
- The `wf-algolia-text` attribute is stripped from the output, so anything else
  that targets `wf-algolia-text="categories.lvl1"` will not find the element
  after this script runs.
- If no `wf-algolia-text="categories.lvl1"` element exists anywhere on the page,
  the script stops at once and never wires anything up.
- Do not read the `results` event payload. The engine sends two different
  shapes: the single-index path passes the raw Algolia response, which has
  `hits`, while the federated path used on first load passes
  `{ results, nbHits, nbPages }`, which does not. Re-query the DOM instead.
- If no browse or results container exists, the script logs a warning, but
  only on staging hosts (`*.webflow.io`, `localhost`, `*.trycloudflare.com`)
  or when `window.STARTERS_DEBUG` is set. Production stays silent. A missing
  engine is not a warning: the script polls for about two seconds, then runs
  once against whatever is already in the DOM.
- The engine fires its browse query twice per filter click, roughly 70ms apart,
  so the pass runs twice. That is harmless: the first pass strips
  `wf-algolia-text` from everything it touches, so the second finds nothing and
  dispatches nothing.
- Merging this file does not ship it. The Algolia Result Modifiers Webflow
  component is pin-locked; add a fifth script tag and bump the pin, then
  republish. Until then, tunnel-test with `./dev-tunnel.sh`.
