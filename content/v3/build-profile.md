---
title: "Build Profile"
source: v3/build-profile/profile-photo.js
sources:
  - v3/build-profile/portfolio-crud.js
  - v3/build-profile/portfolio-list.js
  - v3/build-profile/company-autocomplete.js
  - v3/build-profile/work-dates.js
  - v3/build-profile/company-experience-crud.js
  - v3/build-profile/field-counters.js
  - v3/build-profile/bio-editor.js
  - v3/build-profile/grouped-selects.js
  - v3/build-profile/submit-diagnostics.js
---

Source: `v3/build-profile/profile-photo.js` and the eight sibling replacements plus
`submit-diagnostics.js`

## What it is

Source-controlled **browser controllers** for the Talent Build Profile wizards. The native
Webflow forms and their authored success/error elements stay in Webflow. These files replace
self-contained inline blocks on `/build-profile/consult` and `/build-profile/full-profile`
and load from GitHub through jsDelivr.

They are **not** the funnel-position check. That is
[`build-profile-redirect.js`](./auth-route-and-redirects.md#build-profile-redirectjs--the-talent-funnel-position-check)
on the same three `/build-profile/*` pages. Draft localStorage scoping is
[`build-profile-draft-identity-guard.js`](./auth-route-and-redirects.md#build-profile-draft-identity-guardjs--member-scoped-draft-storage).
Do not re-embed those here.

Both wizard pages produced the same nine captured body hashes. Replace each exact inline
block in place with its matching deferred loader.

## File structure

```
v3/build-profile/
├── profile-photo.js              Authenticated profile-photo upload
├── portfolio-crud.js             Portfolio create, edit, delete, media, and previews
├── portfolio-list.js             Portfolio list read and render
├── company-autocomplete.js       Company and logo autocomplete
├── work-dates.js                 Work-date validation and current-role state
├── company-experience-crud.js    Company-experience CRUD
├── field-counters.js             Authored field counters
├── bio-editor.js                 Bio editor and word limit
├── grouped-selects.js            Grouped multi-select options
└── submit-diagnostics.js         Outcome observer + success route (not a replacement)
```

**Not browser embeds.** Do not paste these into Webflow:

- [`utils/multi-step-failover.js`](../utils/multi-step-failover.md) — Videsigns outage probe;
  the mirrored engine is `vendor/videsigns-multi-step.js`.
- `build-profile-wiring-audit.js` — a **Node** audit tool (`require('node:fs')`) that checks
  saved Webflow page HTML for the pinned vendored engine and the draft-identity guard. Never
  served to a browser.

## Loader order

Do **not** consolidate or reorder these loaders. Untouched blocks between them still supply
shared globals and form state.

Install `v3/native-form-diagnostics.js` **sitewide with `defer`, before any of these deferred
mutation assets**, so photo, portfolio, and company-experience requests can emit receipts.
That shared observer reads no fields, prevents no submit, and does not add diagnostic copy
to page messages.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/native-form-diagnostics.js"></script>
```

Then, on `/build-profile/consult` and `/build-profile/full-profile` only, the nine
replacements in this order:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/build-profile/profile-photo.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/build-profile/portfolio-crud.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/build-profile/portfolio-list.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/build-profile/company-autocomplete.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/build-profile/work-dates.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/build-profile/company-experience-crud.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/build-profile/field-counters.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/build-profile/bio-editor.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/build-profile/grouped-selects.js"></script>
```

Add the observer **after the final writer** on both pages:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/build-profile/submit-diagnostics.js"></script>
```

`@latest` moves with the newest git tag. Production may pin `@vX.Y.Z`.

The Designer owns every form, modal, and field. These files bind to authored IDs and custom
attributes; they do not generate the wizard chrome.

## Controllers

| File | Responsibility |
| --- | --- |
| `profile-photo.js` | Authenticated profile-photo upload |
| `portfolio-crud.js` | Portfolio create, edit, delete, media, and previews |
| `portfolio-list.js` | Portfolio list read and render |
| `company-autocomplete.js` | Company and logo autocomplete |
| `work-dates.js` | Work-date validation and current-role state |
| `company-experience-crud.js` | Company-experience CRUD |
| `field-counters.js` | Authored field counters |
| `bio-editor.js` | Bio editor and word limit |
| `grouped-selects.js` | Grouped multi-select options |
| `submit-diagnostics.js` | Observer-only submit outcome + onboarding route |

Photo, portfolio, and company blocks wait on `waitForMember` and exit when `MEMBER.id` is
missing. Counters, bio, and grouped selects bind the authored widgets without that gate.

### `submit-diagnostics.js` — observer only

Not a replacement for an inline block. Elvin's inline writer remains the sole mutation
owner. This controller:

- watches the existing human click on `[form-submit]` and the authored
  `[build-profile-success]` / `[build-profile-error]` states;
- does **not** read fields, intercept the click, or change the coupled writer;
- after the authored success state appears, preserves the clean success copy for **1.2
  seconds**, then `location.replace('/starter-onboarding')`;
- leaves errors on the form.

It runs only on `/build-profile/consult` and `/build-profile/full-profile`, and only on
`the-starters-3-0.webflow.io`, `thestarters.com`, `www.thestarters.com`, plus localhost,
`127.0.0.1`, and `*.trycloudflare.com` for the dev tunnel. Run-once guard:
`window.__startersBuildProfileSubmitDiagnosticsBooted`.

When diagnostics are available it records a `build_profile_submit` receipt
(`controller_version` `build-profile-submit-outcome-v2`) and loads
`utils/workflow-diagnostics.js` from the same CDN root if needed.

## Markup contract

| Hook | On | Used by |
| --- | --- | --- |
| `#profile-photo-wrap`, `#profile-photo`, `#profile-photo-preview`, `#profile-photo-url` | photo UI | `profile-photo.js` |
| `[data-highlights]`, `.portfolio_card` | portfolio grid | `portfolio-crud.js` |
| `#portfolio-block`, `.case-studies-wrapper` | portfolio list | `portfolio-list.js` |
| `[logo-search-input]` | company search inputs | `company-autocomplete.js` |
| company start/end date fields + current-role checkbox | work dates | `work-dates.js` |
| `.company-list`, `.company-card` | experience list | `company-experience-crud.js` |
| `input.with-count`, `textarea.with-count` | counted fields | `field-counters.js` |
| `#bio-editor`, `#bio-plain`, `#bio-html` | Quill bio | `bio-editor.js` |
| `[ms-code-select-wrapper="multi"][data-grouped-select="with-category"]` | grouped selects | `grouped-selects.js` |
| `[build-profile-form]`, `[form-submit]`, `[build-profile-success]`, `[build-profile-error]` | native submit | `submit-diagnostics.js` |

## xAttribute JSON

Submit observer (form and its outcome surfaces):

```json
{
  "build-profile-form": ""
}
```

```json
{
  "form-submit": ""
}
```

```json
{
  "build-profile-success": ""
}
```

```json
{
  "build-profile-error": ""
}
```

Company autocomplete input:

```json
{
  "logo-search-input": ""
}
```

Grouped multi-select wrapper:

```json
{
  "ms-code-select-wrapper": "multi",
  "data-grouped-select": "with-category"
}
```

## Deliberately excluded

These live blocks stay unchanged while Elvin owns availability, booking, and paid-call work:

- the shared profile/session foundation;
- draft restore and incremental dropdown state;
- the final Build Profile submit writer, which includes availability and paid-call fields.
  The separate outcome observer does not change its request or payload;
- page validation and rate formatting that is coupled to those fields;
- Consult and Full Profile call/retainer visibility controllers.

This exclusion is a release boundary, not proof that the remaining inline code is acceptable
long term.

## Notes & gotchas

- **Load order is the contract.** Reordering or combining tags breaks the untouched blocks
  that still share globals with these controllers.
- **Do not re-embed the live-body originals** once a block's SHA-256 matches
  `live-body-provenance.json` and has been replaced.
- The [Videsigns multi-step failover](../utils/multi-step-failover.md) is the outage probe
  for the wizard engine, not a tenth Build Profile controller.
- Funnel routing after a finished profile is [Auth Route & Funnel
  Redirects](./auth-route-and-redirects.md), not this cluster.
- None of these replacement files carry an `@release` header. `submit-diagnostics.js`
  exposes `window.StartersBuildProfileSubmitDiagnostics`.
