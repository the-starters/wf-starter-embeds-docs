---
title: "Dropdown Transitions"
source: navbar-embeds/navbar-dropdown.css
---

Source: `navbar-embeds/navbar-dropdown.css` + `navbar-embeds/account-dropdown.css`

## What it is

CSS-only open/close height animations for the navbar's mobile dropdowns (767px and below).
Webflow toggles `.w--open` on a dropdown list but snaps it open with `display`; these files
replace the snap with a `grid-template-rows: 0fr -> 1fr` transition, the standard trick for
animating to an unknown height.

## `navbar-dropdown.css` (nav link dropdowns)

Applies to `[data-navbar-dropdown] > .w-dropdown-list`. The list becomes a one-row grid whose
row transitions from `0fr` (closed) to `1fr` (`.w--open`), and the single child,
`[data-navbar-dropdown-link-wrapper]`, gets `overflow: hidden; min-height: 0` so the collapse
is actually visible.

```html
<div data-navbar-dropdown class="w-dropdown">
  <nav class="w-dropdown-list">
    <div data-navbar-dropdown-link-wrapper>…links…</div>
  </nav>
</div>
```

## `account-dropdown.css` (profile dropdown)

The same technique for `.navbar_profile-dropdown`, with three refinements:

- **Independent durations.** `--navbar--dropdown-mobile-open-duration` and
  `--navbar--dropdown-mobile-close-duration` live on the dropdown itself (400ms each by
  default). The open state reassigns the close variable to the open one, which is what lets
  the two directions differ.
- **Closed state really closed.** `visibility: hidden` + `opacity: 0` hide the collapsed list
  and pull its links out of the tab order; `display: grid !important` replaces Webflow's
  `display: none` so the height can transition at all.
- **Reduced motion.** `prefers-reduced-motion: reduce` zeroes both durations, so the dropdown
  snaps instead of animating.

Every rule is guarded with `html:not(.wf-design-mode)`, so the Webflow Designer keeps its
normal display toggling on the canvas.

## Notes & gotchas

- Both files are mobile-only (`max-width: 767px`); desktop dropdowns keep Webflow's default
  behavior.
- The duration variables are namespaced with a `-mobile-` infix on purpose, so they never
  clash with the navbar CSS embed's own variables.
- If a dropdown's list gains a second direct child, the grid collapse breaks; keep the single
  wrapper element around the links.
