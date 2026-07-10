---
title: "Slater Mirrors"
---

Source: `slater/` (see the folder's own `README.md` for the refresh commands)

## What it is

GitHub-managed **copies of the Slater.app-hosted JavaScript** served across the site. There is
no Slater account access, so these are captured from the served builds, not exported from the
editor. This folder is a **version-controlled mirror for backup/review — not a deploy path**;
both pages still load from Slater's CDN.

Two builds per project:

- `<id>.readable.js` — the staging/editor build (unminified; use for review/diffs).
- `<id>.prod.min.js` — the production build (minified; the exact bytes live in prod).

## Inventory

| Slater project | Live on page | What it is |
| --- | --- | --- |
| `4885` | `/contract` (public) | Contract-form UI: field show/hide, progress steps, review/edit, validation. |
| `4960` | `/freelancer-start-project` (app) | Contract-form UI — a superset of 4885 (adds condition dropdowns, conditionals, fee-structure change handling). Also mirrored page-scoped at `v2/footers/freelancer-start-project-contract.js`. |

Neither contains secrets or Xano/Airtable/Make calls — pure DOM/form logic.

## How Slater loads on a page

A per-page loader in Webflow custom code picks staging vs prod by host and
dynamic-`import()`s the bundle:

```js
window.location.host.includes('webflow.io')
  ? 'https://slater.app/<id>.js'                          // staging build
  : 'https://slater-app.s3.amazonaws.com/slater/<id>.js'  // production build
```

## Notes & gotchas

- **Source of truth is still the Slater editor.** If someone edits a project in Slater, these
  mirrors go stale until re-pulled (the refresh loop is in the folder README).
- To fully own the code, take a project off Slater: serve the readable build from jsDelivr,
  repoint the page's loader, and staging-test first — the mirrored build and the prod build
  can differ in version even when the logic matches.
- The readable and prod builds carry different `?v=` cache-busters (staging is usually ahead)
  but are the same logic.
