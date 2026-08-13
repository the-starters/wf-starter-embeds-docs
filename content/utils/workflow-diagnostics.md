---
title: "Workflow Diagnostics"
source: utils/workflow-diagnostics.js
sources:
  - v3/native-form-diagnostics.js
---

Source: `utils/workflow-diagnostics.js`, `v3/native-form-diagnostics.js`

## What it is

The shared, privacy-safe **receipt** that covered V3 mutations write when something
succeeds or fails. README Current Scripts owns this contract: allowlisted metadata only,
no PII, and diagnostic IDs stay out of every user-facing success, error, and status
message.

Controllers keep the native Webflow surfaces they already own. Before a covered mutation
starts, the controller tries to load this helper from the **same jsDelivr repository
ref**. A load failure degrades to the existing workflow — it never blocks the mutation.

Copy a receipt from the browser console:

```js
copyWorkflowDiagnostic('<workflow>')
```

Omit the argument to copy the latest receipt in the current tab. The helper also logs
`[Workflow diagnostic]` to `console.info`.

## File structure

```
utils/workflow-diagnostics.js      shared receipt helper (StartersWorkflowDiagnostics)
v3/native-form-diagnostics.js      sitewide observer for native Memberstack / pause-cancel forms
```

You do not normally paste `workflow-diagnostics.js` into Webflow. Mutation controllers
and the native-form observer load it themselves. The observer **is** a sitewide embed —
see [Native-form diagnostics](#native-form-diagnostics) below.

## Install

The helper has no markup contract and no host gate. When you do load it directly (staging
probes), use `defer`:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/utils/workflow-diagnostics.js"></script>
```

`@latest` follows the newest git tag. Production may pin `@vX.Y.Z` so a later release
cannot change the page without you.

Run-once: a second load is a no-op once `window.StartersWorkflowDiagnostics` exists.
Schema id: `starters_workflow_diagnostic_v1`.

## Receipt contract

The helper's `normalize()` is the only field allowlist. Do not widen it in a controller.

| README field | Receipt key | Notes |
| --- | --- | --- |
| Diagnostic ID | `diagnostic_id` | `WFD-<WORKFLOW>-<YYYYMMDD>-<suffix>` when the controller does not supply one |
| UTC time | `time_utc` | ISO timestamp |
| Controller / environment | `controller_version`, `environment` | `environment` is `staging` on `*.webflow.io`, `production` on `thestarters.com` / `www.thestarters.com`, otherwise the hostname or `unknown` |
| Workflow | `workflow` | Slug passed by the controller |
| Result / stage | `result`, `stage` | Slugs; unknown values become `unknown` |
| Safe error code | `error_code` | Uppercase `[A-Z0-9_:-]+` only; anything else becomes `WORKFLOW_ERROR` |
| HTTP status | `http_status` | Integer or `null` |
| Duration | `duration_ms` | Integer milliseconds or `null` |
| Request-attempted state | `request_started` | Boolean |
| Canonical record type / ID | `resource_type`, `resource_id` | `resource_id` accepts `[A-Za-z0-9_-]+` only |
| Replay state | `replayed` | Boolean |

### Excluded from every receipt

Names, emails, phone numbers, form answers, prices, tokens, authorization headers,
request and response bodies, and idempotency keys.

### User-facing copy

Controllers **preserve native Webflow surfaces**. Receipts and diagnostic IDs are **not**
written into success, error, or status copy. `decorate()` is a no-op (`return false`);
support copy is the console helper, not the page.

When PostHog's [`StartersTrack`](./posthog-track.md) is present, `record()` also forwards
the same allowlisted fields as a funnel event. That payload is no wider than the receipt.

## Covered workflows

From README Current Scripts:

- Talent Application
- Native login, signup, password, and Account Profile forms
- Build Profile
- Quiz Results save and lead-drip enrollment
- Pause / cancel request intake
- Opportunity create / edit / close / reopen
- Application apply / edit / withdraw / archive / restore
- Generate Invoice
- Project lifecycle
- Project review
- Starter Edit Profile
- Brand Build Account
- Brand / Talent login-email updates
- Starter Onboarding completion

Each controller chooses a workflow slug. Pass that slug to
`copyWorkflowDiagnostic('<workflow>')`.

## Console API

`window.StartersWorkflowDiagnostics` exposes `create`, `complete`, `record`, `format`,
`latest`, `copy`, `message`, `decorate`, and `errorCode`.

`window.copyWorkflowDiagnostic` is the support alias for `copy`. Latest receipts also
sit on `window.__startersWorkflowDiagnosticLast` and
`window.__startersWorkflowDiagnostics[<workflow>]`, and in `sessionStorage` under
`starters.workflow.diagnostic.<workflow>` plus `starters.workflow.diagnostic.latest`.

## Native-form diagnostics

Related sitewide observer: `v3/native-form-diagnostics.js`. It watches forms Memberstack
or Webflow already own. It **reads no fields**, **prevents no submit**, sends no request
of its own, and does not add diagnostic content or copy behaviour to page messages. It
loads the shared helper itself.

Install **sitewide with `defer`, before any deferred Build Profile or Starter Edit
Profile mutation asset**:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/native-form-diagnostics.js"></script>
```

`@latest` follows the newest git tag. Production may pin `@vX.Y.Z`.

Boot guard: `window.__startersNativeFormDiagnosticsBooted`. Inert outside
`the-starters-3-0.webflow.io`, `thestarters.com`, `www.thestarters.com`, plus `localhost`,
`127.0.0.1`, and `*.trycloudflare.com` for the dev tunnel.

### Observed forms

These selectors already exist on the live forms. The observer does not invent attributes.

| Form | Selector | Workflow slug |
| --- | --- | --- |
| Login | `form[data-ms-form="login"]` | `talent_login` on `/starter-login`, otherwise `brand_login` |
| Signup | `form[data-ms-form="signup"]` | `quiz_signup` on `/quiz`, otherwise `brand_signup` |
| Forgot password | `form[data-ms-form="forgot-password"]` | `password_forgot` |
| Reset password | `form[data-ms-form="reset-password"]` | `password_reset` |
| Account Profile | `form#wf-form-Account-Profile` | `account_profile` |
| Pause membership | `form#wf-form-Pause-Membership` | `pause_membership_request` |
| Cancel membership | `form#wf-form-Cancel-Membership` | `cancel_membership_request` |

It infers outcome from the wrapper's visible `[data-ms-message="success"]` /
`.w-form-done` and `[data-ms-message="error"]` / `.w-form-fail` states. Pause/cancel
**success is `request_accepted` only** — it is not proof that a membership changed.

Canonical record type is `support_request` for pause/cancel and `member_account` for the
rest.

### Mutation-call-site wrapper

`window.StartersNativeFormDiagnostics.observeMutation(workflow, request)` wraps
allowlisted profile-photo, portfolio, and company-experience operations. It records only
request outcome and HTTP status and **passes the request function through unchanged**.
[Build Profile](../v3/build-profile.md) and [Starter Edit Profile](../v3/starter-edit-profile.md)
depend on this observer loading first.

Account login, signup, password, and profile forms are pointed at this page from
[Accounts & Forms](../v3/accounts-and-forms.md); the receipt contract is not duplicated
there.

## Notes & gotchas

- **A missing helper never blocks a submit.** Controllers attempt the load, then continue
  with the workflow they already had.
- **Do not put diagnostic IDs in Designer success/error text.** The README contract keeps
  them out of user-facing messages; older copy-from-page-message behaviour is gone.
- Login/signup success can also complete from Memberstack `onAuthChange` when a logged-out
  visitor becomes a member, so a missing `.w-form-done` paint still gets a receipt.
- `window.StartersNativeFormDiagnostics` exposes `bindAll`, `init`, `observeMutation`,
  `visible`, and `workflowFor` for staging probes.
