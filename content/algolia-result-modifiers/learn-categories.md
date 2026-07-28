---
title: "Learn Categories"
source: algolia-result-modifiers/learn-categories.js
---

Source: `algolia-result-modifiers/learn-categories.js`

## What it is

Turns a learn-content card's comma-separated category slugs into one pill per category, with
official display names. The Algolia record stores slugs like
`ai-technology, paid-media`; this script splits them, maps each slug through the
`CATEGORY_LABELS` table at the top of the file (`ai-technology` becomes `AI & Technology`),
and replaces the seed element with one clone per label. Added in **v1.25.2**.

Slugs missing from the table fall back to a generic prettifier (hyphens to spaces, Title
Case), so a new CMS category still renders sensibly before the table is updated. A card with
no categories gets its seed removed rather than leaving a stray empty pill.

## How it knows when to run

Two triggers, both always active:

1. A `MutationObserver` on **every** `wf-algolia-element="browse"` and
   `wf-algolia-element="results"` container on the page.
2. The engine's own `results` event, which wf-algolia emits after it has rendered hits.

Both are needed. The engine emits `results` from browse mode only, and this script's targets
live in the **search overlay** (`.search-brilliance_results-wrapper`, which carries the
`results` role), which renders through a path that fires no event at all. So the observer is
what covers the overlay, and the event covers browse re-renders without waiting on mutation
batching.

Before this, the script resolved a single container with `querySelector` and preferred
`browse`, which meant it bound to the browse grid and never saw the overlay renders it exists
to process. On `/all-starters` that left raw slugs on the page for every overlay query.

The script also stops immediately at boot if the page contains no `data-learn-category`
element at all, and it binds only once even though the component that loads it is instantiated
twice per page.

## Markup contract

```html
<!-- inside the card template; the engine injects the slugs as text -->
<span data-learn-category wf-algolia-text="categories">ai-technology, paid-media</span>
```

The seed span is cloned shallowly, so the pills inherit its classes. The clones drop both the
`wf-algolia-text` and `data-learn-category` attributes, which is what prevents the observer
from re-processing them.

## Notes & gotchas

- Only elements inside `.wf-algolia-injected` cards are touched, so the card template itself is
  left alone.
- The `results` event payload must not be read. The engine sends two different shapes: the
  single-index path passes the raw Algolia response, which has `hits`, while the federated path
  used on first load passes `{ results, nbHits, nbPages }`, which does not. Re-query the DOM.
- If no browse or results container exists, the script logs a warning, but only on staging hosts
  (`*.webflow.io`, `localhost`, `*.trycloudflare.com`) or when `window.STARTERS_DEBUG` is set.
  Production stays silent.
- **Update `CATEGORY_LABELS` when categories are added or renamed in the CMS.** The fallback
  prettifier can't know about ampersands or special casing (`retention-crm` would render as
  `Retention Crm`, not `Retention & CRM`).
