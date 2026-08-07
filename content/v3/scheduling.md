---
title: "Scheduling"
source: v3/scheduling-auth.js
sources:
  - v3/scheduling-auth.js
  - v3/scheduling-v3-stage.js
  - v3/scheduling-availability-init.js
  - v3/scheduling-availability-writer.js
---

Source: `v3/scheduling-auth.js`, `v3/scheduling-v3-stage.js`,
`v3/scheduling-availability-init.js`, `v3/scheduling-availability-writer.js`

## What it is

Four modules that migrate the **legacy V2 call-scheduling component** onto authenticated V3
Xano routes without rewriting the Webflow component itself. Two run synchronously and own
the network layer; two are deferred UI modules for the Starter's availability settings.

| File | Owns | Loads |
| --- | --- | --- |
| `scheduling-auth.js` | Bearer tokens for reviewed `/v3` scheduling routes | synchronously |
| `scheduling-v3-stage.js` | The legacy → `/v3` route map, and the fail-closed boundary | synchronously |
| `scheduling-availability-init.js` | Which Calendar Settings control is visible | deferred |
| `scheduling-availability-writer.js` | The availability form submit and OAuth grant flow | deferred |

## Install

`scheduling-v3-stage-component.html` in the repo is the **authoritative loader** and script
order. Keep it as the first Code Embed in the cloned Webflow scheduling component, before
the cloned scheduling logic embeds, and keep the cloned UI and logic embeds intact.

```html
<script src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/scheduling-auth.js"></script>
<script src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/scheduling-v3-stage.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/dashboard-calls.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/scheduling-availability-init.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/scheduling-availability-writer.js"></script>
```

Auth and routing load **synchronously** on purpose: immediately-executed cloned code must
not be able to issue a legacy request before the adapter owns `window.fetch`. The dashboard
and availability UI modules can stay deferred.

Do **not** replace the shared `Call Scheduling - Global Code` component while the live
`detail_hire` template still consumes it. The isolated clone is what carries these files.

## Where it installs

| Host | Paths |
| --- | --- |
| `the-starters-3-0.webflow.io` | The seven staging paths: `/starter-dashboard---availability-stage`, `/brand-dashboard---availability-stage`, `/starter-dashboard`, `/brand-dashboard`, `/messages-stage`, `/hire-stage`, `/hire/jp-dionisio` |
| `thestarters.com`, `www.thestarters.com` | Three exact paths only: `/hire/jp-test`, `/starter-dashboard`, `/brand-dashboard` |

Every other path is inert. Production `/hire/jp-dionisio` is explicitly **blocked** by both
synchronous scripts: scheduling-group requests return HTTP `410` without installing
authentication, discovery overrides, or booking identity, and the stage adapter reports
`disabled`. The adapter does not install on any other `/hire/*` item or on `detail_hire`.

## `scheduling-auth.js` — the Bearer adapter

It authenticates **only an explicit list of reviewed exact `/v3` paths** on the configured
Xano origin (`api:tCpV3oqd`) — no group-wide prefix allowlist. It caches the Xano token,
retries once after a `401` (a failed refresh returns the original `401`), and invalidates
cached and in-flight authentication when the Memberstack session changes.

Public helpers:

| Global | Behaviour |
| --- | --- |
| `window.xanoAuthFetch(input, init)` | Same inputs as `fetch`. Adds Bearer auth for scoped V3 scheduling paths and **rejects** if initial token acquisition fails. Calls outside that scope, and calls that already carry an `Authorization` header, pass through unchanged. |
| `window.getXanoAuthToken({ forceRefresh })` | Returns the cached member-scoped token, or explicitly replaces it. The options argument is optional. |

Both reject with code `MEMBER_SCOPE_CHANGED` if the Memberstack session changes while
authentication or a scheduling request is in flight.

There is also a transparent `window.fetch` wrapper, and it exists **only for legacy inline
callers**: if initial token acquisition fails it logs a warning and makes one
unauthenticated request, whereas direct `xanoAuthFetch` callers receive the error. It
installs synchronously and takes ownership from the legacy bridge in
`opportunities-3.0.js` regardless of script order.

**Maintenance rule:** new `api:tCpV3oqd` calls should use `window.xanoAuthFetch`, and every
route the stage adapter or availability modules use must be listed as an exact `/v3` path.
Do not turn this into a blanket credential injector.

## `scheduling-v3-stage.js` — the compatibility layer

It maps the reviewed legacy scheduling paths to their exact `/v3` routes — preserving
method, body, headers, and query parameters — and sends the rewritten request through
`window.xanoAuthFetch`. The map covers roughly 30 routes across `booking/*`,
`booking_record/*`, `brands/*`, `grants/*`, `nylas_configurations/*`, `scheduler/*`,
`starter/*`, and `notetaker/*`.

The boundary is **fail-closed**:

- `booking_record/get_with_filters` and its held `/v3` draft are blocked.
- `notetaker/get_transcription` is blocked — it is an arbitrary-URL authenticated-header
  proxy.
- `calendars/get_availabilities` is deliberately unmapped and therefore blocked everywhere,
  because its payload has not been proven compatible with `scheduler/get_availability/v3`.
- Any other unclassified `api:tCpV3oqd` route is blocked with HTTP `410` **before** a
  network request is made.
- Only the approved legacy Stripe customer, intent, setup-intent, and payment-method
  provider routes pass through temporarily.

On the two approved Hire booking canaries the public discovery reads use **Brand-safe**
contracts instead of Talent-owner ones: `starter/get_booking_profile/v3` returns only the
Starter row ID and calendar grant, and `nylas_configurations/get_bookable/v3` returns the
bookable configuration metadata. Every other installed surface uses the self-only
`starter/get_by_memberstack/v3` and grant-owner-only `nylas_configurations/get_all/v3`.

Those two surfaces also contain the **post-booking Nylas DOM race**: after a successful
`bookedEventInfo` event that includes a `booking_id`, the adapter waits for the authored
`[schedule-step="success"]` inside the same `[popup-booking]` to be visible, then detaches
only that popup's `nylas-scheduling` element. Failed or incomplete events, and a hidden or
missing success step, leave the scheduler mounted.

| Runtime hook | Values |
| --- | --- |
| `data-scheduling-v3-stage` on `<html>` | `ready` once the adapter owns `window.fetch`; `auth-unavailable` when a mapped route is reached before `window.xanoAuthFetch` exists (the request is then blocked); `disabled` on the protected production `/hire/jp-dionisio`. Unset where the adapter does not install. |
| `data-scheduling-booked-success` on `<html>` | `ready` after a completed post-booking handoff |

`window.StarterSchedulingV3Stage` is a frozen object exposing `paths`, `productionPaths`,
and `routeMap`. `window.__tsSchedulingV3StageOriginalFetch` retains the pre-adapter
`window.fetch` for provider and non-scheduling passthrough.

## `scheduling-availability-init.js` — visibility

Published CSS hides both Calendar Settings controls; this module resolves the member's saved
scheduling availability and reveals exactly one.

| Hook | Purpose |
| --- | --- |
| `[init-availability]` | First-time setup control |
| `[update-availability]` | Existing saved schedule control |
| `availability-step="setup-form"` | First-time modal panel |
| `availability-step="default"` | Existing-schedule modal panel |

It reads `starter/get_by_memberstack/v3` through `window.xanoAuthFetch`, treating a JSON
`null` as a first-time V3 Starter rather than leaving both controls hidden, and falls back
to the page-provided `window.getStarterByMemberId(memberId)` only when the auth helper is
unavailable. The canonical profile reader is deliberately **not** used, because its
`Availability` field is the workload range, not the legacy scheduling object.

Saved availability is cached for five minutes, **member-scoped** under
`starter-scheduling-availability:<memberId>`.

| Runtime hook | Values |
| --- | --- |
| `data-scheduling-availability-init` on `<html>` | `loading`, `init`, `update`, `error`, `not-applicable`, `missing-controls` |
| `window.STARTER_AVAILABILITY` | The normalized availability after a successful read; `null` after an error |
| `starterSchedulingAvailabilityReady` event | `{ memberId, source, state }` — `source` is `cache`, `starter`, `default`, or `query-test` |
| `starterSchedulingAvailabilityError` event | `{ message }` |

`window.StarterSchedulingAvailability` exposes `initialize()` for retries,
`normalizeAvailability(value)`, and `renderState(availability)`.

### The staging QA override

On `the-starters-3-0.webflow.io` **only**, an allowlisted Memberstack Test-Data sandbox
member ID can be supplied as `?test_member_id=…`. It is **read/UI-state only**: it changes
which member's availability is read and which control renders, and never bypasses Bearer
authentication or server ownership checks. Malformed or non-allowlisted values are ignored
with a concise console warning that does not echo the supplied value. An accepted override
stamps `data-scheduling-test-member="true"` on `<html>`, reports `source: "query-test"`, and
gets its own five-minute cache entry. On both production domains the parameter is inert.

## `scheduling-availability-writer.js` — the write path

The versioned port of the legacy V2 writer: availability form submit, manager selection
(platform-managed virtual calendar vs the member's own), Nylas scheduler configuration
create/update, timezone set, and the calendar OAuth grant redirect — with the
`[data-custom-loader]` loader and the success/error modal steps restored.

Safety boundary:

- Installs on the staging host and only the exact `/starter-dashboard` path in production.
  It stays inert on the production `/brand-dashboard` and all production Hire profiles.
- **Hard-requires** `window.xanoAuthFetch`. Without it the writer disables itself
  (`data-scheduling-availability-writer="missing-auth"`) rather than falling back to
  unauthenticated writes.
- Write payload `member_id` always comes from the live authenticated Memberstack session,
  re-verified per write; a member change after bootstrap aborts the write.
- The `?test_member_id` read override **disables the writer entirely**
  (`blocked-test-member`), so a QA view can never submit another member's schedule.
- It consumes the state the init module seeded and refreshes that member-scoped cache after
  a successful write. The timezone cache is member-scoped as `starter-timezone:<memberId>`.

Deliberately **not** ported from the legacy inline writer: the hardcoded test member id and
its dashboard/onboarding redirects, the unscoped `starter-availability` localStorage key,
the `dev-speed-test` payload override, and the bookings-list machinery (delegated to the
page's bookings embed through guarded `window.generateBookingsList` /
`window.clearGrantData`).

## Notes & gotchas

- **Script order is the contract.** The two synchronous files must precede everything else,
  or a cloned inline caller can fire a legacy request before the adapter owns `fetch`.
- Adding a scheduling endpoint means editing **both** `scheduling-auth.js`'s authenticated
  path list and `scheduling-v3-stage.js`'s route map — an unmapped route is blocked with
  `410`, by design.
- The availability writer and [`dashboard-calls.js`](./dashboards.md) both depend on this
  auth layer; neither works if `window.xanoAuthFetch` is missing.
- Releases go through the reviewed semver tag and jsDelivr purge flow, since the loader
  embed points at these exact files.
