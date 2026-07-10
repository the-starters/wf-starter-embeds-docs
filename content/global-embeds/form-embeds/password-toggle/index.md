---
title: "Password Toggle"
---

Source: Webflow, `Global Embeds / Form Embeds / Password Toggle`

## What it is

A show/hide button for password fields. On `DOMContentLoaded` the script finds every
`data-password-input` wrapper, grabs the toggle element and the first `input` inside it, and on
each toggle click flips the input's `type` between `password` and `text`. While the password is
visible, the toggle carries the `show-password` class; style your eye/eye-off icon states off
that. Small and dependency-free.

## File structure

```
Password Toggle
├── Password Toggle - CSS
└── Password Toggle - JS
```

## Markup contract

```html
<div data-password-input>
  <input type="password" name="Password" class="w-input" />
  <div data-password-toggle>
    <!-- eye icon; give it an "is visible" style under .show-password -->
  </div>
</div>
```

The toggle must live **inside** the `data-password-input` wrapper. Wrappers without a toggle are
skipped.

## API

| Attribute / class | On | Purpose |
| --- | --- | --- |
| `data-password-input` | wrapper | One password field + toggle pair. The first `input` inside is the field that gets flipped. |
| `data-password-toggle` | toggle element | Click target. Clicking switches the field between `type="password"` and `type="text"`. |
| `show-password` | toggle (added/removed by JS) | Present while the password is visible; hook your icon swap to it. |

The companion CSS styles the toggle:

| Rule | Purpose |
| --- | --- |
| `::before` with `inset: -4px` | Invisible overlay that enlarges the click target by 4px on every side. |
| transparent 5px outline + 2px radius + 200ms transition | Resting state that transitions smoothly into hover. |
| hover: outline and background set to `var(--colors--silver)` | Soft highlight around the icon on hover. |

## Notes & gotchas

- The `::before` hit-area overlay is absolutely positioned, so the toggle needs
  `position: relative` (or another positioning context). The rule for it exists in the CSS but is
  **commented out**; set it on the toggle element in the Designer.
- The hover style uses the `--colors--silver` variable; it must exist in your project's
  variables/styles or the hover highlight silently does nothing.
- The script only binds on `DOMContentLoaded`; there is no init guard and no re-scan, so wrappers
  added later (or a script injected after DOM ready) won't be wired.
- The field lookup is the **first** `input` inside the wrapper, so keep exactly one input per
  wrapper, before nothing else input-like.
- The toggle is a plain click target, not a `button`, and no `aria-*` state is set. If keyboard
  and screen-reader support matter, build the toggle as a real button in the Designer.
