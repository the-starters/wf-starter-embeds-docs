---
title: "AI Recruiter"
source: v3/ai-recruiter.js
---

Source: `v3/ai-recruiter.js`

## What it is

The lower-right, **role-gated** V3 AI Recruiter controller. **Webflow owns all visible
markup.** This file binds only to the `data-ai-recruiter` contract and sends authenticated
requests through the **Xano V3** boundary. It never calls n8n, Supabase, or OpenAI from
the browser.

Only an authenticated member on a **brand-paid** plan (or the Test Brand plan on staging)
can interact. Anyone else is ineligible: boot returns without `init`, and the authored
root stays hidden. The free Brand plan exists (`pln_free-plan-f6kn0dxz`) but cannot
interact — those members see the upgrade state with request controls disabled and hidden.

This file has **no `@release` header**. Confirm the served URL, not a release property.

Authoritative access, monitoring, and rollback notes live in the repo's
`v3/AI-RECRUITER-WIRING.md`. The Designer tree is `v3/ai-recruiter-webflow.html` — rebuild
that as native elements; **do not** install it as an HTML embed and **do not** let the
controller generate markup.

## Install

Keep **one root per page**. Load with `defer` **after** Memberstack and the authenticated
Xano token bridge (`window.getXanoAuthToken` or `getMemberCookie` + trade-token):

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/ai-recruiter.js"></script>
```

`@latest` follows the newest git tag. Production may pin `@vX.Y.Z` so a later release
cannot change the page without you.

The IIFE is itself the boot guard. `window.StartersAIRecruiter` exposes `boot`,
`roleForMember`, `activePlanIds`, `normalizeResponse`, and `safeText` for staging probes.

## Who can use it

| Plan | Plan ID | Role | Panel |
| --- | --- | --- | --- |
| Brand paid | `pln_new-paid-plan-463h04ph` | `brand-paid` | Interactive after consent |
| Test Brand | `pln_dorxata-test-brand-plan-777r02pa` | `brand-paid` on `the-starters-3-0.webflow.io` only; **ineligible** on production hosts | Staging canary / production deny |
| Brand free | `pln_free-plan-f6kn0dxz` | `brand-free` | Upgrade state; controls disabled and hidden |
| Anything else, including logged out | — | `ineligible` | Root stays hidden; no init |

Active plan connections are those with `active === true` or `status === 'ACTIVE'`. Paid
wins over Test Brand when both are present.

## Markup contract

Author one `[data-ai-recruiter="root"]` in the Designer. `initRoot` requires
**launcher**, **panel**, **form**, and **input** inside it; any of those missing skips
that root.

```html
<div data-ai-recruiter="root" hidden>
  <button type="button" data-ai-recruiter="launcher" aria-expanded="false">Ask the recruiter</button>
  <div data-ai-recruiter="panel" hidden>
    <button type="button" data-ai-recruiter="close">Close</button>
    <button type="button" data-ai-recruiter="minimize">Minimize</button>
    <button type="button" data-ai-recruiter="start-over">Start over</button>

    <div data-ai-recruiter-state="consent">
      <button type="button" data-ai-recruiter="consent" role="checkbox" aria-checked="false">
        <span data-ai-recruiter="consent-indicator">☐</span>
        I agree
      </button>
      <button type="button" data-ai-recruiter="consent-continue">Continue</button>
    </div>
    <div data-ai-recruiter-state="upgrade" hidden>Upgrade to search candidates</div>
    <div data-ai-recruiter-state="ready" hidden></div>

    <div data-ai-recruiter="messages"></div>
    <div data-ai-recruiter="message-template" hidden>
      <p data-ai-recruiter-field="message"></p>
    </div>
    <div data-ai-recruiter="candidate-list"></div>
    <div data-ai-recruiter="candidate-template" hidden>
      <p data-ai-recruiter-field="display-name"></p>
      <a data-ai-recruiter-field="profile-link" href="#"></a>
    </div>

    <p data-ai-recruiter="status"></p>
    <button type="button" data-ai-recruiter="prompt" data-ai-recruiter-prompt="Find a product designer in London">
      Find a product designer in London
    </button>
    <form data-ai-recruiter="form">
      <textarea data-ai-recruiter="input" maxlength="2000"></textarea>
      <button type="submit" data-ai-recruiter="submit">Send</button>
    </form>
    <button type="button" data-ai-recruiter="helpful">Helpful</button>
  </div>
</div>
```

The skeleton above is the attribute contract from the script, not a visual spec. Copy,
layout, and responsive styles stay in the Designer (see `ai-recruiter-webflow.html`).

Consent is a **native button** with `role="checkbox"`. The controller owns `aria-checked`
and writes `☑` / `☐` into `[data-ai-recruiter="consent-indicator"]` so the control can be
built without a generated checkbox.

## xAttribute JSON

Root:

```json
{ "data-ai-recruiter": "root" }
```

Launcher, a state block, and the message text slot:

```json
{ "data-ai-recruiter": "launcher" }
```

```json
{ "data-ai-recruiter-state": "consent" }
```

```json
{ "data-ai-recruiter-field": "message" }
```

## API

| Attribute | On | Values | Purpose |
| --- | --- | --- | --- |
| `data-ai-recruiter` | named hook | `root`, `launcher`, `panel`, `close`, `minimize`, `start-over`, `form`, `input`, `submit`, `messages`, `message-template`, `candidate-template`, `candidate-list`, `status`, `consent`, `consent-indicator`, `consent-continue`, `prompt`, `helpful` | Binding selectors. `submit` is optional; the other launcher/panel/form/input hooks are required. |
| `data-ai-recruiter-field` | message or candidate slot | `message` on the message template; on a candidate card: `display-name`, `headline`, `match-reason`, `location`, `availability`, `rate`, `profile-link` | Text (or `href` on `profile-link`) the controller writes after a reply |
| `data-ai-recruiter-state` | state blocks inside the root | `consent`, `ready`, `upgrade`, `thinking`, `rate-limited`, `expired`, `retry`, `error`, `offline`, `unavailable` | The controller sets `hidden` so only the matching block is visible, and mirrors the name onto `root.dataset.aiRecruiterState` |
| `data-ai-recruiter-prompt` | a `prompt` hook | the message to send | Click sends this string; otherwise the control's `textContent` |
| `data-ai-recruiter-helpful` | a `helpful` hook | omit, or `"false"` | Click reports helpful unless the value is `"false"` |
| `data-ai-recruiter-message` | cloned message nodes | `user`, `assistant` | Written by JS on clones; not an authoring hook |
| `data-ai-recruiter-role` | the root | `brand-paid`, `brand-free`, `unavailable` | Written by JS |

`MAX_MESSAGE_LENGTH` is **2000**. User input, prompt clicks, and assistant `message` text
are sliced to that. Consent version is **`2026-08-11`**. Session state lives in
`sessionStorage` under `ts:ai-recruiter:v3:session` and is reused only when `member_id`
and `consent_version` still match.

At most three `top_candidates` with a positive `freelancer_v3_id` are cloned from the
candidate template. Profile links go to `/hire/<slug>`. Message timeout is 35 seconds.

Authenticated POSTs (Bearer from the trade-token / `getXanoAuthToken` bridge):

- `ai-recruiter/message`
- `ai-recruiter/track-helpful`
- `ai-recruiter/track-click`
- `ai-recruiter/session-reset`

## Notes & gotchas

- **Ineligible members never init.** Boot hides every root, resolves the member, and
  returns if the role is `ineligible`, leaving the root hidden. A Memberstack timeout
  shows `unavailable` instead.
- **Free Brand is not ineligible.** Those members get `upgrade`: the root is shown, but
  form, input, submit, start-over, and helpful controls are disabled and hidden.
- **Test Brand is staging-only.** On `thestarters.com` / `www.thestarters.com` that plan
  is ineligible, matching the wiring doc.
- Escape on the panel closes it; close and minimize share that path. Start-over aborts an
  in-flight request, clears messages and candidates, keeps consent, and calls
  `session-reset`. A failed reset still reports; it does not stop the conversation.
- Monitoring (when PostHog is present): `ai_recruiter_request` and
  `ai_recruiter_failure`, plus matching `starters:ai-recruiter-request` /
  `starters:ai-recruiter-failure` window events. Payloads are operation, outcome, HTTP
  status, and Xano `trace_id` only — no member IDs, prompts, candidates, tokens, or
  response text.
- An auth change to a different member reloads the page.
- Designer preview and local unit tests do not satisfy the wiring release gate; a
  published page with the native root and a pinned script does.
