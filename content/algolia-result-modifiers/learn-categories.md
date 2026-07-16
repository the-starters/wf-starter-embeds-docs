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

## Markup contract

```html
<!-- inside the card template; the engine injects the slugs as text -->
<span data-learn-category wf-algolia-text="categories">ai-technology, paid-media</span>
```

The seed span is cloned shallowly, so the pills inherit its classes. The clones drop both the
`wf-algolia-text` and `data-learn-category` attributes, which is what prevents the observer
from re-processing them.

## Notes & gotchas

- Like the other modifiers in this group, it watches the results container
  (`[wf-algolia-element="browse"]`, falling back to `[wf-algolia-element="results"]`) with a
  MutationObserver and re-runs as results refresh or paginate. Only elements inside
  `.wf-algolia-injected` cards are touched.
- **Update `CATEGORY_LABELS` when categories are added or renamed in the CMS.** The fallback
  prettifier can't know about ampersands or special casing (`retention-crm` would render as
  `Retention Crm`, not `Retention & CRM`).
