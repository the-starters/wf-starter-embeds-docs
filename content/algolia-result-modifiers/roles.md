---
title: "Roles"
source: algolia-result-modifiers/roles.js
---

Source: `algolia-result-modifiers/roles.js`

## What it is

Turns a comma-separated `roles` value into separate elements. On `DOMContentLoaded` it finds every
element with `wf-algolia-text="roles"` inside a `.wf-algolia-injected` card, splits its text on
commas, and cleans each role (trim, hyphens to spaces, collapse whitespace):

- **One role.** The text is cleaned in place and the `wf-algolia-text` attribute is removed so
  the node is never re-processed.
- **Multiple roles.** The original element is replaced by one shallow clone per role. Each clone
  keeps the original's tag and classes (so styling carries over), gets one role as its text, and
  has `wf-algolia-text` removed.

After every pass it dispatches an `expert-cards:relayout` custom event on `window` (debounced
60ms) so a card-layout script can re-measure. A `MutationObserver` on the results container
re-runs the pass whenever results are re-rendered.

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
| `wf-algolia-element="browse"` / `"results"` | container | Watched for mutations; `browse` is preferred if both exist. |
| `.wf-algolia-injected` | card | Only elements inside injected cards are processed. |
| `wf-algolia-text="roles"` | text element | Split into one element per role; attribute removed after processing. |

| Event | Fired on | When |
| --- | --- | --- |
| `expert-cards:relayout` | `window` | 60ms after each processing pass. |

## Notes & gotchas

- Clones are shallow: tag and classes are copied, but any child elements inside the original
  element are not; keep the roles element text-only.
- The `wf-algolia-text` attribute is stripped from the output, so anything else that targets
  `wf-algolia-text="roles"` won't find the element after this script runs.
- Hyphens always become spaces and commas always split, so a role name containing either will be
  rewritten accordingly.
- Style the individual role tags off the element's class (it survives the cloning), and make the
  parent a flex/grid container since one element can become several siblings.
- If neither `wf-algolia-element="browse"` nor `"results"` exists, the script still runs once on
  load but won't react to later result updates.
