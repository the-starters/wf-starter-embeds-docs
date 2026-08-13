---
title: "Starter Edit Profile"
source: starter-edit-profile.js
sources:
  - v3/starter-edit-profile/portfolio-crud.js
  - v3/starter-edit-profile/portfolio-list.js
  - v3/starter-edit-profile/company-autocomplete.js
  - v3/starter-edit-profile/company-experience-crud.js
---

Source: `starter-edit-profile.js`, `v3/starter-edit-profile/portfolio-crud.js`,
`v3/starter-edit-profile/portfolio-list.js`,
`v3/starter-edit-profile/company-autocomplete.js`,
`v3/starter-edit-profile/company-experience-crud.js`

## What it is

The **logged-in Talent profile editor** on `/starter-edit-profile`. The native form, fields,
and success/error elements stay authored in Webflow.

Two layers load on that page:

1. **Folder controllers** in `v3/starter-edit-profile/` — provenance-locked replacements for
   the page-specific portfolio and company inline blocks.
2. **Root `starter-edit-profile.js`** — page-specific form behavior migrated from the legacy
   Webflow footer: validation, the Xano profile PATCH, Lumos success/error modals, rate
   inputs, and loader fallbacks.

Photo upload and work dates are **not** copied here. This page reuses
[`v3/build-profile/profile-photo.js` and `v3/build-profile/work-dates.js`](./build-profile.md).
Do not duplicate those walkthroughs; install those two assets from the Build Profile paths.

## File structure

```
starter-edit-profile.js                         page footer: form save + modals
v3/starter-edit-profile/
├── portfolio-crud.js                           portfolio create, edit, delete, media, previews
├── portfolio-list.js                           portfolio list read and render
├── company-autocomplete.js                     company and logo autocomplete
└── company-experience-crud.js                  company-experience CRUD

(reused, documented on Build Profile)
v3/build-profile/profile-photo.js
v3/build-profile/work-dates.js
```

## Loader order

Replace only an exact live inline body whose index and SHA-256 match
`live-body-provenance.json`. Keep each replacement in its existing Code Embed position. Do
**not** combine or reorder the loaders.

Install `v3/native-form-diagnostics.js` **sitewide with `defer`, before any deferred mutation
asset** on this page (photo, portfolio, company-experience), so those requests can emit
receipts:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/native-form-diagnostics.js"></script>
```

Then the six in-place replacements, in live-index order:

| Live index | GitHub asset | Responsibility |
| --- | --- | --- |
| 84 | `v3/build-profile/profile-photo.js` | Authenticated profile-photo upload |
| 87 | `v3/starter-edit-profile/portfolio-crud.js` | Edit-profile portfolio create, edit, delete, media, and previews |
| 88 | `v3/starter-edit-profile/portfolio-list.js` | Edit-profile portfolio list read and render |
| 89 | `v3/starter-edit-profile/company-autocomplete.js` | Edit-profile company and logo autocomplete |
| 90 | `v3/starter-edit-profile/company-experience-crud.js` | Edit-profile company-experience CRUD |
| 91 | `v3/build-profile/work-dates.js` | Work-date validation and current-role state |

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/build-profile/profile-photo.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/starter-edit-profile/portfolio-crud.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/starter-edit-profile/portfolio-list.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/starter-edit-profile/company-autocomplete.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/starter-edit-profile/company-experience-crud.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/build-profile/work-dates.js"></script>
```

Use the matching asset path for each replacement. `@latest` moves with the newest git tag.
Production may pin `@vX.Y.Z`.

### Root page script

Load `intl-tel-input`, Quill, then this deferred asset. Site-wide Head Code still
initializes `MEMBER`, `memberReady`, and the matching helper aliases before deferred page
scripts.

[`v3/brand-account-controller.js`](./accounts-and-forms.md) must load **first** with
`guardSecurityForm: 'identity'`. It alone writes a changed Memberstack login email, then
replays this controller's Xano profile save.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/starter-edit-profile.js"></script>
```

## `starter-edit-profile.js` — page-specific form behavior

Keeps the existing Designer form and modal markup. It:

- opens the existing success or error modal through the **Lumos** API
  (`window.lumos.modal.open('edit-form-success'|'edit-form-error')`), and uses the hidden
  modal triggers `[data-modal-trigger='edit-form-success']` /
  `[data-modal-trigger='edit-form-error']` only when that API is unavailable;
- shows success only after a confirmed **2xx** Xano response, and the error state for
  rejected or failed profile updates;
- captures the current Memberstack member on each submit, revalidates that same identity
  before the Xano `PATCH`, and binds the request URL to the captured member ID
  (`/api:KZf7nFnk/edit_profile/update/<memberId>`);
- revalidates again before its Memberstack custom-field projection, so an account change
  stops the workflow instead of writing into the new session, and records a safe
  auth-failure receipt when diagnostics are available;
- owns its DOM, readiness, validation, rate-input, and loader fallbacks.

It binds `[build-profile-form]` (the same form hook as the wizard pages) and
`[data-edit-submit]` on the active step. Diagnostics use workflow `starter_profile_edit`
and `controller_version` `starter-edit-profile-v1`, loading
`utils/workflow-diagnostics.js` from the same CDN root when needed. Diagnostic IDs stay in
the console; the authored modal owns its message.

### Approved hosts

This file does **not** gate writes on hostname. There is no `thestarters.com` /
`webflow.io` allowlist in `starter-edit-profile.js` — only a jsDelivr CDN-root match used
to load the diagnostics helper.

## Folder controllers

Same responsibilities as the Build Profile siblings, captured from `/starter-edit-profile`
(different live-body hashes). They wait on `waitForMember` and exit when `MEMBER.id` is
missing.

| File | Responsibility |
| --- | --- |
| `portfolio-crud.js` | Edit-profile portfolio create, edit, delete, media, and previews |
| `portfolio-list.js` | Edit-profile portfolio list read and render |
| `company-autocomplete.js` | Edit-profile company and logo autocomplete |
| `company-experience-crud.js` | Edit-profile company-experience CRUD |

## Markup contract

| Hook | On | Used by |
| --- | --- | --- |
| `[build-profile-form]` | the native form | `starter-edit-profile.js` |
| `[data-edit-submit]` | step submit | `starter-edit-profile.js` |
| `[data-modal-trigger='edit-form-success']` | hidden success trigger | `starter-edit-profile.js` |
| `[data-modal-trigger='edit-form-error']` | hidden error trigger | `starter-edit-profile.js` |
| `[data-highlights]`, `.portfolio_card` | portfolio grid | `portfolio-crud.js` |
| `#portfolio-block`, `.case-studies-wrapper` | portfolio list | `portfolio-list.js` |
| `[logo-search-input]` | company search inputs | `company-autocomplete.js` |
| `.company-list`, `.company-card` | experience list | `company-experience-crud.js` |

Photo and work-date markup is the same as on [Build Profile](./build-profile.md).

## xAttribute JSON

```json
{
  "build-profile-form": ""
}
```

```json
{
  "data-edit-submit": ""
}
```

```json
{
  "data-modal-trigger": "edit-form-success"
}
```

```json
{
  "data-modal-trigger": "edit-form-error"
}
```

```json
{
  "logo-search-input": ""
}
```

## Deliberately excluded

The following live blocks remain unchanged because they own or are coupled to Elvin's
availability, booking, and paid/free-call work:

- the shared profile/session foundation;
- incremental form state and validation that reads availability;
- country/state/city state tied to the shared profile object;
- the final 17.8 KB submit controller, including availability and paid/free-call fields;
- rate and call visibility behavior.

Account-settings tabs, membership panels, and pause/cancel UI are separate shared-component
work and are not part of this extraction.

## Notes & gotchas

- **Do not combine or reorder** the six replacement loaders. Untouched embeds between them
  still share page state.
- Login-email writes belong to [`brand-account-controller.js`](./accounts-and-forms.md) in
  `'identity'` mode, not to `starter-edit-profile.js`.
- `/starter-edit-profile` is Talent-only in the [route guard](./route-guard.md).
- The folder replacements do not carry `@release` headers. The root script's
  `PROFILE_CONTROLLER_VERSION` is `starter-edit-profile-v1`.
