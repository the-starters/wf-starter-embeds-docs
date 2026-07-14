---
title: "PostHog Identity"
source: utils/posthog-identity.js
---

Source: `utils/posthog-identity.js`

## What it is

The Memberstack → PostHog **identity bridge**. Loaded site-wide with `defer` on any page whose
`<head>` carries the PostHog snippet, it links analytics events to member accounts:

- **Logged in.** Calls `posthog.identify(<memberstack id>)` with persona labels derived from
  the same Memberstack custom fields the opportunities logic gates on
  (`brands-dashboard-url` / `freelancer-dashboard-url`; a member can be both). **No email or
  name is sent**, only account ids and capability labels.
- **Logged out.** Calls `posthog.reset()` *only if* the previous distinct id was a member id
  (`mem_…`), so a shared browser doesn't chain new anonymous events to the old member.
  Anonymous visitors are otherwise untouched.

The identify payload carries `persona` (`"brand"`, `"freelancer"`, `"both"`, or `"none"`) plus
the booleans `persona_brand` and `persona_freelancer`.

## File structure

```
utils/posthog-identity.js
```

Plain IIFE, no dependencies of its own. Requires the PostHog snippet in the `<head>` and
Memberstack on the page; both are detected, never assumed.

## Notes & gotchas

- **Load order is forgiving**: the PostHog head snippet stubs the API and queues calls until
  `array.js` arrives, so this script can run before PostHog finishes loading.
- Memberstack is awaited by polling for `window.$memberstackDom` every 100ms, **up to 10
  seconds**; a page without Memberstack simply leaves the visitor anonymous.
- If PostHog is missing or blocked (ad-blockers), the script exits without side effects; a
  Memberstack error likewise does nothing rather than mis-identify.
- The logout `reset()` needs `posthog.get_distinct_id()` to be readable; if the stub isn't
  ready for reads yet, the reset happens on the next page load instead.
- Persona detection must stay in sync with the custom fields the opportunities scripts use.
  If those fields are renamed in Memberstack, update both places.
- Pair with [PostHog Track](./posthog-track.md) for event capture; this script only manages who
  the events belong to.
