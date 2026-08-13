---
title: "Learn CTA Gate"
source: global-embeds/learn-cta-gate/learn-cta-gate.js
sources:
  - global-embeds/learn-cta-gate/learn-cta-gate.css
---

Source: `global-embeds/learn-cta-gate/learn-cta-gate.js` (**v1.59.183**) · companion stylesheet:
`global-embeds/learn-cta-gate/learn-cta-gate.css` (same `@release`)

## What it is

Opens the sign-up gate on a Learn article once the reader has read enough, or after a short wait
on an article too short to scroll. **Memberstack decides who is gated, not this script:** the
wrapper carries `data-ms-content="!learn-access"`, and the embed reads the wrapper's *computed*
`display` and exits without writing a style when that is `none`.

Two mutually exclusive modes are chosen once at init:

| Mode | Condition | Behaviour |
| --- | --- | --- |
| Scroll | Article ≥ `data-learn-gate-chars` characters (default 2500) | A 1px out-of-flow sentinel is planted after the text node that crosses the threshold. An IntersectionObserver opens the gate when it comes on screen. **No timer runs.** |
| Timer | Article below that threshold | The sentinel is skipped. The gate opens after `data-learn-gate-delay` seconds (default 10). |

Character count rather than scroll percentage, because CMS rich text is not proportional — one
embedded video moves "34% scrolled" hundreds of characters. The count is whitespace-collapsed and
skips `<script>`, `<style>`, and `<noscript>` subtrees.

The pair is **CDN-served**, not pasted into a Webflow embed. Load the CSS in the Learn article
template **head**, then the JS with `defer` before `</body>`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/global-embeds/learn-cta-gate/learn-cta-gate.css">
```

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/global-embeds/learn-cta-gate/learn-cta-gate.js"></script>
```

Production may pin `@vX.Y.Z` instead of `@latest`.

With no `[data-learn-gate-element="wrapper"]` on the page the script returns silently — the
normal case on every page that is not a Learn article.

## File structure

```
Learn CTA Gate
├── learn-cta-gate.css   closed state; Learn article template HEAD, before JS
└── learn-cta-gate.js    opens the gate; defer before </body>
```

GSAP should already be on the template (the sheet tween). Without it the gate still opens and
closes, instantly, via inline styles.

**The CSS must not declare `transform`.** GSAP owns the sheet's off-screen start (`yPercent`). A
stylesheet `translateY(100%)` is parsed as a pixel matrix, then the tween's `yPercent` stacks on
top, so the sheet animates a full height below its resting place. The CSS sets `will-change:
transform` on the sheet only; the script clears it when the timeline finishes.

## Markup contract

Designer-authored, found by attribute only. The article body is *outside* the gate.

```html
<!-- Article body. Default selector: .content_rte.w-richtext -->
<div class="content_rte w-richtext">…CMS rich text…</div>

<section
  class="section_learn-cta-gate"
  data-learn-gate-element="wrapper"
  data-ms-content="!learn-access"
>
  <div class="learn-cta-gate_backdrop" data-learn-gate-element="backdrop"></div>
  <div class="learn-cta-gate_contents" data-learn-gate-element="content">
    <!-- sign-up CTA / form -->
    <!-- Optional close: standalone attribute, NOT a data-learn-gate-element value.
         Put it on something Memberstack can hide (its own data-ms-content). Never the backdrop. -->
    <button type="button" data-learn-gate-close-button data-ms-content>
      Close
    </button>
  </div>
</section>
```

The wrapper is `position: fixed; inset: 0; z-index: 10; display: flex; flex-direction: column;
justify-content: flex-end`. It **stays `display: flex`** so Memberstack keeps sole ownership of
`display`. A wrapper missing backdrop or content stops with a staging warning rather than opening
a half-built gate.

`data-learn-gate-element="sentinel"` is written by the script, not authored.

## xAttribute JSON

Applying the hooks with the **xAttribute** Webflow app (by xAtom)? Select the element in the
Designer and paste the matching block.

`wrapper` is the root. Options are optional; the Memberstack hook is required for gating:

```json
{
  "data-learn-gate-element": "wrapper",
  "data-ms-content": "!learn-access"
}
```

`backdrop` and `content`:

```json
{ "data-learn-gate-element": "backdrop" }
```

```json
{ "data-learn-gate-element": "content" }
```

Optional close control — its own attribute, never a fourth `data-learn-gate-element` role. Give it
a Memberstack `data-ms-content` so logged-out readers do not get a dismissible paywall:

```json
{ "data-learn-gate-close-button": "" }
```

## API

Options sit on the wrapper. A garbage, negative, or unparseable value falls back to the default
with a staging warning rather than throwing.

| Attribute | On | Values | Default | Purpose |
| --- | --- | --- | --- | --- |
| `data-learn-gate-element` | wrapper / backdrop / content | `"wrapper"`, `"backdrop"`, `"content"` | — | Marks the three required parts. `"sentinel"` is written by JS. |
| `data-ms-content` | wrapper | `"!learn-access"` | — | Memberstack gating. The script never sets this. |
| `data-learn-gate-chars` | wrapper | positive integer | `2500` | Character threshold that picks scroll vs timer. |
| `data-learn-gate-delay` | wrapper | seconds | `10` | Short-article wait. |
| `data-learn-gate-article` | wrapper | CSS selector | `.content_rte.w-richtext` | Article body to measure. Missing match falls back to the timer. |
| `data-learn-gate-ease` | wrapper | GSAP ease name | `power2.out` | Sheet ease, validated with `gsap.parseEase`. |
| `data-learn-gate-duration` | wrapper | seconds | `0.35` | Sheet travel time. |
| `data-learn-gate-fade` | wrapper | seconds | `0.2` | Backdrop fade time. |
| `data-learn-gate-lag` | wrapper | seconds | `0.3` | When the sheet starts, measured from the **start** of the backdrop fade. Shipped lag exceeds fade: dim, a beat, then the sheet. |
| `data-learn-gate-close-button` | optional control inside the wrapper | empty | — | Close control. **Not** a `data-learn-gate-element` value. Never the backdrop. |
| `data-script-initialized` | wrapper (set by JS) | `"true"` | — | Prevents a second load double-arming the same wrapper. |

`window.StartersLearnCtaGate` exposes `status()`, `reveal()`, and `dismiss()`. `dismiss()` is a
no-op on a hard gate (no visible close control) — QA an exit by authoring a close control, not by
reaching past the guard.

## Notes & gotchas

- **Load order.** CSS in the Learn article template **head**, JS with `defer` before `</body>`.
  **Fail-open:** if the CSS loads and the JS does not, the gate stays `visibility: hidden` /
  `pointer-events: none` and never opens — the article stays readable. The reverse (JS without
  CSS) is covered by `ensureClosed()`, which writes the closed state itself and warns, degrading a
  permanently open gate to a brief flash.
- **Do not add `transform` to the CSS.** GSAP parses computed transform as a pixel matrix; a CSS
  `translateY(100%)` plus `yPercent` stacks and the sheet lands off-screen. A test in the CDN repo
  asserts the stylesheet never declares `transform`.
- **Memberstack timing.** Memberstack paints gates *after* defer-time scripts. A boot-time
  `display` read sees `flex` for every reader, including one with learn-access, then later locks
  scroll on a member who can see no gate. Boot waits on `window.memberReady`, then re-checks
  computed display **before** the scroll lock. A missing or rejected `memberReady` still boots
  (fail-open): a gate that never appears is safer than trapping a paying member.
- **Computed display, not presence.** This site both removes some gate variants and merely hides
  others. Presence proves nothing. The same rule applies to the close control, and the check walks
  every ancestor up to the wrapper — `getComputedStyle` on a descendant of a `display: none`
  subtree reports that descendant's *own* display, not `none`. The walk tests `display` only,
  never `visibility` (visibility inherits, and the gate is still `visibility: hidden` at reveal).
- **Hard paywall unless a visible close control exists.** `dismissible` is resolved at reveal,
  never at boot. Backdrop-click dismisses only when that is true; the handler checks
  `event.target`, so a click on the sheet or the sign-up form cannot bubble-close. **Escape does
  not dismiss** — no keydown listener is registered.
- **Never put `data-learn-gate-close-button` on the backdrop.** The backdrop shows for every
  reader, so that would make a logged-out gate dismissible. A backdrop-only hook warns and the
  gate stays hard; a real button elsewhere still wins.
- **Once per page load.** `state.revealed` latches; triggers are torn down in the same tick. No
  cookie and no `localStorage`. A fresh load starts clean.
- **Scroll lock** matches [Modal](../modal/index.md): prefer `lenis.stop()`, else
  `document.body.style.overflow = 'hidden'`. Unlock restores `''`, not `visible`, and happens on
  click, not when the exit tween finishes.
- **`prefers-reduced-motion: reduce`** ignores the four motion attributes: no slide, 0.2s
  cross-fade, sheet not parked off-screen.
- Window events `learn-gate-shown` and `learn-gate-dismissed` (`detail` includes `trigger`,
  `chars`, `threshold`; dismissed also has `via`: `close` \| `backdrop` \| `manual`). PostHog
  `learn_gate_shown` / `learn_gate_dismissed` when present; a missing PostHog never blocks the
  gate.
- Idempotent via `window.__startersLearnCtaGateBooted` and `data-script-initialized` on the
  wrapper.
- Staging-only diagnostics (`*.webflow.io`, `localhost`, `127.0.0.1`, `*.trycloudflare.com`, or
  `window.STARTERS_DEBUG === true`). Production is silent.
