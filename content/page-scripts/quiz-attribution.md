---
title: "Signup Attribution"
description: "Sitewide UTM and Meta ad attribution capture, CompleteRegistration, and Memberstack field persistence."
source: v3/signup-attribution.js
---

Source: `v3/signup-attribution.js` (loaded via jsDelivr CDN) — **v1.59.135**

## What it is

The **sitewide UTM and Meta ad attribution capture**. It lives in `v3/` (not `quiz-main/`)
because a paid click can land on any page: this file loads site-wide and re-runs its capture
on every page load. A visitor who arrives on the blog and signs up three pages later still
carries their click through.

It does three things:

- **Capture.** Copies ad parameters off the URL into first-party cookies, and generates a stable
  `event_id` for event deduplication.
- **CompleteRegistration.** On an armed signup surface, fires the Meta Pixel conversion event
  when a logged-out visitor becomes a member.
- **Persistence.** Turns those cookies into Memberstack custom fields on every signup route
  **except** `/quiz`, which is written by [Quiz Results](./quiz-results.md) instead.

## File structure

```
v3/signup-attribution.js        (~1,000 lines — sitewide)
v3/signup-attribution.test.js   focused regressions + map drift guard
```

Load it **site-wide** with `defer` (Webflow site-wide custom code), not in a single page's
footer:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/signup-attribution.js"></script>
```

The Meta Pixel base snippet (pixel `775648331097942`) must already be in Webflow **site-head**
custom code. This file never installs the pixel; it only calls `fbq` when it is already a
function, so an uninstalled or ad-blocked pixel is a silent no-op.

A boot guard on `window.__startersAttributionBooted` makes a duplicate tag a no-op. Nothing in
the file may throw into the page, so every browser API it touches is wrapped.

## Cookie contract

All cookies are **first-party**, written with a **72 hour TTL** on `path=/`, and named exactly
like the value they carry:

| Cookie | Source | Notes |
| --- | --- | --- |
| `utm_source` | `?utm_source` | |
| `utm_campaign` | `?utm_campaign` | |
| `utm_adset` | `?utm_adset` | |
| `utm_content` | `?utm_content` | |
| `fbclid` | `?fbclid` | |
| `fbc` | Meta's own `_fbc` cookie | Copied only when ours is unset. |
| `fbp` | Meta's own `_fbp` cookie | Copied only when ours is unset. |
| `event_id` | Generated | `evt_<uuid>`, generated once and then reused. |

A URL parameter **only overwrites its cookie when the URL actually carries a value**, so the
freshest click wins and a plain internal navigation never clears an earlier one. The `_fbc` /
`_fbp` copy is re-checked on **every** page load, because the pixel writes those cookies itself
and can load after this script.

## Memberstack field map

Cookie name to custom field ID, underscores swapped for hyphens:

| Cookie | Memberstack field ID |
| --- | --- |
| `utm_source` | `utm-source` |
| `utm_campaign` | `utm-campaign` |
| `utm_adset` | `utm-adset` |
| `utm_content` | `utm-content` |
| `fbclid` | `fbclid` |
| `fbc` | `fbc` |
| `fbp` | `fbp` |
| `event_id` | `event-id` |

These eight field IDs are verified against the live Memberstack app config, so renaming one here
silently drops the value.

**The same map is duplicated in `quiz-results.js`**, which owns the write for the quiz funnel —
see [Quiz Results → Attribution persistence](./quiz-results.md#attribution-persistence). Keep the
two in step: a field ID present in only one of them is a value Memberstack silently drops on one
of the signup routes. A drift guard in `v3/signup-attribution.test.js` asserts both maps still
match.

## Signup surfaces (path map + form detection)

A page arms the signup watch when **either**:

1. Its normalized path is in the hand-audited `SIGNUP_PATH_POLICY` map, **or**
2. The DOM has at least one `form[data-ms-form="signup"]` and **no** `[data-ms-form="login"]`
   anywhere on the page.

The path map is checked first and its policy is used verbatim, so the two audited pages cannot
regress if their markup changes:

| Path | `directSave` | Who writes the fields |
| --- | --- | --- |
| `/quiz` | `false` | `quiz-results.js`, on the results page right after. |
| `/sign-up` | `true` | This script, before the `/brand-dashboard` redirect. |

Form detection covers every other signup surface — starting with the signup modal on
`/all-starters`. Detected pages use `directSave: true` (same as `/sign-up`). Detection counts
forms **present** in the DOM and does not test visibility, so a `<dialog>` that stays
`display:none` until opened still arms the watch.

**Login is a veto on the detection branch only.** A page with both signup and login markers is
not watched at all (a missed attribution is cheaper than stamping UTM values onto an existing
member). Pure login pages such as `/login` and `/starter-login` fall out the same way: no signup
form, no watch.

The scan runs once during init. Call `window.StartersAttribution.rearm()` after injecting a
signup form later — it pairs with `starters-ms-redirect.js`'s `apply()` on the same
`form[data-ms-form="signup"]`. `rearm()` is a no-op once the watch is already armed (a second
`onAuthChange` listener would double-fire `CompleteRegistration`).

## CompleteRegistration

On an armed signup surface the script records whether the visitor arrived logged out and fires
Meta's `CompleteRegistration` on the transition. The event carries the `event_id` cookie as its
**`eventID`**, so a server-side copy of the same registration deduplicates against it. It fires
for every signup, including one with no ad parameters at all.

Two guards keep it honest:

- **Unreadable starting state is not "logged out".** The starting member state is tri-state
  (`true` arrived logged out, `false` arrived logged in, `null` unreadable). The first definitive
  auth event only **arms** the watch; it does not fire.
- **Once per session.** A `sessionStorage` flag (`startersCompleteRegistrationFired`) covers the
  refresh double-fire — Memberstack replays the authenticated state on the next load, which
  without the flag would look like a second registration. The flag is **shared by every signup
  surface**, so one session yields one event.

## Field persistence (direct-save routes)

`/quiz` needs nothing here — `quiz-results.js` writes the attribution fields alongside the quiz
summary. Every other armed route (including `/sign-up` and form-detected surfaces) has no such
follow-up writer, so this script writes the fields itself — and it has to survive the form's own
redirect cutting the request off mid-flight. The order is deliberate:

1. Snapshot the non-empty field values into `sessionStorage.startersAttributionPendingFields`.
2. Set the `sessionStorage.startersAttributionPendingSave` marker.
3. Call `updateMember`.
4. Clear both **only once the write is confirmed**.

Steps 1 and 2 are synchronous and happen first, so the marker exists before the navigation can
kill anything. Every page load then checks that marker and re-attempts the write **from the
snapshot, not from live cookies**, which is what lets a save killed by the redirect complete on
the next page with the values the signup actually captured.

A marker found while Memberstack **positively reports the visitor logged out** is stale and gets
cleared without a write — with one exception: if a stale marker was already present at load and
this page's own signup re-raised it while the retry's member read was still in flight, the marker
survives, because clearing it would throw away a save that has only just started. An
**unreadable** member state is never treated as logged out; the marker survives for the next
load.

| Key | Storage | Purpose |
| --- | --- | --- |
| `startersAttributionPendingFields` | `sessionStorage` | Snapshot of the field values a direct-save write still owes. |
| `startersAttributionPendingSave` | `sessionStorage` | Marker that a write is owed; retried on every page load. |
| `startersCompleteRegistrationFired` | `sessionStorage` | Once-per-session fire flag, shared by every signup surface. |

## Debug

| Surface | Value |
| --- | --- |
| `window.StartersAttribution.getParams()` | Returns the current cookie values. |
| `window.StartersAttribution.rearm()` | Re-scans the DOM for signup forms; returns whether the watch is armed. |
| `window.StartersAttribution.release` | The file's release string, kept in sync with the header. |
| `window.__startersAttributionBooted` | Boot guard; a second tag returns early. |

Diagnostics are **staging-only** — `*.webflow.io`, `localhost`, `127.0.0.1`, and
`*.trycloudflare.com` — or forced on with `window.STARTERS_DEBUG === true`. Production stays
silent. The host suffix match is anchored on purpose, so a lookalike host such as
`notwebflow.io` does not read as staging.

Run the focused attribution regressions with:

```sh
node --test v3/signup-attribution.test.js quiz-attribution-persistence.test.js
```

## Notes & gotchas

- **It is sitewide, not quiz-only.** Loading it on `/quiz` alone defeats the point: the click
  that gets attributed is usually captured pages earlier.
- **Do not fold the path map into detection.** `/quiz` must keep `directSave: false` so it does
  not race `quiz-results.js`. Path policy is consulted before form detection on purpose.
- **Empty values are never written.** Only non-empty cookies become custom fields, so a later
  untagged visit cannot blank a value an earlier tagged visit captured.
- **Renaming a field ID here breaks one signup route silently.** Change it in `quiz-results.js`
  in the same commit, or the drift guard fails.
- The pixel is site-head Webflow custom code, not this file's job. If `CompleteRegistration`
  never fires, check that `fbq` exists before suspecting this script.
- A new signup surface needs **no Designer attribute work** beyond Memberstack's own
  `data-ms-form="signup"` — detection picks it up automatically. Call `rearm()` only if the form
  is injected after init.
