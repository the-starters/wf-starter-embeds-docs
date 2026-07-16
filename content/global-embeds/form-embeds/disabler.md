---
title: "Disabler"
source: global-embeds/form-embeds/disabler.js
---

Source: `global-embeds/form-embeds/disabler.js`

## What it is

Attribute-driven field disabling: while a trigger control is in its active state, every
target sharing one of its keys is disabled (and optionally cleared). First wired up for the
generate-contract flow in **v1.25.5**, where checking "same as above" disables the duplicate
address fields.

Triggers and targets pair through whitespace-separated keys in `data-disabler-target`, so one
checkbox can disable several fields, several triggers can disable the same field, and a
target is re-enabled only when **no** trigger for any of its keys is active.

## Markup contract

```html
<!-- trigger: checking this disables (and clears) everything keyed "billing" -->
<label data-disabler-element="checkbox" data-disabler-target="billing" data-disabler-clear="true">
  <input type="checkbox"> Billing address same as shipping
</label>

<!-- targets -->
<input data-disabler-element="target" data-disabler-target="billing" name="billing-street">
<input data-disabler-element="target" data-disabler-target="billing" name="billing-city">
```

The marked element can be the form control itself or a wrapper; the script resolves the first
`input`, `textarea`, or `select` inside it.

## API

| Attribute | On | Values | Purpose |
| --- | --- | --- | --- |
| `data-disabler-element` | trigger or target | `checkbox` \| `radio` \| `input` \| `target` | Declares the role; the first three are trigger types. |
| `data-disabler-target` | trigger and target | whitespace-separated keys | Pairs triggers with targets. |
| `data-disabler-when` | trigger | `checked` (default) \| `unchecked`, or `filled` (default) \| `empty` for `input` triggers | Which state counts as active. |
| `data-disabler-clear` | trigger | `true` | Also clear the target's value while disabling (fires `input` + `change` so other embeds see it). |

## Evaluation model

Every bound event triggers a **global** re-evaluation: for each key, active = OR over all
triggers referencing it, then every target is disabled or re-enabled in one pass. Global
matters for two cases that per-trigger updates get wrong: selecting a radio fires no event on
the radio that just became unchecked (peers in the same group are bound so the group
re-settles), and modal content renders late (the embed re-runs on the
[Modal](../modal/index.md) group's `modal-open` event).

## Notes & gotchas

- Double-binding is prevented twice over: triggers are marked `data-disabler-inited`, and
  controls are remembered in a WeakSet, so pasting the script twice or re-running on modal
  open never stacks listeners.
- Disabling sets the native `disabled` attribute, so disabled targets drop out of form
  submission and constraint validation, which is usually what you want for "same as above"
  fields.
- **Staging-only diagnostics.** On `*.webflow.io`, localhost, or a cloudflared tunnel, the
  script warns about misconfiguration (a trigger with no keys, a key with no target, a
  `checkbox` trigger whose control can never be checked). Production consoles stay clean;
  force the diagnostics with `window.DISABLER_DEBUG = true`.
