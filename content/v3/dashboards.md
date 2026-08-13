---
title: "Dashboards"
source: v3/dashboard-calls.js
sources:
  - v3/dashboard-calls.js
  - v3/starter-dashboard-points.js
  - v3/starter-dashboard-stripe-connect.js
  - v3/dashboard-action-items.js
  - v3/paid-call-brand-payment.js
---

Source: `v3/dashboard-calls.js`, `v3/starter-dashboard-points.js`,
`v3/starter-dashboard-stripe-connect.js`, `v3/dashboard-action-items.js`,
`v3/paid-call-brand-payment.js`

## What it is

Five modules for `/starter-dashboard` and `/brand-dashboard`. Four of them bind
Designer-authored markup to an authenticated Xano read and select which authored state is
visible — three paint a tile or list, the fourth owns only the chrome of the shared Action
Items panel. The fifth is the authenticated Brand payment-method client for paid-call
booking chrome: it creates neither form markup nor Stripe Elements. None of them creates
copy, links, or styling — including error and empty states, which are all authored in
Webflow.

| File | Owns |
| --- | --- |
| `dashboard-calls.js` | The call sections on both dashboards, the Brand identity hero, and project-list filter visibility |
| `paid-call-brand-payment.js` | Authenticated Brand payment-method setup and default-card selection for paid-call booking |
| `starter-dashboard-points.js` | The Starter points and rank tile |
| `starter-dashboard-stripe-connect.js` | Stripe Connect status, the Earnings tiles, and the OAuth callback |
| `dashboard-action-items.js` | The Action Items panel **chrome only** — loading card, empty card, and live count |

Related: the messages tile is
[`starter-dashboard-messages.js`](./messaging.md), and the availability controls are
[`scheduling-availability-init.js`](./scheduling.md) (modal) and
[`scheduling-availability-section.js`](./scheduling.md#scheduling-availability-sectionjs--dashboard--calendar)
(Dashboard / Calendar).

## `dashboard-calls.js` — call sections and the Brand hero

It binds the authored call sections on exactly `/starter-dashboard`, `/brand-dashboard`, and
their two `---availability-stage` twins. It is inert everywhere else. Load it through
`scheduling-v3-stage-component.html`, **after** the synchronous scheduling auth and stage
adapter — that loader is the authoritative script order.

The controller resolves the current Memberstack member, reads `booking_record/get/v3`
through `window.xanoAuthFetch`, and then **independently requires** the returned row's
role-specific `starter_data.memberstack_id` or `brand_data.memberstack_id` to match. A
missing session, unavailable auth bridge, malformed response, or absent/mismatched
participant identity **fails closed**. An auth change immediately clears rendered identity
data and booking rows, so a response started under a prior session can never repaint the
page.

### Markup contract

Each call section must provide:

| Hook | Purpose |
| --- | --- |
| `[bookings-section="calls"]` | The calls section. Starter may also have `[bookings-section="requests"]`. |
| `[bookings-list="<name>"]` | Where cards are appended |
| `[bookings-item-template="<name>"]` | The card template, cloned per row |
| `[bookings-loader="<name>"]` | Loading state |
| `[bookings-empty="<name>"]` | Empty state |
| `[bookings-count]` | Optional count |
| `[bookings-load-more]` | Optional "show more" control |
| `[booking-filter="<status>"]` | Optional status filter control, wrapped by `.tabs-button_component.is-dashboard` |
| `[booking-element]`, `[label-text]`, `[payment-status-wrap]`, `[brand-status]` | Card value slots |

Cards are cloned in pages of six, deduplicated by canonical booking ID, and sorted newest
first. Starter pending rows go under requests and everything else under calls; Brand keeps
one calls list. **Legacy card action controls are hidden**, because V3 has no identity-safe
mutation handler — only a confirmed row with a canonical meeting link exposes its join
control.

The filter wrapper stays hidden during identity resolution and on errors, and appears only
once the member's full canonical rows for that section are non-empty. A selected status with
no matching rows does **not** hide the wrapper, so the member can get back to All.

### Project list filters and pagination

The same controller owns filter-wrapper visibility for the wf-xano Projects lists keyed
`dash-projects` and `dash-brand-projects`. Each instance's
`.tabs-button_component.is-dashboard` stays hidden until a successful wf-xano state proves
the **unfiltered** list contains at least one item. When a page loads with an empty status
filter already selected, the controller temporarily probes the unfiltered list, restores the
selected status, and reveals the controls only if that probe found projects. Loading, error,
missing-instance, unknown-total, and auth-transition states fail closed.

The Designer-owned project **Show more** control is upgraded to wf-xano append pagination.
Author it with `wf-xano-element="load-more"`; the existing `.button_main-wrap` whose
`.button_main-text` is exactly `Show more` is also supported. It preserves rendered cards
and the active filter, disables itself and shows its authored `data-opp-loading="true"`
state while requesting the next page, then hides for empty, exhausted, or single-page
results. An append error keeps the control available for retry.

### The Brand hero

On Brand only, the resolved Memberstack snapshot paints the existing hero through custom
attributes, never styling classes:

| `hero-element` value | Source field |
| --- | --- |
| `brand-first-name` | `free-user` |
| `brand-last-name` | `last-name` |
| `brand-company` | `company` |
| `brand-image` | **never written** — `src` stays owned by Memberstack's native `data-ms-member="profile-image"` binding |

Values clear before every session refresh and on any failure, so another member's projection
cannot survive an auth transition.

The Brand dashboard's `form[data-ms-form="profile"]` remains a native Memberstack form and
keeps sole ownership of its submit. The controller **observes** that submit without
cancelling it, reads the intended values, and retries `getCurrentMember()` for a bounded
period — repainting the hero only after Memberstack readback matches all three submitted
values. A failed, delayed, or superseded save leaves the hero unchanged.

| Runtime hook | Values |
| --- | --- |
| `data-dashboard-calls-v3` on `<html>` | `loading`, `ready`, `error` |
| `data-bookings-state` on each valid section | `loading`, `ready`, `empty`, `error` |

Authored duplicate dashboard tiles whose heading is exactly `Calls` or `Call Requests` are
hidden when they do not carry `[bookings-section]`.

## `paid-call-brand-payment.js` — Brand paid-call payment method

Authenticated Brand payment-method client for paid-call booking chrome on the Brand
dashboard (and any other surface already inside the
[scheduling auth](./scheduling.md) host/path boundary). Pick **this** page, not a third
home. It does not create form markup and does not initialize Stripe Elements. Load it
**after** `scheduling-auth.js`. A production Hire surface must be added to that boundary
before this client can authenticate there:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/scheduling-auth.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/paid-call-brand-payment.js"></script>
```

Xano derives the Brand identity and payment environment from the Bearer token. The browser
sends neither field. The scheduling auth bridge allowlists only these two paths:

- `POST /brand/payment-method/setup/v3`
- `POST /brand/payment-method/set-default/v3`

A booking controller should use this sequence:

1. Call `StartersPaidCallBrandPayment.createSetupAttempt()` once for the current card-setup
   attempt.
2. Retry that attempt through its `.run()` method with the **same** idempotency key until
   Xano returns the Stripe SetupIntent client secret or a terminal error.
3. Give that client secret to Stripe.js and let Stripe Elements collect and confirm the
   card. Never send raw card data through Webflow or Xano.
4. After Stripe.js returns a `pm_...` PaymentMethod ID, call
   `createDefaultSelectionAttempt(paymentMethodId)` once for that intentional selection.
5. Retry the returned selection attempt through `.run()` with its captured key. Create a
   **new** attempt for every later intentional selection, including an A-to-B-to-A
   sequence.

One bounded idempotency key per selection attempt: retries reuse that key; every later
intentional selection creates a new attempt. Keys and PaymentMethod IDs are validated
before network work (key ≤ 128 characters; PaymentMethod IDs must start with `pm_`). The
client uses `xanoAuthFetch` when the shared bridge is present and otherwise uses
`getXanoAuthToken`. The backend remains authoritative for customer, environment,
default-card, and readiness state.

The authoritative contract is `v3/README.md#brand-paid-call-payment-method-client`.
`window.StartersPaidCallBrandPayment` exposes `createSetupAttempt`,
`createDefaultSelectionAttempt`, and the path constants.

## `starter-dashboard-points.js` — points and rank

Load on `/starter-dashboard`:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/starter-dashboard-points.js"></script>
```

It trades the Memberstack session for a Xano token and binds the authenticated
`POST /starter/points/summary` read model. **It never calculates points or rank in the
browser.**

Wire one or more tile roots with `data-points-element="root"`. Within each root:

| Value | Purpose |
| --- | --- |
| `loading` | Loading card or spinner |
| `content` | Normal points/rank content |
| `error` | Authored safe error state |
| `state-refreshing` | Authored rank-refreshing guidance |
| `state-ineligible` | Authored profile-completion guidance |
| `state-quarantined` | Authored reconciliation guidance |
| `state-missing-role` | Authored primary-role setup guidance |
| `points` | Canonical ledger total |
| `overall-card` | Overall-rank card wrapper; visible only when rank status is ready |
| `overall-rank` | Overall competition rank |
| `overall-cohort-size` | Overall cohort size only |
| `overall-tie` | Authored tie label; shown only when multiple eligible Starters share the overall score |
| `role-card` | Primary-role rank card wrapper |
| `role-rank` | Primary-role competition rank |
| `role-label` | Primary-role name only |
| `role-cohort-size` | Primary-role cohort size only |
| `role-tie` | Authored tie label for a shared role score |

When Xano reports `refreshing`, or a nominally ready payload lacks a rank or cohort, the
position is **withheld** and both rank cards hide. `ineligible` and `quarantined` likewise
hide both cards and reveal their matching authored state blocks. A missing primary role
keeps the overall card and reveals the authored setup state inside the role card. No state
renders a raw `N/A`.

| Runtime hook | Values |
| --- | --- |
| `data-points-status` on each root | `loading`, `ready`, `refreshing`, `ineligible`, `quarantined`, `error` |
| `data-points-view` on each root | The same, plus `missing-role`, for the exact visual state |

Keep surrounding phrases such as "Out of", "eligible Starters", and "Rank" **outside** the
dynamic hooks — the controller binds values, not sentences.

## `starter-dashboard-stripe-connect.js` — Stripe Connect

Load on `/starter-dashboard` **and** `/stripe-connect-callback`:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/starter-dashboard-stripe-connect.js"></script>
```

It replaces the V2 nightly Airtable/Webflow-CMS display chain with an immediate read of the
Stripe-authoritative Xano mirror. Every call is Bearer-authenticated and the endpoints
(`status/v3`, `start/v3`, `oauth_exchange/v3` on `api:KZf7nFnk`) derive the member from the
token — **no client-supplied `member_id` is ever sent**, so a forged request cannot read or
link another member's Stripe account.

Wire a root on each page with `data-stripe-connect-element="root"`:

| Value | Purpose |
| --- | --- |
| `loading` | While Memberstack and Xano resolve |
| `disconnected` | No connected account; contains the authored connect CTA |
| `incomplete` | Connected but charges not enabled; contains the "Complete setup" CTA |
| `ready` | Stripe reports `charges_enabled: true` |
| `review` | Just returned from Stripe, but the authoritative flag has not settled after short polling |
| `error` | Authored safe failure state; on the callback page it stays visible rather than losing a failed one-time code |

| Attribute | Values | Purpose |
| --- | --- | --- |
| `data-stripe-connect-action` | `start`, `refresh`, `earnings` | Every Connect / Complete setup control uses `start`; an optional retry control uses `refresh` |
| `data-stripe-connect-earnings-state` | `disconnected`, `ready` | Marks the two authored hero Earnings tiles |

The controller shows exactly one Earnings tile after the status read: a disconnected or
incomplete account gets the enabled Connect Stripe tile, and `charges_enabled: true` gets the
Payment history and payouts tile pointed at `https://dashboard.stripe.com/`. During loading,
review, error, or session-failure both tiles stay hidden so stale state is never shown. For
the original live markup where both tiles predate the state attribute, the authored
two-tile order is preserved.

Both actions work on a native anchor or an authored non-anchor tile; an enabled non-anchor
is exposed as `role="button"` with `tabindex="0"` and activates from click **and**
Enter/Space.

While a request is in flight, the initiating control stays visible but receives
`is-disabled`, `aria-disabled="true"`, `aria-busy="true"`, `tabindex="-1"`, and blocked
pointer events. A single in-flight guard is shared across every start and refresh control,
so a second click anywhere is ignored. If the start request fails, prior tab order and
active state are restored before the authored error card appears.

`start/v3` is posted with the dashboard `return_url` plus an explicit `callback_url` of
`/stripe-connect-callback` on the same origin, and the controller accepts **only** an HTTPS
`connect.stripe.com` URL before redirecting. The callback reads `code` and optional `state`,
strips the OAuth parameters from the visible URL before doing network work, resolves the
member, rejects a mismatched `state`, and posts only `{code}`. Success redirects to
`/starter-dashboard?stripe_connect=connected`.

| Runtime hook | Purpose |
| --- | --- |
| `data-stripe-connect-status`, `data-stripe-connect-view` on each root | The selected state |
| `starterStripeConnectReady`, `starterStripeConnectRedirect`, `starterStripeConnectError` | Diagnostic events |

An opt-in **sandbox flow** lets the staging Test Talent member complete a Connect OAuth
round-trip without creating a live-mode connection or writing a test account ID into
`freelancers_v3`. It activates only when both hold: the page is served from
`the-starters-3-0.webflow.io`, and the request carries `stripe_connect_sandbox=1`. The flag
is stripped from the visible URL like the OAuth parameters.

## `dashboard-action-items.js` — the Action Items panel

Load on `/starter-dashboard` **and** `/brand-dashboard`:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/dashboard-action-items.js"></script>
```

The Action Items panel is **shared infrastructure**. The feature scripts that contribute
rows — Stripe Connect, calls, projects, and whatever comes next — still own their own rows
and show or hide them themselves. This controller never shows, hides, or edits a feature
row. It owns the panel chrome: the loading card, the "all caught up" empty card, and the
live count.

The Designer grammar is the `data-action-element` vocabulary already authored on the Brand
dashboard:

| Value | Purpose |
| --- | --- |
| `wrapper` | Panel scope root. Optional — with no wrapper anywhere on the page the controller falls back to a single document-wide panel whenever any `loading`, `empty`, or `total` chrome is authored, which is what the Starter dashboard still uses. A page with neither a wrapper nor chrome stays untouched |
| `list` | List container; informational only |
| `loading` | Loading card, visible until the panel first settles |
| `empty` | "All caught up" card, visible once settled with zero items |
| `total` | Text node that receives the live count, replacing the static authored number |
| `item` | An actionable row |

Rows are matched by `[data-action-element="item"]` **or** the authored
`.dash-hero_action-item` class. That class fallback is a deliberate, accepted exception to
the attributes-only convention on the [group intro](./index.md) — both dashboards ship
class-marked rows today, including component-driven ones that cannot take the attribute
yet. Remove it once every row carries `data-action-element="item"`.

A row counts as **pending when its bounding rect has height**, so `display:none` rows, rows
inside a hidden group, and zero-height strays are all excluded. Only **leaf matches** count:
a group element that also carries the row marker but contains matching descendants is
skipped, so a section never double-counts.

The panel **settles** — and only then may the empty card appear — at the first of: an item
becoming visible, one of the `starterStripeConnectReady` / `starterStripeConnectError`
readiness events, or a 4-second timeout. Until it settles the loading card stays up, so a
slow feature controller never flashes a false "all caught up".

| Runtime hook | Purpose |
| --- | --- |
| `data-action-items-count` on the scope | The live count, written on every render (on `<body>`, or `<html>` if there is no body, when the scope is the document) |
| `actionItemsChanged` on `window` | `CustomEvent` with `{ detail: { count } }`, dispatched **only when the count actually changes** |

A `MutationObserver` watching `childList` plus the `style`, `class`, and `hidden` attributes
keeps all of it live, and renders are coalesced to one per animation frame (falling back to
a `setTimeout`) because Webflow IX2 writes inline styles every frame.

## Notes & gotchas

- **`dashboard-calls.js` and `paid-call-brand-payment.js` depend on the scheduling auth
  layer.** Without `window.xanoAuthFetch` (or `getXanoAuthToken` for the payment client)
  they fail closed. Availability section markup lives on
  [Scheduling](./scheduling.md#scheduling-availability-sectionjs--dashboard--calendar).
- All three modules **clear** dynamic values before a session refresh and on failure. That
  is deliberate: a blank tile is correct, a previous member's data is not.
- Every state container, sentence, and link is Designer-owned. If a state looks wrong, check
  whether the authored element exists before checking the script.
- After Stripe onboarding or the OAuth callback, the controller polls status briefly to
  absorb webhook timing; if the flag is still false it selects `review` rather than painting
  a false success.
- **`starterStripeConnectReady` and `starterStripeConnectError` are load-bearing, not just
  diagnostics.** The Action Items panel settles its loading card on either of them, so keep
  dispatching both on every terminal Stripe Connect outcome.
- Unlike the other modules here, `dashboard-action-items.js` carries **no `@release` header
  line** and exposes no `window` API, so there is no version to read back when checking for
  a stale CDN copy. The repo README's Action Items section is its reference.
