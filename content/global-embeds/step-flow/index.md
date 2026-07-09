---
title: "Step Flow"
---

Source: Webflow — `Global Embeds / Step Flow`

## What it is

Attribute-driven multi-step form flow engine for Webflow (`step-flow.js` + `step-flow.css`). It
handles step navigation inside every `[data-form-flow]` root on the page: **linear** wizards
(step-1 → step-2 → …), **multi-sub** branching flows (a radio gate on step-1 opens one of several
subflows), per-step footer button groups, a hub/reset-panel pattern, and opt-in per-step
validation that disables Continue until the current step's required fields pass.

The engine runs on `DOMContentLoaded`, is idempotent (init guards on every root), and only ever
toggles visibility — steps and footers are plain Webflow DOM. Clicks are resolved by **explicit
opt-in only**: a control navigates the flow when it carries a form-flow attribute
(`data-form-flow-action`, `data-form-flow-target`, or `data-form-flow-trigger`) or is a button
inside a `data-form-flow-button-group`. `data-button-style` is styling, not consent to navigate.

A registry is exposed at `window.lumos.formFlow` for programmatic reset and navigation. The
companion [Panel Nav Flow](/global-embeds/step-flow/panel-nav-flow) script swaps whole panels
(hub ↔ flow); this script resets a flow to step-1 whenever a `data-panel-nav-target` trigger
opens it.

`step-flow.css` provides three things: the runtime baseline (button groups and child flows hidden
until JS shows them), the red invalid-field outline for validation, and a large set of
`.wf-design-mode` rules so step-1 previews correctly inside the Webflow Designer without touching
the published render.

## File structure

```
Step Flow
├── Step Flow - CSS
└── Step Flow - JS
```

The CSS must be on the page for the pre-hydration hiding and the validation outline to work.
If you also use [Panel Nav Flow](/global-embeds/step-flow/panel-nav-flow), load that script
alongside it.

## Markup contract

Linear flow — content steps in DOM order plus one shared footer with a button group per step:

```html
<div data-form-flow="pause-membership" data-panel-nav-display="contents">
  <div data-form-flow-layout>
    <div data-form-flow-element="step-1">Step 1 content</div>
    <div data-form-flow-element="step-2">Step 2 content</div>

    <div data-form-flow-footer>
      <div data-form-flow-button-group="step-1" data-form-flow-button-group-display="flex">
        <button type="button" data-form-flow-action="back">Go Back</button>
        <button type="button" data-form-flow-action="next" data-button-style="primary">Continue</button>
      </div>
      <div data-form-flow-button-group="step-2" data-form-flow-button-group-display="flex">
        <button type="button" data-form-flow-action="reset">Done</button>
      </div>
    </div>
  </div>
</div>
```

Multi-sub flow — `data-form-flow-type="multi-sub"`, a radio gate in a `data-form-flow-entry`
wrapper, and one `data-form-flow-subflow` wrapper per branch (each with its own steps and footer):

```html
<div data-form-flow="cancel-membership" data-form-flow-type="multi-sub">
  <div data-form-flow-entry data-form-flow-element="step-1">
    <div data-form-flow-element="radio-list">
      <label data-form-flow-value="step-2a"><input type="radio" name="reason"> Too expensive</label>
      <label data-form-flow-value="step-2b"><input type="radio" name="reason"> Missing a feature</label>
    </div>
    <div data-form-flow-button-group="step-1">
      <button type="button" data-form-flow-action="next" data-button-style="primary">Continue</button>
    </div>
  </div>

  <div data-form-flow-subflow data-form-flow-element="step-2a">
    <div data-form-flow-element="step-2a">Discount offer…</div>
    <div data-form-flow-footer>
      <div data-form-flow-button-group="step-2a">
        <button type="button" data-form-flow-action="back">Go Back</button>
        <button type="button" data-form-flow-action="reset">Keep my membership</button>
      </div>
    </div>
  </div>
  <!-- repeat for step-2b -->
</div>
```

Optional hub — several flows inside `data-form-flow="main-container"` with a
`reset-panel` shown on load (panel switching itself needs Panel Nav Flow):

```html
<div data-panel-parent>
  <div data-form-flow="main-container">
    <div data-form-flow-element="reset-panel">
      <button data-panel-nav-target="pause-membership">Pause membership</button>
      <button data-panel-nav-target="cancel-membership">Cancel membership</button>
    </div>
    <div data-form-flow="pause-membership">…linear flow…</div>
    <div data-form-flow="cancel-membership" data-form-flow-type="multi-sub">…branching flow…</div>
  </div>
</div>
```

Notes on the contract:

- Step ids must start with `step-` (`step-1`, `step-2a/step-3`, …). Every flow starts on
  `step-1`. The engine auto-adds `data-form-flow-step` to `data-form-flow-element="step-*"`
  panels during hydration (subflow and entry wrappers are skipped), so you don't add it yourself.
- Each step id needs a matching `data-form-flow-button-group` in scope (entry wrapper for a
  multi-sub step-1, the subflow for branch steps, otherwise the shared footer or layout scope);
  a missing group logs a `console.warn`.
- The radio label's `data-form-flow-value` must exactly match the subflow's
  `data-form-flow-element` id.

## API

### Actions

A click is resolved in priority order: explicit `data-form-flow-action` → label / button-type
heuristics → `data-button-style`. Set the action explicitly when in doubt.

| Action | How it's inferred | What it does |
| --- | --- | --- |
| `next` | `data-form-flow-action="next"`, a `type="submit"` button, `data-button-style="primary"` or `"danger"`, or the final fallback | Next step in DOM order; on a multi-sub step-1, enters the branch chosen by the checked radio (or by `data-form-flow-target`). |
| `back` | `data-form-flow-action="back"` (alias `prev` is normalized to `back`) or label "go back" | Pops the history stack; from a subflow's first step, returns to step-1. |
| `branch` | `data-form-flow-action="branch"`, or any control with `data-form-flow-target` (including `data-button-style="tertiary"` + target) | Jumps to `data-form-flow-target` with a history push. Warns if the target is missing. |
| `reset` | `data-form-flow-action="reset"` or label matching "nevermind" / "keep my membership" (with no target) | Returns to the hub `reset-panel` if inside `main-container` (resetting all child flows), else resets this flow to step-1. |
| `close` | `data-form-flow-action="close"`, a `data-settings-panel-close` control, or label matching "back to account" | Closes the enclosing settings panel via `window.lumos.settingsPanel` or by clicking its close trigger. |

Controls inside `data-panel-nav-back-button` are ignored (Panel Nav Flow owns them), and tab UI
(`role="tab"`, `.tab_button_list`, `role="tablist"`, `data-tab`) inside a flow is left to the tab
script unless it carries an explicit form-flow attribute.

### Structure attributes

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-form-flow="your-id"` | Flow root | Unique flow id; registers the flow in `window.lumos.formFlow.list`. |
| `data-form-flow="main-container"` | Outer wrapper | Hub container: hides child flows on load, shows `reset-panel`, exposes the container API. |
| `data-form-flow-id` | Main container | Optional registry key for `window.lumos.formFlow.containers`; defaults to `main-container`. |
| `data-form-flow-element="reset-panel"` | Hub panel | The landing panel shown on load and after a `reset`. |
| `data-form-flow-type="multi-sub"` | Flow root | Enables the radio gate + subflow branching. Omit for a linear wizard. |
| `data-form-flow-element="step-*"` | Step / subflow | Step or branch id. Content steps are auto-tagged with `data-form-flow-step`. |
| `data-form-flow-entry` | Step-1 wrapper | Marks the multi-sub entry (radio gate) wrapper; shown with `display: contents`. |
| `data-form-flow-subflow` | Branch wrapper | Marks a branch container (e.g. `step-2a`); shown with `display: contents`. |
| `data-form-flow-element="radio-list"` | Radio container | Wraps the branch radios on a multi-sub step-1. |
| `data-form-flow-value` | Radio label (or ancestor) | Maps the checked radio to its subflow id. |
| `data-form-flow-layout` | Inner wrapper | Optional scope for a linear flow's steps and footer. |
| `data-form-flow-footer` | Footer wrapper | Shared footer for linear flows (subflows carry their own). |
| `data-form-flow-button-group="step-*"` | Button row | Shown only while its step is active; all groups hidden otherwise. |
| `data-form-flow-button-group-display` | Button row | Display when shown: `block`, `flex` (default), `grid`, `inline-flex`, `inline-block`, `contents`. |
| `data-form-flow-action` | Button / wrapper | Explicit action: `next`, `back` (or `prev`), `branch`, `reset`, `close`. |
| `data-form-flow-target` | Button / wrapper | Step id to jump to (or subflow id for `next` on a multi-sub step-1). |
| `data-form-flow-trigger` | Any control | Explicit opt-in so a non-button element is treated as a flow control. |
| `data-form-flow-label` | Button / wrapper | Overrides the text used for label-based action inference. |
| `data-form-flow-display` | Flow root / `reset-panel` | Display when shown; checked after `data-panel-nav-display`, before stored/computed display. |
| `data-form-flow-preview-path` | Flow root (multi-sub) | Reset target like `step-2a/step-3` — the flow resets into that subflow/step instead of step-1 (Designer preview aid). |

### Validation (opt-in)

Active only when the flow root has `data-form-flow-validate="true"` (case-insensitive `true`).
Each time a step shows or a field changes, the engine re-validates the **visible step only** and
enables/disables that step's Continue control(s).

| Attribute | Set by | Purpose |
| --- | --- | --- |
| `data-form-flow-validate="true"` | you (flow root) | Turns validation on for the flow. |
| `required` / `aria-required="true"` | you (field) | Marks a field as gating. Format rules (email, pattern, min/max) run via native `checkValidity()`. |
| `data-validate-ignore` | you (field or wrapper) | Exempts the field — or everything inside the wrapper — from validation. |
| `data-form-flow-field-invalid="true"` | JS (input) | Written on a failing input after it was touched or after a blocked Continue; the CSS hook for the red outline. |
| `data-form-flow-validate-touched` | JS (input) | Marks a field as interacted-with so errors don't appear on load. |
| `data-form-flow-disabled` | JS (Continue wrapper) | Marks the control validation-disabled; drives the click guard. |
| `data-button-theme="disabled"` | JS (Continue wrapper) | Applied to the `.button_main-wrap` while disabled; the original theme is cached and restored (fallback `black`). |

Validation rules found in the code:

- Disabled fields, hidden fields (`display: none`, `visibility: hidden`, `hidden`,
  `.w-condition-invisible` — checked up to the step root), and `hidden`/`submit`/`button` inputs
  never gate.
- Radio groups with a `name` pass when **any** enabled, non-ignored radio in the group is checked.
  Checkbox and radio checks also honor Webflow's custom `.w--redirected-checked` visual state
  (watched via a MutationObserver, since Webflow toggles a class instead of firing `input`).
- Optional inputs that the user filled must still pass format checks (e.g. a non-required
  `type="email"` with a malformed value blocks the step).
- The Continue control is disabled with `aria-disabled` and a marker attribute, **not** native
  `disabled`, so clicking it still fires and force-reveals the field errors. This guard runs
  before the terminal-submit fall-through, so an invalid final step can't submit.

### JS API

```js
// Reset a flow to step-1 (or its preview path)
window.lumos.formFlow.reset("cancel-membership")

// Jump to a step without pushing history; 3rd arg = subflow id for multi-sub flows
window.lumos.formFlow.goTo("cancel-membership", "step-4", "step-2a")

// Show the hub and reset every child flow inside main-container
window.lumos.formFlow.showResetPanel()
```

`window.lumos.formFlow.list` maps flow ids to `{ reset, goTo, el }`;
`window.lumos.formFlow.containers` maps container keys to the container API
(`showResetPanel`, `activateFlowRoot`, `hideAllFlowRoots`, `resetPanel`, `flowRoots`).

### CSS (`step-flow.css`)

| Rule group | What it does |
| --- | --- |
| Button group + child-flow hiding | Hides all `data-form-flow-button-group` rows and all direct child flows of `main-container` until JS shows the active ones (prevents a flash before hydration). |
| Invalid field outline | Red `2px` outline + border on `input[data-form-flow-field-invalid="true"]` — required for validation error styling. |
| `.wf-design-mode` preview rules | Designer-only: reveal a flow root marked `data-preview="true-contents"` (honoring its `data-panel-nav-display`), hide subflows and all steps except step-1, show step-1 with its `data-form-flow-stored-display`, show only the step-1 button group (honoring `data-form-flow-button-group-display`), show the shared footer and the `reset-panel` hub. Never affects the published site. |

## Notes & gotchas

- **Terminal submit passes through.** A real `type="submit"` button with no explicit form-flow
  attribute and no next step (the final Confirm) is *not* `preventDefault()`-ed — it falls through
  to Webflow's native form submit. Make the last submitting button a genuine submit, not
  `data-form-flow-action="next"`.
- **Explicit opt-in.** A styled link or button with only `data-button-style` never navigates the
  flow; give it an action/target/trigger attribute or put the button inside a
  `data-form-flow-button-group`.
- **Accessibility.** Hidden steps, groups, and flows get `aria-hidden="true"`; shown elements get
  `aria-hidden="false"`. Validation-disabled Continue controls get `aria-disabled="true"` on both
  the wrapper and the inner button/link. There is no focus management on step change — focus stays
  where it was.
- **Idempotency.** Flow roots guard with `data-script-initialized`, the main container with
  `data-form-flow-container-initialized`, so re-running the embed won't double-bind.
- **Display caching.** The first computed `display` of each shown element is cached in
  `data-form-flow-stored-display` and reused; set `data-panel-nav-display` /
  `data-form-flow-display` on flow roots (and `data-form-flow-button-group-display` on button
  rows) when the default (`block` / `flex`) is wrong. Valid values: `block`, `flex`, `grid`,
  `inline-flex`, `inline-block`, `contents`.
- **Validation styling is inputs-only.** Only `input` elements receive
  `data-form-flow-field-invalid`; selects and textareas gate Continue but never get the red
  outline. The disabled-button theming expects the Continue to sit in a `.button_main-wrap`
  (with a `button`, `a.clickable_link`, or `.clickable_btn` inside).
- **Multi-sub step-1 gate.** With validation on, Continue on the radio gate is only disabled by
  the step's own required fields; picking no branch is caught at click time with a `console.warn`,
  not a disabled button.
- **Designer preview.** `data-preview="true-contents"` on a flow root plus the CSS makes step-1
  previewable in the Designer; `data-form-flow-preview-path` (e.g. `step-2a/step-3`) makes a
  multi-sub flow reset into a deep step — note this also applies at runtime whenever the flow
  resets, so remove it before shipping unless that is intended.
- **Debugging.** Misconfigurations (missing step, missing button group, unknown subflow, missing
  branch target, no radio selected) log `console.warn` with the flow id — check the console first.
- Clicking any `data-panel-nav-target` trigger resets the targeted flow to step-1 (document-level
  listener), so a flow reopened from a hub always starts fresh.
