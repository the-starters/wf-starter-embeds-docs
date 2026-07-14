---
title: "Form Validation"
source: global-embeds/form-embeds/form-validation
---

Source: Webflow, `Global Embeds / Form Embeds / Form Validation`

## What it is

The styling layer for the form-validation embeds: one small stylesheet (`form-validation.css`) that
supplies the visual states the validation scripts toggle: the red outline on invalid email fields,
the locked look for disabled submit/Continue buttons, plus a few form-polish rules (checked-radio
outline, custom select chevron, password eye-icon swap).

The folder also ships [Email Validation](./email-validation.md) (`email-validation.js`), which does the
actual email checking and sets the attributes this CSS styles.

> **Known issue in the current source:** `form-validation.js` in this folder is a byte-identical copy
> of `datepicker.js`; the datepicker script was copied in under the wrong name. It contains no form
> validation logic (loading it just runs a second, harmless copy of the datepicker embed). Until that
> file is replaced, the JS behavior on this page is limited to what `email-validation.js` provides;
> the group/Continue-button gating attributes below are documented as the surface this CSS and the
> email script target.

## File structure

```
Form Validation
├── Form Validation - JS
├── Form Validation v2 - JS
├── Email Validate - JS
└── Form Validation - CSS
```

Use `Email Validate - JS` for the email checking; skip `Form Validation - JS` until the
wrong-file copy noted above is fixed; as shipped it only duplicates the datepicker embed.

## Markup contract

The email outline needs nothing but an email input plus the CSS and the email script:

```html
<input type="email" name="email" placeholder="you@company.com">
<!-- or, when the Designer forces a text input: -->
<input type="text" data-validate-email name="email" placeholder="you@company.com">
```

Disabled-button styling applies inside a form tagged with the `form-with-validation` class (the
class disables pointer events and hover effects while a script holds the button disabled):

```html
<form class="form-with-validation">
  <input type="email" name="email">
  <input type="submit" value="Submit" disabled>
</form>
```

Continue-button gating (the surface `email-validation.js` listens for: a field group and a button
wrapper sharing one `data-validate-group` id):

```html
<div data-validate-group="step-1">
  <input type="email" name="email" placeholder="Work email">
</div>

<div data-validate-element="button" data-validate-group="step-1">
  <button type="button">Continue</button>
</div>
```

While a gating script holds `data-validate-disabled` on that button wrapper, pressing it force-shows
the invalid outline on every email field in the matching group.

## API

### Attributes styled / observed

| Attribute | Put on | What it does |
| --- | --- | --- |
| `data-validate-field-invalid="true"` | email input (set by JS) | The red-outline hook: `outline: 1px solid var(--_colors---fill--error)`. Matched on `input[type='email']` and `input[data-validate-email]`. Do not author manually. |
| `data-validate-email` | text input used as an email field | Opts the input into email validation and the invalid-outline selector. |
| `data-validate-group` | field container and button wrapper | Shared id that links a step's fields to its Continue control. |
| `data-validate-element="button"` | button wrapper | Marks the wrapper as a gated Continue control. |
| `data-validate-disabled` | button wrapper (set by JS) | Present while the control is blocked; pressing the blocked control triggers the force-show of email errors. |

### Classes

| Class | Put on | What it does |
| --- | --- | --- |
| `form-with-validation` | the form | Scopes the disabled-button rules: submit inputs/buttons get a 0.3s transition; while `:disabled` or carrying `is-disabled`, they get `cursor: not-allowed`, `pointer-events: none`, and their hover transform/box-shadow/brightness effects are suppressed. |
| `is-disabled` | submit button (set by JS) | Same locked styling as native `:disabled`, for non-native button elements. |
| `form_radio-field` | radio field wrapper | When it contains Webflow's `.w--redirected-checked`, the wrapper gets a 2px outline (`--_colors---border--outline`), a "selected card" look for radio groups. |
| `modal-form_input is-select` | select element | Replaces the native dropdown arrow with an inline SVG chevron (`appearance: none`, right padding, background image), plus a focus-visible outline offset. |
| `password-toggle` / `show-password` | password visibility toggle | With `show-password` absent, the `.eye-icon.visible` icon shows; adding `show-password` hides it and shows `.eye-icon.show` instead. Pure CSS icon swap; the class toggling is up to your script. |

### CSS variables used

| Variable | Used for |
| --- | --- |
| `--_colors---fill--error` | Invalid email outline color. |
| `--_colors---border--outline` | Checked radio-field outline color. |

Both must exist in your Webflow project's variables (Lumos naming) or the outlines render with no
color.

## Notes & gotchas

- **`form-validation.js` is currently the datepicker script.** Byte-identical copy of
  `global-embeds/form-embeds/datepicker/datepicker.js` (same selectors, same jQuery UI loader). Both
  scripts are idempotent, so loading it alongside the real datepicker embed causes no double-init,
  but it adds zero validation behavior.
- The CSS is purely reactive: it styles states (`data-validate-field-invalid`, `:disabled`,
  `is-disabled`, `show-password`) that scripts toggle. With no script loaded you only get the static
  rules (radio outline, select chevron).
- The disabled-button rules use `!important` on `pointer-events` and `cursor`, so they win over
  Webflow hover interactions; `transform` and `box-shadow` are also forced off on hover while
  disabled.
- The invalid-email selectors only target `input[type='email']` and `input[data-validate-email]`;
  other field types never get the red outline from this stylesheet.
- Step flows in this repo (`global-embeds/step-flow/`, `global-embeds/tabs/`) ship their own
  per-step validation and honor `data-validate-ignore`; they are separate embeds from this folder.
