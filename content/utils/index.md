---
title: "Utils"
description: "Cross-page utility scripts loaded from the starters-webflow repo via jsDelivr."
source: utils
---

Source: the GitHub repo [`the-starters/starters-webflow`](https://github.com/the-starters/starters-webflow), `utils/`

Cross-page utility scripts. Unlike the Global Embeds, these do not live inside Webflow embed
components; they are hosted in the `starters-webflow` GitHub repo and loaded through
**jsDelivr CDN URLs** with `defer`, so tagged releases go live without editing any Webflow
custom code:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/utils/<file>.js"></script>
```

## What's in this group

- **[WF Validate](./wf-validate.md)** (`wf-validate.js`): declarative, attribute-driven form
  validation over the native Constraint Validation API, with styled error slots instead of
  browser bubbles.
- **[Loader](./loader.md)** (`loader.js`): `loadEnvScript()`, a tiny staging/live script-loader
  helper keyed off the `webflow.io` host.
- **[Multi-Step Failover](./multi-step-failover.md)** (`multi-step-failover.js`): probes the
  agency-hosted multi-step form engine on the build-profile wizards and injects our mirrored
  copy (`vendor/videsigns-multi-step.js`) if it's gone.
- **[Workflow Diagnostics](./workflow-diagnostics.md)** (`workflow-diagnostics.js`,
  `v3/native-form-diagnostics.js`): the shared allowlisted receipt helper, plus the
  sitewide observer for Memberstack-native login/signup/password and Account Profile
  forms and pause/cancel requests.
- **[Section Custom TOC](./section-custom-toc/index.md)** (`section-custom-toc/`): an
  attribute-driven section nav bar that tracks which section is in view, plus the
  [Hide Empty Sections](./section-custom-toc/hide-empty-sections.md) companion that hides a
  section and its nav links when it has no content.
- **[PostHog Identity](./posthog-identity.md)** (`posthog-identity.js`): Memberstack → PostHog
  identity bridge (`identify` on login, `reset` on logout).
- **[PostHog Track](./posthog-track.md)** (`posthog-track.js`): `StartersTrack.track()`, the
  shared funnel-event helper that stamps every event with a `platform` property and forwards
  uncaught errors to PostHog.

`@latest` resolves to the newest git **tag**, not the newest commit; see the repo README for
the release/tagging flow.
