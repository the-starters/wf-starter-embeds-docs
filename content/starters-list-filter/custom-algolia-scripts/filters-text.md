---
title: "Filters Text"
source: starters-list-filter/custom-algolia-scripts/filters-text.js
---

Source: `starters-list-filter/custom-algolia-scripts/filters-text.js`

## What it is

Cosmetic text cleanup for the filter UI. WF-Algolia renders raw facet keys and values
("also-worked-with: acme-corp"); this script rewrites them into human labels in two places:

- `wf-algolia-element="filter-tag-text"`: active-filter chips in the `Field: Value` shape.
  The field key is mapped through a built-in label map (`functions` → "Function", `roles` →
  "Role", `also-worked-with` → "Company", `country`, `city`, `state`, `fulltime-toggle` →
  "Full Time?", `availability`, `industries`, `rate`); unknown keys are humanized
  (dashes/underscores to spaces, Title Case). The value part is humanized the same way.
- `wf-algolia-element="filter-value-text"`: selected-value slots; only the value is
  processed.

Two value classes are protected from humanizing: numeric buckets like `1-10` / `21-40` are
kept intact (the hyphen is normalized to an en dash), and `rate` chip values are passed
through untouched because WF-Algolia already formats them.

Rewrites run on init, after WF-Algolia `response` and `filter` events (on the next animation
frame, i.e. after the bundle's own render), and via a body-wide `MutationObserver` that
disconnects while writing so its own text changes do not re-trigger it.

## File structure

```
Filters Text - JS
```

For pages that show filter chips or selected-value text.

## Markup contract

No authoring needed beyond the standard WF-Algolia slots; the script finds them itself:

```html
<!-- Active-filter chip -->
<div wf-algolia-element="filter-tag-text">also-worked-with: acme-corp</div>
<!-- becomes: Company: Acme Corp -->

<!-- Selected-value slot -->
<span wf-algolia-element="filter-value-text">product-design</span>
<!-- becomes: Product Design -->
```

## API

| Hook | On | Purpose |
| --- | --- | --- |
| `wf-algolia-element="filter-tag-text"` | chip text | Rewritten as `Pretty Field: Pretty Value` (split on the first `": "`). A chip without that separator is humanized whole. |
| `wf-algolia-element="filter-value-text"` | value slot | Value-only prettify. |

The field label map is hard-coded in the script; adding a new facet label means editing
`FIELD_LABELS` in the source, not an attribute.

## Notes & gotchas

- Humanizing Title-Cases every word, so genuinely cased values ("iOS", "USA") come out wrong
  ("Ios", "Usa") unless they pass through the bucket/rate exemptions. Facet values on this
  site are slugs, which is what the transform is built for.
- The chip parser splits on the first colon-space; values containing `": "` would be split at
  the wrong point.
- In the value slot the field key is unknown, so the `rate` pass-through does not apply
  there; only the numeric-bucket protection does.
- The MutationObserver watches the whole body including text changes; it is guarded against
  self-triggering but still runs on every DOM change on the page.
