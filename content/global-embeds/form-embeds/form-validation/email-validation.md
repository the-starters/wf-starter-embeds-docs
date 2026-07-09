---
title: "Email Validation"
---

Source: Webflow — `Global Embeds / Form Embeds / Form Validation / Email Validate - JS`

## What it is

Standalone email-format validation for Webflow. On `DOMContentLoaded` the script inits every
`input[type="email"]` on the page — plus any `input[data-validate-email]`, for fields the Designer
forced to `type="text"` — with no wrapper or configuration required. Invalid fields get
`data-validate-field-invalid="true"`, which [Form Validation](./)'s CSS renders as a red outline.

The outline is deliberately quiet: it appears only after the field is **touched** (blur or `change`),
or when the user presses a blocked Continue button — never on page load and never on the first
keystrokes. Once a field is touched, every keystroke re-validates, so fixing the address clears the
outline immediately.

The script also seeds a tiny plugin registry at `window.lumos.validateForm`
(`registerFieldValidator` / `registerGroupInitHook`) and registers its email check into it, so a
separate form-gating script can reuse the same validity logic. Email validation itself works with no
other script loaded.

## Markup contract

Nothing but the input:

```html
<input type="email" name="email" placeholder="you@company.com">
```

Text input styled as email in the Designer:

```html
<input type="text" data-validate-email name="email" placeholder="you@company.com">
```

Skip a field:

```html
<input type="email" data-validate-ignore name="optional-email">
```

Blocked-Continue integration — when a press lands on a button wrapper carrying both
`data-validate-element="button"` and `data-validate-disabled` (the latter is set by a gating
script), errors are force-shown on every email field in the matching group:

```html
<div data-validate-group="step-1">
  <input type="email" name="email" placeholder="Work email">
</div>

<div data-validate-element="button" data-validate-group="step-1" data-validate-disabled>
  <button type="button">Continue</button>
</div>
```

## API

### Author these

| Attribute | Put on | What it does |
| --- | --- | --- |
| `type="email"` | input | Auto-detected on load. Validity uses the browser's built-in `checkValidity()`. |
| `data-validate-email` | text input | Opt-in for fields that can't be `type="email"`. Validity uses a simple regex (one `@`, a dot in the domain, no whitespace). |
| `data-validate-ignore` | input | Excluded from email validation entirely (disabled inputs are excluded too). |
| `data-validate-group` | field container + button wrapper | Shared id linking a step's fields to its Continue control; scopes the force-show on a blocked press. If the blocked button has no matching field group, the force-show scans the whole document. |
| `data-validate-element="button"` | button wrapper | Marks the wrapper as a Continue control the script watches for blocked presses. |

### Set by the script (style/debug only)

| Attribute | Put on | What it does |
| --- | --- | --- |
| `data-validate-field-invalid="true"` | input | Present while the field is invalid **and** allowed to show it. The CSS red-outline hook. |
| `data-validate-touched="true"` | input | Set on blur/`change`; gates when the invalid state may appear. |
| `data-validate-email-inited` (dataset) | input | Idempotency guard — listeners bind once per input. |

### Expected from a gating script (observed, not set)

| Attribute | Put on | What it does |
| --- | --- | --- |
| `data-validate-disabled` | button wrapper | While present, a `pointerdown` on the wrapper (captured before click handlers) force-shows email errors in the group. |

### JS registry

| Member | What it does |
| --- | --- |
| `window.lumos.validateForm` | Created if absent: `{ fieldValidators: [], groupInitHooks: [], registerFieldValidator(fn), registerGroupInitHook(fn) }`. |
| registered field validator | The script registers one: given a field, returns `true`/`false` for email fields and `undefined` for anything else — so a gating script can ask "is this field valid?" without duplicating the email rules. |

## File structure

```
Form Validation
└── Email Validate - JS
```

Ships no styles of its own — `Form Validation - CSS` provides the red outline. No attributes
are required for plain email fields: every `type="email"` input on the site validates.

## Notes & gotchas

- **An empty field counts as invalid.** Validity requires a non-empty trimmed value that passes the
  format check, so blurring an untouched-but-empty email field shows the red outline. Use
  `data-validate-ignore` on genuinely optional email fields if that's unwanted.
- **Two different validators.** `type="email"` inputs defer to the browser's `checkValidity()`
  (which also honors native constraints on the element); `data-validate-email` text inputs use the
  script's regex. Edge-case addresses can pass one and fail the other.
- **Outline timing:** `input` events re-validate only after the field is touched — before the first
  blur/`change`, typing never raises an outline. After touch, re-validation runs on every keystroke
  (both clearing and raising).
- The blocked-Continue listener runs on `pointerdown` in the **capture** phase, so errors flash even
  when the gating script swallows the click. It only fires while `data-validate-disabled` is present
  on the wrapper — a script such as a step-flow gate has to manage that attribute; this embed never
  sets it.
- Init runs once on `DOMContentLoaded`. Load the file with `defer` (not injected after the page has
  loaded), and note that fields added to the DOM later are not picked up automatically — there is no
  mutation observer or re-init event in this script.
- Idempotent per input via `data-validate-email-inited`; safe if the embed is pasted twice. The
  `window.lumos.validateForm` registry is shared and created with nullish assignment, so load order
  relative to other `lumos` scripts doesn't matter.
- Modern-syntax script (optional chaining, nullish assignment) — it does not run on legacy browsers,
  and it needs no jQuery.
