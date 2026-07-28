---
title: "Roles"
source: algolia-result-modifiers/roles.js
---

Source: `algolia-result-modifiers/roles.js`

## What it is

Turns a comma-separated `roles` value into separate elements. On `DOMContentLoaded` it first
checks whether the page contains any `wf-algolia-text="roles"` element at all and stops
immediately if it does not. Otherwise it finds every such element inside a
`.wf-algolia-injected` card, splits its text on commas, and cleans each role (trim, hyphens to
spaces, collapse whitespace):

- **One role.** The text is cleaned in place and the `wf-algolia-text` attribute is removed so
  the node is never re-processed.
- **Multiple roles.** The original element is replaced by one shallow clone per role. Each clone
  keeps the original's tag and classes (so styling carries over), gets one role as its text, and
  has `wf-algolia-text` removed.
- **Nothing left after cleaning.** An empty value, or a punctuation-only one such as `,` or `-`,
  has its text blanked so no stray separator renders, and its `wf-algolia-text` removed. Leaving
  the attribute in place would keep the node matched forever and re-fire a relayout on every
  later pass.

When a pass actually changes something it dispatches an `expert-cards:relayout` custom event on
`window` (debounced 60ms) so a card-layout script can re-measure. On `/all-starters` that event
is what makes `expert-card.js` recompute `--expert-card-jobs-open-height`, which sizes the hover
reveal to the new number of role lines. A pass that changes nothing dispatches nothing.

## How it knows when to run

The pass is driven by the engine's own `results` event, which wf-algolia emits after it has
rendered hits, so the script re-runs on every re-render (new search, filter, sort, pagination).

The engine loads asynchronously, so it may not exist yet when this script boots. The script
waits for it in short intervals with a ceiling of about two seconds, then gives up and falls
back to a `MutationObserver` attached to *every* `wf-algolia-element="browse"` and
`wf-algolia-element="results"` container on the page.

Watching a single container is deliberately avoided. An earlier version resolved one container
with `querySelector`, which took only the first match. On a page with more than one browse
container, where Memberstack removes the section that does not apply to the current member, the
observer could end up bound to a detached element while the engine rendered somewhere else. The
result was raw text such as `head-of-growth,paid-social` reaching the page, with no console
error to show why.

## File structure

```
Roles - JS
```

Load after the Algolia integration script, on pages that render Algolia expert cards.

## Markup contract

```html
<div wf-algolia-element="browse"> <!-- or wf-algolia-element="results" -->
  <div class="wf-algolia-injected">
    <p class="role-tag" wf-algolia-text="roles">product-designer, brand designer</p>
    <!-- becomes two p.role-tag elements: "product designer" and "brand designer" -->
  </div>
</div>
```

## API

No options; the field name is hard-coded to `roles`.

| Hook | On | Purpose |
| --- | --- | --- |
| `wf-algolia-element="browse"` / `"results"` | container | Fallback only. If the engine never appears, every matching container is observed, with no precedence between the two. |
| `.wf-algolia-injected` | card | Only elements inside injected cards are processed. |
| `wf-algolia-text="roles"` | text element | Split into one element per role; attribute removed after processing. |

| Event | Fired on | When |
| --- | --- | --- |
| `expert-cards:relayout` | `window` | 60ms after a pass that actually changed something. |

## Notes & gotchas

- Clones are shallow: tag and classes are copied, but any child elements inside the original
  element are not; keep the roles element text-only.
- The `wf-algolia-text` attribute is stripped from the output, so anything else that targets
  `wf-algolia-text="roles"` won't find the element after this script runs.
- Hyphens always become spaces and commas always split, so a role name containing either will be
  rewritten accordingly.
- Style the individual role tags off the element's class (it survives the cloning), and make the
  parent a flex/grid container since one element can become several siblings.
- If no `wf-algolia-text="roles"` element exists anywhere on the page, the script stops at once
  and never wires anything up.
- Do not read the `results` event payload. The engine sends two different shapes: the
  single-index path passes the raw Algolia response, which has `hits`, while the federated path
  used on first load passes `{ results, nbHits, nbPages }`, which does not. Re-query the DOM
  instead.
- If neither the engine nor any container is found, the script logs a warning, but only on
  staging hosts (`*.webflow.io`, `localhost`, `*.trycloudflare.com`) or when
  `window.STARTERS_DEBUG` is set. Production stays silent.
- The engine fires its browse query twice per filter click, roughly 70ms apart, so the pass runs
  twice. That is harmless: the first pass strips `wf-algolia-text` from everything it touches, so
  the second finds nothing and dispatches nothing.
