---
title: "Multi-Step Failover"
source: utils/multi-step-failover.js
---

Source: `utils/multi-step-failover.js` (mirror: `vendor/videsigns-multi-step.js`)

## What it is

A safety net that keeps the build-profile wizards alive if the third-party multi-step form
engine disappears. The wizard pages (`/build-profile/full-profile`, `/build-profile/consult`)
load their engine from Videsigns' own public repo:

```
https://cdn.jsdelivr.net/gh/videsigns/webflow-tools@latest/multi-step.js
```

That tag lives inside an agency code embed (not API-editable) and is served at `@latest` from
a repo we don't control, so it can 404 or change at any time. After page load, this script
probes that URL; if the tag is missing from the page or the probe fails, it injects our
mirrored copy (`vendor/videsigns-multi-step.js`, a byte-for-byte snapshot added in
**v1.26.0**) and warns loudly in the console.

## File structure

```
utils/multi-step-failover.js       (the probe + injector, ~57 lines)
vendor/videsigns-multi-step.js     (mirrored engine, ~3,600 lines, obfuscated upstream build)
```

Load the failover with `defer` on the wizard pages. Run-once guard:
`window.__tsMultiStepFailover`.

## How it decides

1. No `form[data-form="multistep"]` on the page: not a wizard page, do nothing.
2. The page already loads the mirror directly (a script tag matching
   `vendor/videsigns-multi-step`): log and skip the probe; there is nothing to fail over to.
   This check landed in **v1.26.1**, so repointed pages don't double-load the engine.
3. The upstream tag is missing entirely: inject the mirror.
4. Otherwise fetch the upstream URL (`cache: 'force-cache'`); a non-OK status or network
   error injects the mirror, a 200 just logs that upstream is healthy.

## Notes & gotchas

- **This is the outage fallback, not the endgame.** Late injection happens after
  `DOMContentLoaded`, and whether the obfuscated engine self-initializes at that point is
  unverified. The clean fix is to repoint the script tag inside the agency embed to the
  mirror and delete this file; the failover exists so an upstream outage doesn't take the
  wizards down in the meantime.
- Console messages are prefixed `[ms-failover]`; the injection path uses `console.warn` on
  purpose so it shows up in default log levels.
- Keep the mirror in sync deliberately: it's a pinned snapshot, so an upstream update doesn't
  change our copy until someone re-mirrors it.
