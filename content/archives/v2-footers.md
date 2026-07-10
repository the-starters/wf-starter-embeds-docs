---
title: "V2 Page Footers"
---

Source: `v2/footers/` (see the folder's own `README.md` for the full deployment rules)

## What it is

The source of truth for the **live, secure V2 Webflow page footer logic** — the per-page
controllers of the v2 site (`hirethestarters.com`). Two artifacts exist per page:

- **`<page>.js`** — CDN-loadable via jsDelivr with a single `<script defer>` tag (preferred).
- **`<page>-footer.html`** — the original inline paste-in `<script>` block, kept as
  reference/fallback.

The `.js` is extracted verbatim from the `.html`. **Edit the `.html` source, then re-extract
the `.js`** so the two never drift.

## Pages

| Page | CDN file |
| --- | --- |
| `/opportunities-apply` | `v2/footers/opportunities-apply.js` |
| `/opportunities-applicants` | `v2/footers/opportunities-applicants.js` |
| `/opportunities-freelancer-view` | `v2/footers/opportunities-freelancer-view.js` |
| `/freelancer-edit-form` | `v2/footers/freelancer-edit-form.js` |
| `/freelancer-start-project` | `v2/footers/freelancer-start-project.js` **+ the inline Slater loader tag** |
| `/quiz-results` (v2) | `v2/footers/quiz-results.js` — *not* the 3.0 [Quiz Results](../page-scripts/quiz-results.md) script |

Each loads with:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v2/footers/<page>.js"></script>
```

`@latest` resolves to the highest semver **tag** — files ship only after a merge **and** a new
tag is cut. External libraries (Memberstack, Quill, Algolia, …) are **not** in these files and
must keep loading from the site head / on-canvas embeds.

## The contract-form special case

`/freelancer-start-project` needs **two** tags: the CDN tag plus a separate inline Slater
loader (`freelancer-start-project-slater.html`), which pulls the contract-form field logic
from Slater project `4960` — see [Slater Mirrors](slater.md).
`freelancer-start-project-contract.js` in this folder is a readable, GitHub-managed mirror of
that Slater logic, captured for review — it is **not loaded live**. A stale earlier migration
also sits at `v2/contract.js`; both are deliberately left as-is.

## Notes & gotchas

- **Public repo — no secrets, ever.** Identity resolution and Airtable/Make calls happen
  server-side in the Xano bridge. Scan before committing:
  `grep -nE 'api\.airtable\.com|hook\.us1\.make\.com|pat[A-Za-z0-9]{14}' *.js *.html`
- Never commit `backups/` or `*-unsecure.html` — the workspace backups intentionally preserve
  pre-remediation code with live secrets.
- These scripts gate on `DOMContentLoaded` / `getCurrentMember()`, so `defer` is safe.
- They belong to the **v2** platform (see [PostHog Track](../utils/posthog-track.md)'s
  platform detection) — behaviour walkthroughs are out of scope for these 3.0 docs.
