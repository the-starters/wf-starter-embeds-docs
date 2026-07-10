---
title: "PostHog Track"
---

Source: `utils/posthog-track.js`

## What it is

The shared **funnel-event helper**. Loaded site-wide with `defer` after the PostHog head
snippet, it exposes `window.StartersTrack.track(name, props)` for page scripts to call instead
of `posthog.capture` directly, which buys two guarantees:

- every event carries a consistent **`platform` property** (`"v2"` or `"v3"`), and
- a missing or blocked PostHog can **never break page logic** — every call is wrapped so
  analytics failures are swallowed.

It also wires **frontend error tracking** once per page: uncaught `error` events and
`unhandledrejection`s are forwarded to `posthog.captureException` (tagged with the same
`platform`), complementing the server-side `bridge_error` event and linking into session
replay.

## File structure

```
utils/posthog-track.js
```

Plain IIFE. The global is created with `window.StartersTrack = window.StartersTrack || …` and
error listeners are guarded by `window.__startersErrorsWired`, so double-inclusion is safe.

## API

```js
StartersTrack.track("opportunity_apply_submitted", { opportunity_id: id });
```

| Member | Purpose |
| --- | --- |
| `StartersTrack.track(name, props?)` | Captures a PostHog event with `platform` merged into the props. No-op (never throws) when PostHog is absent. |
| `window.STARTERS_PLATFORM` | Optional override: when set, its value is used as the `platform` property verbatim, skipping host detection. |

Platform detection uses **exact host matching**: `thestarters.com` / `www.thestarters.com` and
hosts containing `the-starters-3-0` are `v3`; everything else (`hirethestarters.com`,
`the-starters.webflow.io`, …) is `v2`.

## Notes & gotchas

- The host check is deliberately **not** a substring match: v2 prod `hirethestarters.com`
  contains the substring `thestarters.com`, so an `.includes()` check would mislabel all v2
  prod traffic as v3. Keep that in mind before "simplifying" the condition.
- Event names and properties are defined in the funnel-events plan
  (`platform-ops/architecture/posthog-funnel-events-plan.md` in the workspace) — additions are
  fine, renames need a migration note there.
- `posthog.captureException` is stubbed by the head snippet, so errors thrown before
  `array.js` loads are queued, not lost.
- Events fired before [PostHog Identity](posthog-identity.md) resolves the member are captured
  under the anonymous id and stitched by PostHog after `identify` — normal PostHog behaviour,
  nothing to work around.
- Load this before any page script that calls `StartersTrack.track` — or have callers use
  optional chaining (`window.StartersTrack?.track(…)`) to stay order-independent.
