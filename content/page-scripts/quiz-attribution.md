---
title: "Signup Attribution"
description: "Sitewide UTM and Meta ad attribution capture, CompleteRegistration, and Memberstack field persistence."
source: v3/signup-attribution.js
---

Source: `v3/signup-attribution.js` (loaded via jsDelivr CDN) — **v1.59.210**

## What it is

The **sitewide UTM and Meta ad attribution capture**. It lives in `v3/` (not `quiz-main/`)
because a paid click can land on any page: this file loads site-wide and re-runs its capture
on every page load. A visitor who arrives on the blog and signs up three pages later still
carries their click through.

It does four things:

- **Capture.** Copies ad parameters off the URL into first-party cookies, and generates a stable
  `event_id` for event deduplication. At the Memberstack auth transition it also records
  `signup_source` and `signup_referrer`. A tagged hire-page CTA can stamp `signup_trigger`.
- **CompleteRegistration.** On an armed signup surface, fires the Meta Pixel conversion event
  when a logged-out visitor becomes a member.
- **Persistence.** Turns those cookies into Memberstack custom fields on every signup route
  **except** `/quiz`, which is written by [Quiz Results](./quiz-results.md) instead.
- **Lead-entry.** On an exact production Collection or Learn CMS item route, snapshots a
  pending V3 lead-entry event so Xano `lead_email/register/v3` can register the signup.

## File structure

```
v3/signup-attribution.js        (~2,200 lines — sitewide)
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
| `signup_source` | Auth transition (`location.pathname`) | Normalized path of the page the signup happened on. Not a URL parameter. |
| `signup_referrer` | Auth transition (`document.referrer`) | Same-origin path of the page they came **from**. Not a URL parameter. |
| `signup_trigger` | Tagged CTA click that opens signup | `hire`, `message`, `book-call`, or `service:<detail>`. Not a URL parameter. |

A URL parameter **only overwrites its cookie when the URL actually carries a value**, so the
freshest click wins and a plain internal navigation never clears an earlier one. The `_fbc` /
`_fbp` copy is re-checked on **every** page load, because the pixel writes those cookies itself
and can load after this script.

`signup_source`, `signup_referrer`, and `signup_trigger` are the three cookies no URL can
supply. They are absent from `URL_PARAMS` so `?signup_source=`, `?signup_referrer=`, or
`?signup_trigger=` cannot dictate a field whose job is to report what really happened.

Source and referrer are derived **at the Memberstack auth transition**, not during the sitewide
capture that runs on every page load. Capturing on load would make each mean "last page loaded",
and each armed page would be clobbered by its own redirect (`/sign-up` reporting
`/brand-dashboard`; `/quiz` reporting `/quiz-results`). `quiz-results.js` reads these cookies a
page later, so a load-time capture would replace the real referrer with `/quiz`.

### Cookie overwrite vs member write-once

The cookies overwrite freely. Three **fields** do not.

- **`signup_source` cookie always overwrites.** Reaching the transition on an armed page *is* a
  signup, so it always carries a real path. Nothing earlier is worth keeping.
- **`signup_referrer` cookie writes nothing** in three honest-silence cases: no referrer (direct
  navigation, typed URL, stripped referrer policy), a cross-origin referrer, or an empty path.
- **`signup_trigger` cookie:** last tagged click wins until signup (72h TTL). The cookie is
  written only when that click actually opens signup.

On the **member**, `signup-source`, `signup-referrer`, and `signup-trigger` are write-once: once
any of them holds a non-empty value, no write from this script or from
[Quiz Results](./quiz-results.md) may replace that field. They are facts about one signup that
never change afterwards, so they are guarded together. Each is still judged on its own, so a
member who has a source but no referrer keeps the source and gets the referrer filled in. The
other eight fields stay last-touch.

When the member's existing values cannot be read at all, the write goes ahead (doubt resolves
the other way here than it does for CompleteRegistration). Empty, whitespace-only, and absent
existing values all count as unfilled.

### Homepage path stored as `/home`

The live homepage route stays `/`. Attribution stores `/home` so every persisted value is
path-shaped with a leading slash. A visitor who clicks Get started on `/` and signs up on
`/quiz` therefore gets `signup_source=/quiz` and `signup_referrer=/home`. `/` carries no signup
form at all, so source alone can never name the homepage.

## Memberstack field map

Cookie name to custom field ID, underscores swapped for hyphens. **Create these custom fields
in the Memberstack app** (including `signup-source`, `signup-referrer`, and `signup-trigger`)
before shipping a write — Memberstack silently drops a value for a field ID it does not know:

| Cookie | Memberstack field ID | On the member |
| --- | --- | --- |
| `utm_source` | `utm-source` | Last-touch |
| `utm_campaign` | `utm-campaign` | Last-touch |
| `utm_adset` | `utm-adset` | Last-touch |
| `utm_content` | `utm-content` | Last-touch |
| `fbclid` | `fbclid` | Last-touch |
| `fbc` | `fbc` | Last-touch |
| `fbp` | `fbp` | Last-touch |
| `event_id` | `event-id` | Last-touch |
| `signup_source` | `signup-source` | Write-once |
| `signup_referrer` | `signup-referrer` | Write-once |
| `signup_trigger` | `signup-trigger` | Write-once |

These eleven field IDs are verified against the live Memberstack app config, so renaming one
here silently drops the value.

**The same map is duplicated in `quiz-results.js`**, which owns the write for the quiz funnel —
see [Quiz Results → Attribution persistence](./quiz-results.md#attribution-persistence). Keep the
two in step: a field ID present in only one of them is a value Memberstack silently drops on one
of the signup routes. A drift guard in `v3/signup-attribution.test.js` asserts both maps still
match.

## Signup Trigger

On `/hire/<slug>`, tag the logged-out Hire, Message, Book Call, and service controls so a click
stamps `signup_trigger` and opens the hire-page signup modal
(`data-modal-target="signup-modal"`). Logged-in clicks are ignored so Hire / Message / Book keep
their member flows. Unknown elements and incomplete service tags write nothing (staging warning).

### Markup contract

```html
<button data-signup-trigger-element="hire">Hire</button>
<button data-signup-trigger-element="message">Message</button>
<button data-signup-trigger-element="book-call">Book Call</button>
<button
  data-signup-trigger-element="service"
  data-signup-trigger-value="brand-strategy">
  Brand strategy
</button>
```

Allowed `data-signup-trigger-element` values: `hire` | `message` | `book-call` | `service`.
Optional `data-signup-trigger-value` overrides the stored string for the three named CTAs; for
`service` it is **required** and stores `service:<detail>`.

The hire template also needs `form[data-ms-form="signup"]` inside that signup dialog — the same
contract as `/all-starters` — so the Lumos modal can open and form detection can arm the page.

### xAttribute JSON

Named CTA (value is one of `hire`, `message`, `book-call`):

```json
{ "data-signup-trigger-element": "hire" }
```

Service CTA (`data-signup-trigger-value` is required):

```json
{
  "data-signup-trigger-element": "service",
  "data-signup-trigger-value": "brand-strategy"
}
```

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
`/all-starters` and the hire-page signup modal on `/hire/<slug>`. Detected pages use
`directSave: true` (same as `/sign-up`). Detection counts forms **present** in the DOM and does
not test visibility, so a `<dialog>` that stays `display:none` until opened still arms the
watch.

**Login is a veto on the detection branch only.** A page with both signup and login markers is
not watched at all (a missed attribution is cheaper than stamping UTM values onto an existing
member). Pure login pages such as `/login` and `/starter-login` fall out the same way: no signup
form, no watch.

The scan runs once during init. Call `window.StartersAttribution.rearm()` after injecting a
signup form later — it pairs with `starters-ms-redirect.js`'s `apply()` on the same
`form[data-ms-form="signup"]`. `rearm()` is a no-op once the watch is already armed (a second
`onAuthChange` listener would double-fire `CompleteRegistration`).

The script also binds a capture-phase `click` listener for Signup Trigger
(`data-signup-trigger-element`) and a delegated capture-phase `submit` listener for the V3
lead-entry gate.

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

The write-once guard sits on this single write path (direct save and retry alike). It strips at
most the three write-once keys from the outgoing payload and leaves the eight last-touch fields
alone.

| Key | Storage | Purpose |
| --- | --- | --- |
| `startersAttributionPendingFields` | `sessionStorage` | Snapshot of the field values a direct-save write still owes. |
| `startersAttributionPendingSave` | `sessionStorage` | Marker that a write is owed; retried on every page load. |
| `startersCompleteRegistrationFired` | `sessionStorage` | Once-per-session fire flag, shared by every signup surface. |

## V3 Collection and Learn lead-entry

On an exact production Collection or Learn CMS item route, the same unambiguous logged-out to
logged-in transition also snapshots one pending lead-entry event before Memberstack redirects.
The next page retries the authenticated Xano registration if navigation cut the first request
off. The browser never calls Mailchimp. Xano endpoint `lead_email/register/v3` owns identity,
Brand Free eligibility, route and CMS collection allowlists, suppression, and idempotency.
Unsupported routes and non-production hosts **fail closed**.

All three conditions are required:

1. The host is exactly `thestarters.com` or `www.thestarters.com`.
2. The current path is one CMS item route in the allowlist below, and the rendered
   `data-wf-page` matches that collection's published Webflow template. A 404 with a
   valid-looking URL fails closed. List pages, nested paths, and malformed slugs return null.
3. The browser observed `submit` on `form[data-ms-form="signup"]` before the logged-out to
   logged-in Memberstack transition.

The submit requirement is separate from the broader attribution watch. A CMS modal can later
swap to an "already have an account" login; that login can still look like an auth transition,
but it did not submit the signup form, so it cannot create a lead-entry event.

| Track | Exact route prefix | Intent subtype |
| --- | --- | --- |
| Collection | `/skills/` | `collection_signup` |
| Collection | `/tools/` | `collection_signup` |
| Collection | `/industries/` | `collection_signup` |
| Collection | `/companies/` | `collection_signup` |
| Collection | `/categories/` | `collection_signup` |
| Collection | `/subcategories/` | `collection_signup` |
| Learn gated | `/learn/playbooks-frameworks/` | `learn_unlock` |
| Learn ungated | `/learn/interviews-analyses/` | `learn_signup` |
| Learn session | `/learn/sessions/` | `session_signup` |

The pending snapshot lives in `sessionStorage.startersLeadEntryPendingV1`, expires after 24
hours, and cannot move to another Memberstack member. After Xano accepts the row, the script
reports `v3_lead_entry_registered` to PostHog at most once per event and CMS resource in the
browser session, without member IDs or email addresses.

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
- **Cookies overwrite; `signup-source`, `signup-referrer`, and `signup-trigger` do not.** A
  returning member who only logs in on a page with a signup form keeps the first-touch source,
  referrer, and trigger. The eight UTM/Meta fields stay last-touch.
- **Create the Memberstack custom fields first**, including `signup-trigger`. An unknown field
  ID is silently dropped.
- **Renaming a field ID here breaks one signup route silently.** Change it in `quiz-results.js`
  in the same commit, or the drift guard fails.
- The pixel is site-head Webflow custom code, not this file's job. If `CompleteRegistration`
  never fires, check that `fbq` exists before suspecting this script.
- A new signup surface needs **no Designer attribute work** beyond Memberstack's own
  `data-ms-form="signup"` for the watch to arm — detection picks it up automatically. Call
  `rearm()` only if the form is injected after init. Hire-page CTAs that should stamp Signup
  Trigger still need `data-signup-trigger-element` (and `data-signup-trigger-value` on
  `service`).
