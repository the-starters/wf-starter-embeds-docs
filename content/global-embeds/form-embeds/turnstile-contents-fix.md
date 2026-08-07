---
title: "Turnstile Contents Fix"
source: global-embeds/form-embeds/turnstile-contents-fix.js
---

Source: `global-embeds/form-embeds/turnstile-contents-fix.js` (**v1.59.107**)

## What it is

Renders the Cloudflare Turnstile bot-protection widget for forms that Webflow's own runtime can
never arm, and never lets a submit leave without a fresh token.

Site-wide bot protection makes Webflow disable every submit button in a
`form[data-turnstile-sitekey]`, then render the widget only once an `IntersectionObserver`
(`rootMargin: 200px`) watching **the form element** reports it as intersecting. A form carrying
Webflow's `display-contents` class generates no box, so its rect is `0 × 0`, it never intersects,
the widget is never rendered, and the buttons are never re-enabled.

It fails worse than a dead button. The site's `wf-validate` re-enables the final step's submit
once the fields pass, so the member can click it — but the token reaches
`https://webflow.com/api/v1/form/<siteId>` **only** as the hidden `cf-turnstile-response` input the
widget injects inside the form (Webflow never copies its internal `turnstileToken` into the
payload). The POST arrives tokenless, the API rejects it, and the member sees the generic
"Oops! Something went wrong while submitting the form."

This embed does exactly what Webflow's observer step would have done, for exactly the forms where
it cannot: it appends its own `display: none` div **inside** the form, renders the widget there
with the form's own sitekey, and then performs Webflow's own step — writing `turnstileToken` onto
the live state object and re-enabling the buttons. It adds two things Webflow does not do: a
capture-phase guard that **holds** a tokenless submit until the token lands, and a **reset after
every submit** so a retry can never send a spent token.

## File structure

```
Form Embeds
└── turnstile-contents-fix.js
```

One tag in **Page or Project Settings → Custom Code → Footer Code** (or Head with `defer`). Safe
to install site-wide: with no marked form on the page it does nothing at all. Safe to load twice
(`window.__startersTurnstileContentsFixBooted`). Its only dependency is Webflow's own jQuery, and
only to read `jQuery.data(form, '.w-form')` — the store Webflow's own closures read, which has no
second copy to write to.

## Markup contract

```html
<!-- The Webflow display-contents form that bot protection can never arm. -->
<div class="w-form">
  <form
    data-starters-turnstile-fix
    data-turnstile-sitekey="0x4AAA…"
    class="display-contents"
  >
    <!-- …steps, fields, one submit button per branch tail… -->
    <button type="submit">Confirm</button>
  </form>
  <div class="w-form-done">…</div>
  <div class="w-form-fail">…</div>
</div>
```

`data-starters-turnstile-fix` is the whole contract, and presence is all that counts — any value,
including empty, means the same thing, so there is nothing to spell wrong in a value. The
`data-turnstile-sitekey` attribute is Webflow's own, written when site-wide bot protection is on.

## Opt-in only

A form is a candidate **solely** because someone marked it in the Designer. There is no detection,
no heuristic, and no "looks broken so let's help" — an unmarked form is invisible to this script
even when it is a textbook case of the bug.

That is deliberate. The script reaches into another library's private state and appends a node
inside a form it does not own, and the blast radius of getting that wrong on an unrelated form is a
broken submit on a page nobody was testing. An explicit marker makes every armed form a decision
someone made on purpose, and it means dropping the script site-wide can never change the behaviour
of a form that was already working. (An earlier revision armed every `display: contents` form it
found; the marker replaced that.)

The marker says "you may", not "you must" — the safety rails still run on top of it. A marked form
is skipped when:

| Condition | Why | Staging output |
| --- | --- | --- |
| It also carries `data-wf-no-turnstile` | Webflow's own opt-out; the two attributes contradict each other | Warn, once per form |
| It has no `data-turnstile-sitekey` value | Bot protection is not on for this form, so there is nothing to arm | Warn, once per form |
| Its computed display is not `contents` | **The no-double-arm invariant** (below) | Warn, once per form |
| It already contains a widget | Webflow armed it between the scan and the render | Info |
| Its `.w-form` wrapper no longer has `w-form-loading` | Same — Webflow already finished with it | Info |

**The no-double-arm invariant.** A form with a real display (`flex`, `block`, …) is armed by
Webflow itself as soon as it comes within 200px of the viewport, including inside a closed modal.
Arming it too would put two widgets and two `cf-turnstile-response` inputs in one payload and race
their tokens. So a marked form with a real display is skipped **and warned about** — the marker on
it is a mistake worth seeing, not an instruction to obey. Remove the marker from that form.

The re-check happens immediately before rendering, not at scan time, because Webflow may have armed
the form in between. The wait for `window.turnstile` is what makes that re-check trustworthy:
Webflow's forms module is what injects `api.js` in the first place, so by the time
`turnstile.render` exists that module has certainly finished initialising every form on the page.

## Why the widget goes inside the form, hidden

**Inside**, because the payload carries the token only as that injected `cf-turnstile-response`
field and Webflow collects fields with `form.find(':input…')` — a widget rendered anywhere else is
invisible to the POST no matter how good the token is.

**Hidden**, because Turnstile renders and delivers a token perfectly well inside a `display: none`
container (measured: token in ~2s), which is what lets a form sitting in a closed modal panel be
armed at page load rather than at open time.

The form's own `display` is never touched. Setting these forms to `block` visually destroys the
modal (leaked fields, misplaced buttons), and it would be a styling fix for a measurement bug.

## Submit hold

The guard listens in the **capture** phase on the form, so it runs before Webflow's delegated
handler on `document` and `stopImmediatePropagation()` can actually stop it.

- **With a token**: the submit passes through untouched, then resets on the next task. Webflow
  builds its whole payload synchronously inside its handler, so by the time that timeout runs the
  token is already in the POST body and the widget is free to fetch the next one.
- **Without one**: `preventDefault()` + `stopImmediatePropagation()`, show the button as working,
  and re-submit as soon as the token lands (within **10s**, polled every 100ms). If it never lands,
  the button is handed back — submitting tokenless would only reproduce the "Oops" this embed
  exists to remove.

The waiting state speaks both vocabularies the site already has: Webflow's `data-wait` label swap
(only on `input[type="submit"]`, where the value *is* the visible label) and the
`[data-opp-element="loading-button"]` / `data-opp-loading` spinner contract used by the
account-settings buttons, whose `<button>` is an empty overlay with its label in a sibling div.

Ending a hold restores the **snapshot** it took, never a blanket enable: these forms carry one
submit button per branch tail (see
[Step Flow → Shared tail steps](../step-flow/index.mdx)), and the buttons the member did not click
are disabled on purpose by `wf-validate` and the flow logic.

The re-submit prefers `requestSubmit()` — it runs native constraint validation and fires a real,
cancelable submit event. The synthetic `dispatchEvent` fallback covers browsers without it, and the
case where the original event was itself synthetic (re-running validation could refuse a submit the
page had already accepted).

## Reset after submit

Turnstile tokens are **single-use**: a second submit carrying the first token is rejected exactly
like a submit carrying none, which is the "it failed, let me try again" path members actually take.
So every reset clears `turnstileToken` first, which is what makes the guard *hold* that retry
instead of spending it.

| Reason | Trigger |
| --- | --- |
| `post-submit` | A submit passed through the guard with a token |
| `post-resubmit` | A held submit was re-submitted after its token landed |
| `form outcome` | The belt: a `.w-form-done` / `.w-form-fail` sibling changed `style` or `class` |
| `error-retry` | The widget's `error-callback` fired; retried up to **2** times, 2s apart |
| `manual` | `window.StartersTurnstileContentsFix.reset()` |

The outcome belt exists because Webflow's completion handler flips those two elements with jQuery
`.toggle()` — an inline `display` write — so a MutationObserver on them is the one signal that a
submit attempt has come back, including an attempt this script never saw as an event. It resets
only when nothing is already pending, so the normal path costs no second challenge.

On a widget error the form is left in Webflow's own error posture: `turnstileToken` is nulled and
the buttons are disabled. The guard would stop a tokenless submit anyway; a disabled button is the
honest version of the same answer.

## API

### Attributes

| Attribute | On | Written by | Purpose |
| --- | --- | --- | --- |
| `data-starters-turnstile-fix` | `<form>` | you | Arm this form. Presence is the contract; the value is ignored. |
| `data-turnstile-sitekey` | `<form>` | Webflow | The sitekey the widget renders with. Required. |
| `data-wf-no-turnstile` | `<form>` | you | Webflow's own opt-out; honoured the same way. Contradicts the marker. |
| `data-starters-turnstile-armed` | `<form>` | JS | `"true"` on a form this script armed, `"skipped"` on a marked form it deliberately left to Webflow. |
| `data-starters-turnstile-host` | hidden div | JS | Marks the `display: none` div holding the widget. |
| `data-wait` | `input[type="submit"]` | you | Label swapped in while a submit is held. |
| `data-opp-loading` | `[data-opp-element="loading-button"]` | JS | Set `"true"` while a submit is held; the previous value is restored. |

### JS

`window.StartersTurnstileContentsFix` — for console checks on staging.

```js
// Per-form state: widget id, token count, token/field fingerprints, flags.
StartersTurnstileContentsFix.status()

// Re-scan the page and arm any newly eligible marked forms. Returns the count armed.
StartersTurnstileContentsFix.refresh()

// Force a fresh challenge. No argument resets every armed form; a form label
// (id, name, or data-name) resets just that one. Returns the number reset.
StartersTurnstileContentsFix.reset()
StartersTurnstileContentsFix.reset("cancel-membership-form")

// Also exposed: .release, .stagingHost(hostname), .diagnosticsEnabled()
```

Tokens are never printed in full — `status()` fingerprints them as the first 12 characters plus a
length.

### Constants (from source)

| Constant | Value | Purpose |
| --- | --- | --- |
| `TURNSTILE_WAIT_MS` | `20000` | How long to wait for `window.turnstile` before standing down. |
| `TOKEN_WAIT_MS` | `10000` | How long a held submit waits for a token before giving the button back. |
| `ERROR_RETRY_MS` / `ERROR_RETRY_MAX` | `2000` / `2` | Bounded retry after a widget error. |

## Notes & gotchas

- **The wait for `window.turnstile` is a poll, not a listener.** Webflow injects `api.js` on
  `requestIdleCallback`, which on a busy dashboard can land seconds after `DOMContentLoaded`, and
  this script may boot either before or after that load. Polling covers both without depending on
  Webflow's private `TURNSTILE_LOADED` jQuery event.
- **Both waits use wall clock, not tick counts.** A background or throttled tab clamps
  `setInterval` to roughly 1/s, which would silently stretch the 10s hold budget to 100s and leave a
  member staring at a spinner on a form they never left.
- **Widget presence is checked four ways** — our host div, the `cf-turnstile-response` field, a
  `[id^="cf-chl-widget-"]` element, and a `challenges.cloudflare.com` iframe — because they appear
  at different moments. Checking the response field alone would call a rendered-but-unsolved widget
  "absent" and render a second one on top of it.
- **The state object is the only token source that counts, including when it is empty.** A reset
  clears it deliberately; falling back to the DOM input at that moment would read the spent token
  still sitting there and wave a doomed submit through. The DOM fallback only applies on a page with
  no usable jQuery.
- **Render options are Webflow's own and nothing else** (sitekey plus the two callbacks). Size and
  appearance belong to the sitekey's Cloudflare widget type; a mismatched option here would be a
  second source of truth for how the challenge behaves.
- **The token callback also fires on Turnstile's own refresh** of an expiring token, so it always
  overwrites rather than filling in only the first time.
- **Staging-only diagnostics.** Console output is gated to `*.webflow.io`, `localhost`,
  `127.0.0.1`, and `*.trycloudflare.com` (host patterns are anchored, so `notwebflow.io` cannot read
  as staging), or `window.STARTERS_DEBUG === true`. Production is silent. Selection warnings fire
  **once per form for the life of the page**, so a mistake that survives a `refresh()` does not
  repeat until the console is useless. Unmarked forms are never mentioned at all.
- Related: [Disabler](./disabler.md) for attribute-driven field disabling, and
  [Step Flow](../step-flow/index.mdx) for the multi-step forms these marked forms usually are.
