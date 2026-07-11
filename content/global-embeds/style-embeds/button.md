---
title: "Button"
source: global-embeds/button.css
---

Source: Webflow, `Global Embeds / Button` · repo mirror: `global-embeds/button.css`

## What it is

The button theming system: a **theme × style matrix** driven by two attributes on the button
wrapper. Pick a palette with `data-button-theme` and a weight with `data-button-style`; the CSS
supplies colors, borders, hover states, focus outlines, and motion.

This file is also the visual half of button *gating*:
[Form Validation](../form-embeds/form-validation/index.md) and
[Disable Apply](../../starters-list-filter/custom-algolia-scripts/disable-apply.md) swap
`data-button-theme` to `disabled`; without this embed, that swap changes nothing visually.

## The matrix

| | `primary` | `secondary` | `tertiary` |
| --- | --- | --- | --- |
| **`black`** | black-olive fill, white text | transparent, black-olive text + border | borderless, black-olive text |
| **`white`** | white fill, black-olive text | transparent, white text + border | borderless, black-olive text |
| **`sunny`** | sunny-melon fill, black-olive text | transparent, sunny-melon text + border | borderless, black-olive text |
| **`danger`** | error-red fill, white text | transparent, error text + border | borderless, error text |
| **`disabled`** | disabled-gray fill, dark-gray text, `cursor: not-allowed` | transparent, gray text + border | borderless, gray text |

Every theme has hover recolors for all three styles, defined only inside
`@media (hover: hover)`, so touch devices never get stuck hover states.

## Walkthrough

- **Motion.** Background/color/border transitions at 200ms with a standard easing curve;
  under `prefers-reduced-motion: reduce` the duration collapses to 0.01ms.
- **Keyboard focus.** `[data-button-theme]:focus-visible` gets a 2px olive outline with
  offset, so focus feedback is never hover-only.
- **Designer safety.** `.wf-design-mode .clickable_wrap { pointer-events: none }` stops the
  clickable overlay from swallowing clicks while editing in the Designer.
- **One-offs.** `.button.is-google` prepends the Google "G" logo (for OAuth buttons), and
  `.button.dark.is-disabled` is a legacy disabled look kept for older markup.

## Markup contract

```html
<div class="button_main-wrap" data-button-theme="black" data-button-style="primary">
  <button type="submit">Continue</button>
</div>
```

Scripts that gate buttons park the original theme and swap the attribute:

```js
wrap.setAttribute('data-button-theme', 'disabled')  // …and back when valid
```

## Notes & gotchas

- Colors come from the site's Webflow variables (`--colors--black-olive`,
  `--colors--sunny-melon`, `--colors--disabled-gray`, …). The embed has no fallbacks, so it
  only renders correctly inside the project.
- The `disabled` theme is **cosmetic** (plus `cursor: not-allowed`); actual click-blocking is
  the gating scripts' job.
- Two danger hover colors are hard-coded hex (`#FB7373`, `#E06666`) rather than variables;
  update them here if the error palette changes.
