---
title: "Account Settings"
description: "Logged-in account and billing scripts for plan dates and cancel-flow success state."
source: account-settings
---

Source: the GitHub repo [`the-starters/starters-webflow`](https://github.com/the-starters/starters-webflow), `account-settings/`

Browser scripts for the `/account-settings` page family — the logged-in member's own account and
billing surface: plan state, billing dates, and the pause and cancel flows.

Everything here reads the Memberstack member in the browser and renders into Designer-authored
elements through a custom attribute contract. **None of it holds a secret or performs a billing
mutation.** Pausing or cancelling a subscription needs the Stripe secret key, so it belongs
behind a Xano endpoint; these scripts only read and print, which is why they are safe to install
before that endpoint exists.

Like the [Utils](../utils/index.md), they live in the `starters-webflow` repo and load through
**jsDelivr CDN URLs** with `defer` — in Page Settings → Custom Code → Footer, **after** the
Memberstack script:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/account-settings/<file>.js"></script>
```

## One attribute prefix for this folder

Every script here speaks the `ms-form-*` dialect — `ms-form-pause-*` for the plan dates,
`ms-form-cancel-state-*` for the cancel success state. Match it if a third arrives: the repo rule
is to reuse the owning vocabulary rather than invent a parallel one, so the folder reads as one
dialect instead of two.

## What's in this group

- **[Plan Dates](./plan-dates.md)** (`plan-dates.js`): prints a member's plan and billing dates,
  formatted `Jan 10, 2000`, including the date a paused subscription actually resumes.
- **[Cancel State](./ms-form-cancel-state.md)** (`ms-form-cancel-state.js`): shows one success
  message out of several, picked by the reason button the member clicked, inside Webflow's single
  success div.

Both ship with a focused Node test suite in the repo (`*.test.js`, run with `node --test`) that
asserts, among other things, that the exported `release` matches the `@release` header comment.

`@latest` resolves to the newest git **tag**, not the newest commit, so a merge without a tag
keeps serving the previous release; see the repo README for the release flow.
