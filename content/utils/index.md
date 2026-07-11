---
title: "Intro"
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

- **[WF Validate](wf-validate.md)** (`wf-validate.js`): declarative, attribute-driven form
  validation over the native Constraint Validation API, with styled error slots instead of
  browser bubbles.
- **[Loader](loader.md)** (`loader.js`): `loadEnvScript()`, a tiny staging/live script-loader
  helper keyed off the `webflow.io` host.
- **[PostHog Identity](posthog-identity.md)** (`posthog-identity.js`): Memberstack → PostHog
  identity bridge (`identify` on login, `reset` on logout).
- **[PostHog Track](posthog-track.md)** (`posthog-track.js`): `StartersTrack.track()`, the
  shared funnel-event helper that stamps every event with a `platform` property and forwards
  uncaught errors to PostHog.

`@latest` resolves to the newest git **tag**, not the newest commit; see the repo README for
the release/tagging flow.
