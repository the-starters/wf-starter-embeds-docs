---
title: "Opportunities: Create"
source: opportunities---create.js
---

Source: `opportunities---create.js` (repo root)

## What it is

The **`/opportunities---create` page controller**. Binds the brand "create opportunity" form to
the Xano `brand/opportunities/create` endpoint through the shared core
([Opportunities 3.0: Core](opportunities-3-0.md), `window.Opp30`).

It reads the form with role-aware helpers (selected `[data-opp-role-value]` chips, checked
radios/checkboxes, project-type mapping to the human strings Xano stores) and submits through
the core's authenticated API wrapper.

## File structure

```
opportunities---create.js   (repo root, ~240 lines)
```

**Load order matters** (page footer, after the existing Memberstack + Xano scripts):

1. `opportunities-3.0.js`: the shared core, exposes `window.Opp30`
2. `opportunities---create.js`: this file

## Notes & gotchas

- Run-once guard: `window.__opp30CreatePage`. The flag is **shared with the core's standalone
  create handler**, so the form is never double-bound when both scripts load on one page.
- The `PROJECT_TYPE` map translates the Webflow radio `id`s (`One-Time`,
  `Ongoing-Part-Time`, …) into the exact strings Xano stores (`One Time`,
  `Ongoing Part Time`, …); renaming those radios in the Designer breaks the mapping.
- `DEBUG_LOG` at the top of the file controls the `[opp30:create]` console logging; flip to
  `false` for production quiet.
- Conventions and the wider flow are documented in
  `product-workflows/opportunities/docs/wf-js-guide.md` (workspace).
