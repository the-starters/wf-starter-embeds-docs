---
title: "Password Validation"
source: global-embeds/form-embeds/password-validation/password-validation.js
---

Source: `global-embeds/form-embeds/password-validation/password-validation.js` (**v1.59.420**)

## What it is

A live password checklist plus a submit gate for Memberstack signup forms. The rule set is chosen
entirely from attributes on the component wrapper, so a Webflow component instance can pick its own
rules with no code change: minimum length, a special character, mixed capitalization, a digit, or
any combination of them.

The script pairs each wrapper with its nearest `<form>` ancestor, finds Memberstack's own password
input (`input[data-ms-member="password"]`) and submit button (`ms-code-submit-button`), and from
first paint states pass or fail for every active rule. An empty field meets no rule, so the
checklist starts unmet and rows flip to valid as the password satisfies them. There is no neutral
state. It re-renders on `input`, `change` and `focusout`, which covers autofill and password
managers, and it recomputes once more inside the submit handler so a programmatic value write can
never sneak past a stale render.

While any active rule is unmet the CTA is greyed and disabled, and the Enter key is blocked
independently by a capture-phase submit handler. The script is idempotent and it fails open: a form
that no wrapper configures is left exactly as authored, with the only signal a staging-side console
warning. A forgotten component property can never brick signup.

## File structure

```
Password Validation
└── password-validation.js   the whole embed; defer before </body>
```

CDN-served, not pasted into a Webflow embed. There is no companion stylesheet: the checklist's
look is entirely yours in the Designer, and the script only flips inline `display` on the icons.

```html
<script src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@v1.59.420/global-embeds/form-embeds/password-validation/password-validation.js" defer></script>
```

Pin the tag rather than using `@latest`. CDN edges have served a stale `@latest` for hours after a
newer tag existed, and a hand-edited `@latest` path once carried a leftover branch name that 404'd
in production.

## Markup contract

```html
<form>
  <input type="password" data-ms-member="password" />

  <div starters-password-validation-characters="true"
       starters-password-validation-character-count="8"
       starters-password-validation-special="true"
       starters-password-validation-capitalization="true"
       starters-password-validation-numbers="true">

    <div starters-password-validation-rule="characters">
      <div starters-password-validation-icon="valid" style="display: none">✓</div>
      <div starters-password-validation-icon="invalid">✗</div>
      <div>At least {count} characters</div>
    </div>

    <div starters-password-validation-rule="special">
      <div starters-password-validation-icon="valid" style="display: none">✓</div>
      <div starters-password-validation-icon="invalid">✗</div>
      <div>One special character</div>
    </div>

    <div starters-password-validation-rule="capitalization">…</div>
    <div starters-password-validation-rule="numbers">…</div>
  </div>

  <div ms-code-submit-button data-button-theme="black">
    <input type="submit" value="Create account" />
  </div>
</form>
```

The wrapper is any element carrying at least one `starters-password-validation-*` attribute. It
must sit inside the `<form>` it validates; the password input and the submit button are found on
that form, not inside the wrapper.

Author the **invalid** icon visible and the **valid** icon hidden. A wired form overwrites both
from first paint, so that authoring only shows through on an instance that failed open, where it
makes the checklist read as a plain unchecked list rather than a row of green ticks.

Rows for rules that are switched off are hidden for you. A missing row for an active rule is
tolerated: the rule still gates, and a staging warning names it, so a Designer-side visibility
binding remains a valid alternative to the auto-hide.

### The `{count}` token

Any row text containing `{count}` gets it replaced with the character count actually being
enforced, so "At least {count} characters" renders "At least 8 characters". Use the token rather
than typing the number: a characters row whose copy hardcodes a number can drift away from the
count the form enforces the moment either one is edited, and the script emits a staging warning
when it sees that.

## xAttribute JSON

Applying the hooks with the **xAttribute** Webflow app (by xAtom)? Select the element in the
Designer and paste the matching block, one per element of the markup contract above.

The wrapper, shown with every rule on. Include only the rules you want; each one is independent,
and `character-count` is optional:

```json
{
  "starters-password-validation-characters": "true",
  "starters-password-validation-character-count": "8",
  "starters-password-validation-special": "true",
  "starters-password-validation-capitalization": "true",
  "starters-password-validation-numbers": "true"
}
```

Each checklist row, one block per rule:

```json
{ "starters-password-validation-rule": "characters" }
```

```json
{ "starters-password-validation-rule": "special" }
```

```json
{ "starters-password-validation-rule": "capitalization" }
```

```json
{ "starters-password-validation-rule": "numbers" }
```

The two icons inside each row:

```json
{ "starters-password-validation-icon": "valid" }
```

```json
{ "starters-password-validation-icon": "invalid" }
```

The password input (Memberstack's own hook):

```json
{ "data-ms-member": "password" }
```

The submit button, on the wrap or on the control itself:

```json
{ "ms-code-submit-button": "" }
```

## API

### Wrapper attributes

| Attribute | Values | Default | Purpose |
| --- | --- | --- | --- |
| `starters-password-validation-characters` | `"true"` | off | Minimum length rule. |
| `starters-password-validation-character-count` | a number | `8` | The length the characters rule enforces. Absent, unparsable or below 1 falls back to 8. |
| `starters-password-validation-special` | `"true"` | off | Requires one of `!@#$%^&*(),.?":{}\|<>`. |
| `starters-password-validation-capitalization` | `"true"` | off | Requires both a lowercase and an uppercase letter. |
| `starters-password-validation-numbers` | `"true"` | off | Requires a digit. |

Only the literal string `"true"` enables a rule. Webflow renders a boolean component property as
`"true"` or `"false"`, so a toggle left off is safely inert.

An element carrying only `character-count` still counts as a wrapper, but it enables nothing.

### Row and icon hooks

| Attribute | On | Purpose |
| --- | --- | --- |
| `starters-password-validation-rule` | checklist row inside the wrapper | Tags the row as `characters`, `special`, `capitalization` or `numbers`. Rows for inactive rules are set to `display: none`. |
| `starters-password-validation-icon="valid"` | icon inside a row | Shown (`display: flex`) while the rule passes. |
| `starters-password-validation-icon="invalid"` | icon inside a row | Shown while the rule fails. |

### Memberstack hooks the script reuses

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-ms-member="password"` | the password input | The field being validated. Found on the form, anywhere inside it. |
| `ms-code-submit-button` | button wrap or the control itself | The CTA that gets gated. |

### JavaScript

| Call | Purpose |
| --- | --- |
| `window.startersPasswordValidation.rescan()` | Re-runs discovery for markup injected after load (modals, step flows). Repeated calls are harmless: an already-wired form is never re-wired, only extended with wrappers it has not seen. |

## Submit gating

While any active rule is unmet, the script marks the CTA in four ways so it looks and behaves
locked whatever the button is built from:

| Treatment | Applied to |
| --- | --- |
| `disabled` class | the element carrying `ms-code-submit-button` |
| `data-button-theme="disabled"` | whichever element carries the theme; the authored theme is restored when the rules pass |
| `aria-disabled="true"` | the control a user actually activates |
| native `disabled` property and `tabindex="-1"` | native controls only (`button`, `input`) |

The greying that visitors see comes from the `data-button-theme` swap, so a CTA with no theme
attribute and no button, input or link inside it cannot be greyed. Pressing Enter is blocked
separately by a capture-phase submit handler, so a form with no `ms-code-submit-button` still
cannot be submitted early; its CTA just never greys out, and a staging warning says so.

## Failing open

The script gates only when it is certain what to enforce. In each of these cases it does nothing at
all: no gating, no submit blocker, rows and icons untouched, and the only signal is a staging-only
console warning.

- Zero active rules across every wrapper in the form.
- A wrapper that is not inside a `<form>`.
- A form with no `input[data-ms-member="password"]`.

A form that bailed out is left unmarked, so a later `rescan()` can pick it up once the missing
piece has arrived.

Staging diagnostics are console warnings prefixed `[password-validation]`. They appear only on
`*.webflow.io`, `*.trycloudflare.com`, `localhost`, `127.0.0.1`, or when the page sets
`window.STARTERS_DEBUG === true`. Production is silent.

## Notes & gotchas

- **One validated instance per form**, however many wrappers the form holds. Webflow's way to vary
  a component per breakpoint is two instances in the same form, so all of them are rendered and
  flip together.
- **The first wrapper that actually enables a rule sets the config.** Wrappers that enable nothing
  configure nothing, so a stray `character-count` on an ancestor section, or a responsive instance
  left at its defaults, cannot decide the form's fate. A wrapper whose own config differs from the
  enforced one gets a staging warning.
- **Wrappers that appear later inside an already-wired form are adopted** into the existing
  instance, copy, rows and icons included, rather than re-wiring the form.
- **Checklist rows outside any wrapper do nothing.** The script reports them once for the page,
  because that is nearly always a missing or misspelled attribute on the component root.
- **The checklist has stated pass or fail from first paint since v1.59.420**, the tag pinned above.
  The first release, v1.59.419, started neutral instead, with both icons hidden until the first
  keystroke. If a page still loads that older tag, that is why its checklist looks blank on arrival.
