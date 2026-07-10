---
title: "Global Styles"
---

Source: Webflow — `Global Embeds / Global Styles` · repo mirror: `global-embeds/global.css`

## What it is

The site-wide CSS foundation (~610 lines). Everything in here is global: the fluid type scale,
element resets, utility classes, and — most importantly — three attribute-driven systems that
other embeds and scripts build on (the **state manager**, the **slot styler**, and the **hide
utilities**).

## Walkthrough

### Fluid type scale

`html { font-size }` steps through viewport-based `calc()` values at 1600px, 767px, 479px,
390px and 240px breakpoints — every `rem` in the project scales with the viewport. `body` gets
antialiasing and `optimizeLegibility`.

### Resets & form fixes

- Headings, paragraphs, labels and blockquotes inherit all typography (`font-family` through
  `text-wrap`) and lose their margins — type is driven entirely by Webflow classes.
- Unclassed `<a>` tags get underlines; Webflow's link-ish elements (`.w-tab-link`,
  `.w-dropdown-link`, …) inherit text decoration.
- A `<select>` whose empty placeholder option is selected renders at 60% opacity, mimicking
  placeholder text.
- Autofill styling is neutralized on `.w-input` (transparent background, inherited text color)
  so Chrome's yellow flash never appears; subscribe/search inputs keep a 1rem autofill font.
- `input` gets `appearance: none` and `height: auto !important` across the board.
- First/last children inside `.w-richtext` lose their outer margins so rich text sits flush.

### Line-clamp utilities

`.text-style-1line` … `.text-style-10lines` truncate to N lines with an ellipsis; `-mob`
variants (≤767px) clamp tighter on small screens — combine them, e.g.
`text-style-5lines text-style-2lines-mob`. Pair with `wf-xano-element="show-more"` to
expand/collapse. `.max-ch` is the single-line cousin (50ch, ellipsis).

### Visibility utilities

`.hide`, `.hide-tablet`, `.hide-mobile-landscape`, `.hide-mobile`, `.visible-mob-landscape`,
and the blunt `.hidden` — all `!important`, breakpoint-scoped. The comment "never overwritten"
is the contract: scripts may toggle these classes freely.

### State Manager

The CSS-variable state system. Any element with `data-state` exposes `--_state---true: 1` /
`--_state---false: 0`; when the element (or a descendant) matches the named state, the values
flip:

| Token | Flips when |
| --- | --- |
| `data-state~="checked"` | `:checked` (self or descendant) |
| `data-state~="current"` | Webflow `.w--current` |
| `data-state~="open"` | Webflow `.w--open` |
| `data-state~="pressed"` | `aria-pressed="true"` |
| `data-state~="expanded"` | `aria-expanded="true"` |
| `data-state~="external"` | `target="_blank"` |

`.is-active` and the Designer-only `data-preview` hooks flip the same variables, so components
can be previewed in the Designer without real state. Style with
`calc()`/`opacity: var(--_state---true)` instead of duplicating selectors.

`data-trigger` is the interaction twin (`--_trigger---on` / `--_trigger---off`): `hover`,
`hover-if-clickable` (only when the card has a visible `.clickable_wrap`), `focus`, `mobile`
(flips on touch devices), plus the `group`/`hover-other`/`focus-other` pattern where
hovering/focusing one member of a group dims the *others*. Hover rules live inside
`@media (hover: hover)` so touch devices never get stuck states.

### Slot Styler & layout helpers

- `[data-slot]` flattens Webflow Collection List wrappers (`.w-dyn-list` and up to two
  `.u-display-contents` layers) to `display: contents`, so CMS items participate directly in
  the slot's grid/flex layout — this is what lets a Collection List live inside a designed
  grid without breaking it.
- `.u-layout-column-2` drops its aspect-ratio/rounding when it contains anything that isn't
  media, so text columns don't get cropped.

### Hide utilities

- `.u-hide-if-empty` — removes itself when empty *or* when every child is
  `w-condition-invisible` (Webflow conditional visibility leaves invisible children behind).
- `.u-hide-if-empty-cms` — removes itself when it contains no `.w-dyn-item`.

### Odds and ends

Styled check-mark lists (`.p-item_list`, `.list-dark-mark`), the gradient background hooks
(`.bg-g1`, `[data-bg="gradient"]`, `section.is-gradient`), scrollbar hiding for rich-text
figures and specific content sections, `[hide-scrollbar]` (attribute-scoped scrollbar hiding —
the global version is [Hide Scroll](hide-scroll.md)), the `.form-with-validation` disabled
submit-button treatment, the news-item divider lines, `section { position: relative }`, and
the wf-algolia active page-number highlight.

## Notes & gotchas

- **This file is a dependency of almost everything.** The state manager variables are consumed
  by component styles across the site; the slot styler is why CMS grids look right. Treat
  removals as breaking changes.
- The `hover`-token rules only exist under `@media (hover: hover)` — testing hover states in
  responsive-mode emulation can be misleading.
- `.hide*` utilities all carry `!important`; a script that sets inline `display` will still
  lose to them.
- The check-mark list icons are hard-coded Webflow CDN URLs — re-uploading those assets changes
  the URLs and silently breaks the bullets.
