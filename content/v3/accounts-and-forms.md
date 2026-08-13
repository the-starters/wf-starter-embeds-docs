---
title: "Accounts & Forms"
source: v3/brand-account-controller.js
sources:
  - v3/brand-account-controller.js
  - v3/talent-application-ui.js
  - v3/talent-application.js
  - v3/password-recovery.js
  - v3/starters-ms-redirect.js
  - v3/complete-profile-back.js
  - v3/complete-profile-loader.js
  - complete-profile-photo.js
---

Source: `v3/brand-account-controller.js`, `v3/talent-application-ui.js`,
`v3/talent-application.js`, `v3/password-recovery.js`,
`v3/starters-ms-redirect.js`, `v3/complete-profile-back.js`,
`v3/complete-profile-loader.js`, `complete-profile-photo.js`

## What it is

The modules that own **account creation and account editing** on the V3 site: the Brand
signup and Build Account forms, the Talent apply page UI and intake, the shared
password-recovery chain, the per-page signup redirect marker, and the `/complete-profile`
companions — an in-page back button, a submit spinner, and the Brand profile-image binder.
Every one of them keeps the Designer-authored forms intact; the apply UI adds only the
searchable custom-select presentation beside the native location selects, and none of them
generates the form itself.

## Authority contract

The four account modules work inside the same split:

- **Memberstack** owns identity, the login email, custom fields, and the profile image.
- **Xano endpoint #1513** consumes Memberstack webhooks and mirrors successful state into
  `user_v3` and the matching Brand or Talent role row, keyed by the stable Memberstack
  member ID.

The back-button and submit-spinner companions sit outside that split entirely: neither
reads Memberstack, neither calls the network, and neither needs the route guard's role
contract — one reads `document.referrer`, the other watches one attribute on the form.
The Talent apply UI sits outside it too: it reads no Memberstack session and never calls
Xano. The Brand profile-image binder sits on the Memberstack side of the split: it stamps
`data-ms-action="profile-image"` so Memberstack owns the upload, and Xano endpoint #1513
mirrors the result into `brands_v3.image_link`.

Native Memberstack login, signup, password recovery, and Account Profile forms, plus the
Webflow-native pause/cancel request forms, are observed by `v3/native-form-diagnostics.js`.
Load order and the shared receipt contract live on
[Workflow Diagnostics](../utils/workflow-diagnostics.md) — do not invent a second receipt
format on those surfaces.

## `brand-account-controller.js` — signup plan, Build Account, identity email

Install **sitewide, before Memberstack form initialization**, so it can align the native
signup form with the hostname's Memberstack data mode:

```html
<script>
  window.StartersBrandAccountConfig = { guardSecurityForm: 'identity' }
</script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/brand-account-controller.js"></script>
```

The forms it claims, by their Webflow-generated IDs:

| Selector | Form |
| --- | --- |
| `#wf-form-Brand-Signup` | Brand signup — plan alignment only |
| `#wf-form-Complete-Profile-Form` | Build Account, on `/complete-profile` |
| `#wf-form-Account-Security` | Brand and Talent Account Security |
| `#wf-form-Build-Form-Full-Profile` | The visible Talent edit-profile form |

Signup plan alignment picks the live Brand plan `pln_free-plan-f6kn0dxz` or the test plan
`pln_dorxata-test-brand-plan-777r02pa` from the hostname's data mode, so a staging signup
cannot create a live-mode member.

**Build Account** prevents the native Webflow submission, validates the authored fields,
updates ordinary Memberstack fields first, updates the login email only when it actually
changed, and sets the completion marker as its **last durable member write**. That ordering
is what stops a partially failed form from falsely marking onboarding complete. Durable
assignments are replay-safe: a failed retry repeats assignments rather than creating a
second account or Brand row.

It then attempts **one** Memberstack reset/set-password email. Password emails are never
automatically retried — Memberstack's own Forgot Password flow is the recovery path when
delivery cannot be confirmed. Account Security attempts that email only after a changed
login email succeeds.

### The completion marker

The moment the durable completion write resolves, the controller also stamps
`thestarters:v3-brand-profile-completed` into `sessionStorage`. That marker is what
[`complete-profile-redirect.js`, `brand-profile-redirect.js`, and
`auth-route.js`](./auth-route-and-redirects.md) read as "done" without asking Xano, closing
the Memberstack → Xano webhook's catch-up window. It is best-effort and never blocking: a
storage failure costs the member only one fail-open Xano read.

### Login-email interception

Interception is **off by default** so it cannot race the forms' existing submit owners.
`guardSecurityForm: 'identity'` resolves the current member through the route-guard role
contract, claims Brand and Talent Account Security, and guards the visible Talent
edit-profile form. In that mode a valid changed login email can save independently while
other required profile fields are still incomplete, and a valid full-profile submit changes
the login email first, then replays its Designer-authored Xano submission. The legacy
`'brand'` mode remains supported for a rollback-safe rollout.

Timeouts: 15s per operation, with retry delays of 0ms and 300ms.

## `complete-profile-back.js` — the in-page escape hatch

Install one deferred page-level tag on `/complete-profile`, and nowhere else. Load order
against the other scripts on the page does not matter: this module shares no state with any
of them.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/complete-profile-back.js"></script>
```

[`brand-profile-redirect.js`](./auth-route-and-redirects.md) pushes an unfinished paid Brand
onto this form with `location.replace()`, which **destroys the history entry it replaced**.
The browser's own Back button therefore lands one hop too far, or nowhere at all. So the
page carries its own back control — authored hidden and inert — and this module decides
whether it deserves to exist for this visit, names where it points, reveals it, and wires
the click. It never redirects anybody on its own, never reads Memberstack, never touches the
network, and needs no role contract.

### Markup contract

Three hooks, **all optional at runtime**. Any one of them missing leaves the page exactly as
authored — a hidden button and one staging warning, which is the status quo rather than a
failure.

| Hook | On | Purpose |
| --- | --- | --- |
| `data-complete-profile-back` | the button **wrapper** | Authored hidden; this module reveals it |
| `data-complete-profile-back-label` | the **text** element inside | Its **full** text is replaced, so it holds `Go back to Home`, not just `Home` |
| `button.clickable_btn` | the real control inside the wrapper | Found by class, no attribute needed |

Revealing clears both of Webflow's ways of saying "hidden", independently, because a
Designer edit can leave either behind: the project's `hide` utility class is removed, and an
inline `display: none` is cleared. An inline `display` set to anything *else* is left alone —
that is a deliberate layout value, not a hiding mechanism.

The inner button is looked up **strictly inside the wrapper**, with no document-wide
fallback. `clickable_btn` is the project's generic button class, so a page-wide search would
match the form's own Submit control and pressing Submit would navigate away instead of
submitting. It is not required either: the click is bound on the wrapper **and** the button,
sharing a one-shot latch so the bubbling pair navigates once, and `type="button"` means
there is no submit to `preventDefault`.

### Where the destination comes from

`document.referrer`, read on init and mirrored into `sessionStorage` under
**`thestarters:v3-complete-profile-back`** — its own key, never the completion marker.

| Referrer on this load | Outcome |
| --- | --- |
| Non-empty and same-origin on an approved host | Stored, overwriting any prior value, and used |
| Non-empty but off-site (Google, a newsletter, a partner) | Neither stored nor used, and **no** fall back to the stored value |
| Empty — a reload, a direct hit, or a stripped referrer policy | Falls back to the stored value, re-validated against the same host gate on the way out |
| Neither | The button stays hidden |

That reload fallback is the entire reason the key exists: refreshing the form is exactly
when a member is most likely to want out, and exactly when the referrer is gone. Capture
happens **before** the hide rule below, so a member who went `/case-studies` →
`/complete-profile` → `/login` → `/complete-profile` is not offered the case study they left
two navigations ago. The click is `location.assign()` on the full stored URL, query string
and hash included, same-origin by construction. Every storage access is wrapped, because
Safari private mode throws on the property itself; a storage failure costs the reload
fallback and nothing else.

### The hide list

A back button is only worth showing when going back is somewhere the member can actually
stay, so it stays hidden when the effective referrer is a funnel or login page
(`/auth-route`, `/login`, `/sign-up`, `/starter-login`), `/complete-profile` itself, or **any
page `brand-profile-redirect.js` guards** — `/brand-dashboard`, `/all-starters`, `/messages`,
`/starter-dashboard`, `/dashboard`, `/opportunities`, and `/opportunities/<slug>`.

That second group is the load-bearing one. Those pages are precisely where an unfinished
Brand gets bounced *to* this form, so a "go back" to any of them is a round trip that lands
the member on the same form a second later, having watched two navigations to get nowhere.
Paths are compared after the same one-trailing-slash normalization the sibling redirects use,
and `/opportunities/<slug>` matches the single-segment shape the guard matches, so a nested
path such as `/opportunities/product-designer/apply` is deliberately not hidden — it is not
guarded there either. **Keep the two lists in step:** a page added to
`brand-profile-redirect.js` must be added here, or the loop reopens on that one page.

### The label map

Curated, not derived. A slug-to-title-case guess produces "Go back to Frameworks Playbooks"
and "Go back to Interview News", which reads worse than saying nothing, so every public
surface a Brand plausibly arrives from is named by hand behind the prefix `Go back to `.

| Referrer path | Label |
| --- | --- |
| `/` | Go back to Home |
| `/learn` | Go back to Learn |
| `/learn/sessions`, `/learn/sessions/<slug>` | Go back to Sessions |
| `/learn/interview-news/<slug>`, `/learn/interviews` | Go back to Article |
| `/learn/playbooks-frameworks/<slug>`, `/learn/frameworks-playbooks` | Go back to Playbook |
| `/learn/webinar` | Go back to Webinar |
| `/learn/events` | Go back to Events |
| `/case-studies`, `/case-studies/<slug>` | Go back to Case Studies |
| `/why-us` | Go back to Why Us |
| `/functions/<slug>` | Go back to Functions |
| `/industries/<slug>` | Go back to Industries |
| `/hire/<slug>` | Go back to **&lt;Starter's first name&gt;** |
| Anything else | **Go back** |

`/hire/<slug>` is the one derived label — the segment before the first hyphen, title-cased,
so `/hire/john-doe` reads "Go back to John" — because that is the only case where the slug
carries the exact word the member is looking for. Everything unmapped gets the bare
`Go back`: a button that still works and simply stops promising where it goes. All Starters,
Opportunities, Messages, and both dashboards are **deliberately absent** from the map,
because the hide list already makes them unreachable.

`window.StartersCompleteProfileBack` exposes the live decision (`state.applied` is the
one-word answer, `state.reason` names the branch) plus the pure helpers `shouldHide()`,
`labelFor()`, and `effectiveReferrer()`. The repo's `v3/COMPLETE-PROFILE-BACK-WIRING.md` is
the fine-grained reference, including the Designer steps and the release gate.

## `complete-profile-loader.js` — the submit spinner

Install one deferred page-level tag on `/complete-profile`. Order against
`brand-account-controller.js` does not matter — the module reads the attribute whenever it
changes and once more at init, so it cannot miss a submit by being late.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/complete-profile-loader.js"></script>
```

A durable Build Account submit is several round trips long, and until this shipped the page
gave no sign that anything was happening: the button greyed out and then the page sat there
until it redirected. On a slow connection that reads as a dead form, and a member who
believes a form is dead starts clicking things. This module shows the authored loader for
exactly as long as the submit is in flight and fades back what is behind it. It writes
`display`, `opacity`, `pointer-events`, and `transition`, and nothing else.

### It observes `aria-busy`, and nothing more

The signal is `aria-busy` on the form, which `brand-account-controller.js` already maintains
through its `setBusy()` helper: `"true"` when a submit starts, `"false"` when it ends. This
module is a **pure observer** of that attribute. It deliberately binds no `submit` handler,
so it cannot interfere with the controller or with Webflow's own form handling, and it
deliberately never touches the submit button — double-submit is already guarded by the
controller, and two owners of one button is how a form ends up permanently disabled.

One controller behaviour is load-bearing here: on a successful submit that initiates a
redirect, the controller **does not clear busy**. The form stays `aria-busy="true"` until the
page unloads, so the spinner survives the navigation — `location.assign()` only queues a
navigation, and the older code released the form while the browser was still fetching the
destination. Busy therefore clears on exactly two paths, both of which leave the member here
wanting the form back: an error, and a success that resolved no redirect URL. Reverting that
latch would not break this module; it would only stop covering the redirect, which is the
most valuable second it covers.

### Markup contract

| Hook | On | Purpose |
| --- | --- | --- |
| `data-complete-profile-loader` | the loader element | Required. Authored hidden, and **outside** any dim target |
| `data-loader` | the same element | Minimum display in milliseconds; `1000` as authored |
| `data-complete-profile-element="form"` | a real box around the form | Dim target, optional |
| `data-complete-profile-element="profile-photo"` | the photo | Dim target, optional |

Show and hide are **inline** `display: flex` and `display: none` writes, because the
Designer's Display:None compiles to a class rule and a class rule beats anything written to
the stylesheet. The loader is also force-hidden once at init, so a Designer edit that ships
it visible is corrected the moment the script runs.

The minimum-display value must be **wholly numeric**. Surrounding whitespace is forgiven, a
unit suffix is not: `1s` and `1000px` fall back to **200ms** rather than parsing as 1 and
1000. `parseInt` would accept both, and `1s` in particular would quietly cut the anti-flash
window to a single millisecond with nothing wrong-looking in the markup. When `aria-busy`
goes false inside that window the hide is deferred, not skipped.

### Failure modes

| Situation | Outcome |
| --- | --- |
| No `[data-complete-profile-loader]` on the page | Bail with **zero side effects**, silently — which is what makes the file safe to load sitewide |
| No form to watch, or no `MutationObserver` | Bail with the loader force-hidden, one staging warning |
| A dim target is missing | Skip it silently and individually; the spinner still shows |
| A dim target **contains** the loader | Skip it with a staging warning; the spinner still shows |
| Still showing 5000ms after a show | Hide and restore regardless of `aria-busy` |
| A second submit starts before a pending hide lands | Cancel that hide, restart both the minimum window and the cap |

Skipping an ancestor of the loader is not defensive noise. Opacity on an ancestor creates a
rendering group its children cannot escape, and `pointer-events: none` inherits, so dimming
one would fade the spinner to 0.2 and make it inert — the feature looking broken at the exact
moment it is meant to reassure. Losing the dim and keeping a healthy spinner is the better
half to keep, and it makes a half-finished Designer edit degrade quietly.

The **5000ms cap always fires**, and that is not optional: a spinner is a full-page visual
block, so a controller that throws before clearing `aria-busy`, an attribute write the module
never sees, or a bug in this file must not be able to trap a member behind a permanent
overlay. Note how that interacts with the redirect latch — because a successful submit never
clears busy, the cap is the *normal* end of a successful session whenever the navigation
takes longer than five seconds. A member on a slow connection briefly sees the form again
before the new page paints, which is strictly better than one on a stalled navigation staring
at a spinner with no way out. `state.capHits` above zero is therefore not automatically a
bug.

`window.StartersCompleteProfileLoader` exposes `state` (`showing`, `reason`, `minMs`,
`dimCount`, and the `shows`/`hides`/`capHits` counters) plus callable `show()` and `hide()`
for looking at the visual state without submitting. Checking `state.minMs` on the published
page is the fastest way to catch a `data-loader` value that did not parse. The repo's
`v3/COMPLETE-PROFILE-LOADER-WIRING.md` carries the Designer checklist, the `display: contents`
trap, and the release gate.

## `complete-profile-photo.js` — Brand profile image via Memberstack

Install one deferred page-level tag on `/complete-profile` only. The file lives at the
**repo root**, not under `v3/`.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/complete-profile-photo.js"></script>
```

`/complete-profile` is a Brand onboarding surface. The previous controller posted the image
to Xano's Starter-only endpoint (#1390), which requires a `freelancers_v3` row and therefore
failed every Brand. This module instead binds Memberstack's supported
`data-ms-action="profile-image"` uploader onto the authored control, so Memberstack owns the
image and no Starter endpoint is involved. Xano endpoint **#1513** consumes the resulting
`member.updated` webhook and mirrors `member.profileImage` into `brands_v3.image_link`.

Allowed hosts match the other V3 scripts (`the-starters-3-0.webflow.io`, `thestarters.com`,
`www.thestarters.com`) plus `localhost`, `127.0.0.1`, and `*.trycloudflare.com` for the
dev-tunnel loop. Off-path or off-host loads return early with no side effects.

### Markup contract

| Hook | On | Purpose |
| --- | --- | --- |
| `.app-form_upload.is-complete-profile .upload-btn` | the upload button | Receives `data-ms-action="profile-image"` |
| `[data-complete-profile-image]` | the preview `<img>` | Also receives `data-ms-member="profile-image"` so Memberstack can refresh the preview |

Boot guard: `window.__startersBrandProfileImageBound`. Re-run or probe with
`window.StartersBrandProfileImage.init()`.

## `talent-application-ui.js` — page UI, never submission

Install on `/freelancer-application/step-1` **only**, **before**
`talent-application.js`. This is the GitHub-owned replacement for the 23 KB Webflow Code
Embed on that page. After the CDN release is live, **remove the legacy inline
controller** — do not keep both.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/talent-application-ui.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/talent-application.js"></script>
```

Both loaders are deferred and must remain in that order. The UI controller owns field
validation, the conditional profile and referral blocks, location loading, and the
searchable custom-select presentation beside the native `country` / `state` / `city`
selects. It does **not** bind a submit handler, build a submission payload, or log
applicant fields. Submission transport stays
[`talent-application.js`](#talent-applicationjs--the-apply-intake). The authoritative
split is `v3/README.md#talent-application-intake`.

It sits outside the Memberstack / Xano account split: it reads no Memberstack session and
never calls Xano. Locations come from the published Webflow CDN asset. The apply intake's
receipts use the shared helper on
[Workflow Diagnostics](../utils/workflow-diagnostics.md); this UI file does not write
receipts.

Boot guard: `window.__startersTalentApplicationUiBooted`. Missing
`[application-form]`, `[form-submit]`, or `[form-next]` bails with no side effects.

### Markup contract

Keep the Designer-authored form. Generated IDs and styling classes are **not** selector
fallbacks.

| Hook | On | Purpose |
| --- | --- | --- |
| `application-form` | the `<form>` | Binding selector |
| `[form-next]`, `[form-submit]` | inside the form | Next / Complete controls; the UI enables or disables them |
| `#first-name`, `#email`, `#phone`, `#linkedin` | native inputs | Live validity; LinkedIn and email show inline errors |
| `input[name="profile-type"]` (`#full-profile`, `#consult-only`) | radios | Toggles the profile blocks |
| `[data-element="full-profile"]`, `[data-element="consult"]` | conditional blocks | Full-profile vs Consult Only |
| `#rate`, `#rate-consult` | rate inputs | `required` only while their block is visible |
| `#referral-source`, `#referred`, `#other` | referral controls | Referral / Other reveal their blocks |
| `[data-element="referred"]`, `[data-element="other-option"]` | conditional blocks | Referral follow-ups |
| `#country`, `#state`, `#city` | native selects | Populated from the locations asset; custom-select UI is added beside each |

Country and state option **values** are numeric indexes into that asset; city values are
the visible city name. The intake controller is what resolves selected options to visible
**text** on submit — sending the raw indexes is the legacy `Country: 0` bug.

The custom-select widgets (`.custom-select-container`) are presentation only. The native
selects remain in the form and stay the source of truth.

## `talent-application.js` — the apply intake

Install on `/freelancer-application/step-1` **only**, **after**
`talent-application-ui.js` (see the pair above). Never load this file instead of the UI
controller, and never let the UI file own submission.

It intercepts the multistep apply form's final submit and POSTs JSON to
`api:KZf7nFnk/talent/application/create`. Xano owns the authoritative application row and
mirrors it into the Airtable review table **server-side** — the native Webflow submission
is deliberately suppressed, because Zapier is no longer the intake path.

### Why it listens twice

Videsigns' multistep library calls jQuery's synthetic `form.submit()` from its final
"Complete" click handler, and a native `submit` capture listener never sees that event. So
the module listens in capture phase two ways: a `click` listener on the multistep submit
control, and a `submit` listener for real native submits such as pressing Enter. Both run
before Webflow's delegated submit handler.

### Markup contract

| Hook | On | Purpose |
| --- | --- | --- |
| `application-form` | the `<form>` | The binding selector. Generated IDs and styling classes are **not** fallbacks. |
| `data-form="submit-btn"` or `data-form-ms="submit-btn"` | the multistep Complete control | What the capture-phase click listener keys off |
| `.w-form` wrapper with a `.w-form-fail` block | around the form | A failed request reveals it and re-enables the submit control for retry |
| `data-redirect` | the `<form>` | Success destination; `redirect` is also accepted, and it defaults to `/freelancer-application/step-2` |

Remove any other custom submit interceptor from this form.

### Field mapping

`email`, `first-name`, `last-name`, `phone`, `linkedin`, `profile-type`, `function`,
`referral-source`, `country`, and `city` map to the Xano intake contract. A `Consult Only`
profile selects `consult-option` and `rate-consult`; anything else selects `role-option` and
`rate`, with the other pair kept as a fallback — the Zapier era silently dropped the consult
pair. Every string field is also sent in `answers`, with repeated names joined in submission
order and non-string values such as file objects ignored.

The runtime-built `country` and `state` selects store **numeric option indexes** as their
values, so the request resolves the selected option's visible **text** instead. Sending raw
values is what produced the legacy `Country: 0` bug.

Native constraint validation runs first, but `reportValidity` is called only on **visible**
invalid controls — a required-but-hidden Webflow field (the non-selected consult/full pair,
or an inactive step) cannot silently block Complete with an unshowable error.

Any successful response containing an application `id` continues to the redirect, including
Xano's success response for a **duplicate** open application with the same email — the
applicant just continues the flow.

## `password-recovery.js` — the shared recovery chain

Install **once in the V3 site head**, before Memberstack form initialization:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/password-recovery.js"></script>
```

Brand and Talent use the same Memberstack form contracts, so this module keeps one
canonical chain and treats persona as **navigation context only**:

```
/forgot-password → /reset-password → /password-success
```

It is inert outside the approved V3 hosts and auth paths. Legacy Talent paths are redirected
with the original query string, reset token, encoding, and hash intact, so existing
Memberstack reset-token links keep working. The only value appended is the non-sensitive
`from=<origin>` context, also cached under `thestarters:v3-password-origin`.

| Legacy path | Canonical path | Origin |
| --- | --- | --- |
| `/starters-forgot-password` | `/forgot-password` | Talent |
| `/starters-reset-password` | `/reset-password` | Talent |
| `/starters-password-success` | `/password-success` | Talent |
| `/starter-password-success` | `/password-success` | Talent |
| `/password-sucess` | `/password-success` | Brand |

### Markup contract

Login pages should link to `/forgot-password?from=brand` and `/forgot-password?from=talent`.
On the recovery pages, author **both** login choices as native Webflow links:

```html
<a href="/login" data-password-recovery-login="brand">Brand login</a>
<a href="/starter-login" data-password-recovery-login="talent">Talent login</a>
```

| Attribute | Values | Purpose |
| --- | --- | --- |
| `data-password-recovery-login` | `brand`, `talent` | A login choice. A known origin shows only the matching one; an unknown origin shows both. |
| `data-password-recovery-retry` | — | Any native "Different email?" link |

Until both choices are present, a direct visit with no origin uses a neutral homepage
fallback rather than silently favouring one persona: the link points at `/` with an
`aria-label` of `Return to homepage`. On a Webflow native button (an anchor inside
`.button_main-wrap`) it rewrites the sibling `.button_main-text` label, so the visible text
changes without inserting overlapping overlay text.

## `starters-ms-redirect.js` — the per-page signup redirect marker

Webflow's native form Redirect URL is one static value per form and cannot bind to a CMS
item or a component prop, so a signup modal in a shared component or on a collection
template cannot send members back to the page they signed up from. This module copies the
target out of a marker attribute the page (or CMS item) can vary, onto **every** signup
form, before Memberstack's `initSignupForms()` reads it.

Install in the footer of any page hosting the signup modal, or sitewide:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/starters-ms-redirect.js"></script>
```

### Markup contract

One hidden marker per page, CMS-bindable on a collection template so every item redirects
to itself:

```html
<div hidden starters-ms-redirect="/hire/some-slug?modal-id=signup-modal"></div>
```

| Attribute | On | Purpose |
| --- | --- | --- |
| `starters-ms-redirect` | a hidden page element | The page default |
| `starters-ms-redirect` | a `form[data-ms-form="signup"]` | Per-form override; belongs to that form alone and is never used as the page default |

Resolution order per signup form: the form's own marker, then the first
`[starters-ms-redirect]` element that is **not** a form. A form that already has a non-empty
`redirect` is left alone — an author's explicit Designer value wins.

The value is written to both `redirect` and `data-redirect`. `redirect` is the one
Memberstack reads at submit time, so it also covers keyboard-only submits that the
click-armed `data-ms-redirect` override misses. The value is used verbatim, so
`?modal-id=signup-modal` survives and the site's `modal.js` reopens the modal on the
reloaded page.

### Accepted values

Root-relative same-origin paths only. A value must start with `/`, must **not** start with
`//` or `/\` (both protocol-relative, so both leave the site), and must contain no ASCII
control characters — the WHATWG URL parser strips tab, LF, and CR *before* parsing, so a
value like `/<tab>/evil.example` would pass a naive leading-slash check and still resolve to
`https://evil.example/`. Anything else is ignored with a staging-only warning.

## Notes & gotchas

- **Signup forms injected after `DOMContentLoaded` are out of scope** for the redirect
  marker — it does not observe later mutations. Call `window.StartersMsRedirect.apply()`
  after injecting one.
- Do not install [`auth-route.js`](./auth-route-and-redirects.md) on `/sign-up`: it would
  set a non-empty `redirect` first and silently disable the marker system.
- `brand-account-controller.js` writes the Memberstack `completed-brand-profile` field, but
  **nothing routes on it** since 2026-08-06 — the funnel reads Xano plus the
  `sessionStorage` marker.
- **Two different `sessionStorage` keys live on `/complete-profile`.**
  `thestarters:v3-brand-profile-completed` is the completion marker shared by the controller
  and the [three redirect readers](./auth-route-and-redirects.md);
  `thestarters:v3-complete-profile-back` belongs to the back button alone, which never reads
  or writes the other one.
- The submit spinner depends on the controller **not** clearing `aria-busy` on a successful
  redirect. If that latch is ever removed, the spinner drops during every successful submit
  instead of covering the navigation.
- The Talent intake sends no browser secret: Xano performs the Airtable mirror server-side.
- Apply-intake receipts use the shared helper on
  [Workflow Diagnostics](../utils/workflow-diagnostics.md). Do not invent a second
  receipt format on the apply page; the UI controller never writes one.
