---
title: "Location Dropdown"
---

Source: Webflow — page-level embed on the All Starters browse page

## What it is

The location filters on the All Starters browse page (Country / State / …) are Webflow dropdowns.
By default they just snap open. This CSS-only embed gives them a smooth, **accordion-style height
animation**: the toggle stays put, and the option list below it grows and shrinks.

It uses the CSS grid `grid-template-rows: 0fr → 1fr` trick, scoped to the **list nav only** — the
dropdown root and toggle button keep their Designer styles untouched, so nothing about the toggle
moves or resizes while the list reveals. No JS, no GSAP.

## Markup contract

Standard Webflow dropdown, with the list `nav` wrapping a single inner wrapper that holds the search
field and the option list:

```html
<div class="filters_location-dropdown w-dropdown">            <!-- untouched -->
  <div class="filters_location-dropdown-toggle w-dropdown-toggle">…</div>  <!-- untouched -->

  <nav class="filters_location-dropdown-list-nav w-dropdown-list">          <!-- the grid; gets .w--open -->
    <div class="filters_location-dropdown-list-wrapper">                    <!-- single collapsing child -->
      <div class="filters_dropdown-search-field-wrapper">…</div>
      <div class="filters_location-dropdown-list">…</div>                   <!-- items (WF-Algolia injects) -->
    </div>
  </nav>
</div>
```

The `nav` **must** have exactly one direct child (`.filters_location-dropdown-list-wrapper`) — that
child is what clips and collapses. Webflow adds `.w--open` to the `nav` itself when the dropdown
opens; that class drives the animation (no `:has()` needed).

## API

No configurable attributes — it's a styling embed. The selectors are the contract:

| Selector | Role |
| --- | --- |
| `.filters_location-dropdown-list-nav.w-dropdown-list` | The grid container. `display:grid`, `grid-template-rows:0fr` → `1fr` on `.w--open`. |
| `…-list-nav.w-dropdown-list.w--open` | Open state — expands the row and cancels the Designer's `top:110%` overlay offset. |
| `.filters_location-dropdown-list-nav .filters_location-dropdown-list-wrapper` | The single collapsing child: `overflow:hidden; min-height:0`. |

Timing is `240ms cubic-bezier(0.4, 0, 0.2, 1)`; automatically disabled under
`prefers-reduced-motion: reduce`.

## File structure

```
Location Dropdown Filter - CSS
```

CSS-only — no GSAP, no JS, no load-order constraints. It coexists with the component's existing
inline embed (chevron rotation + outline/background).

## Notes & gotchas

- **`display: grid !important` is required.** Webflow's own dropdown JS flips the list between
  `display:none` and `display:block` via `.w--open`. Forcing it to stay a grid is what lets **both**
  directions animate — closing still animates even though Webflow removes `.w--open` instantly
  (`data-delay="0"`).
- **`min-height: 0` on the inner wrapper is mandatory.** Without it the grid row can't shrink below
  the content's natural height, and nothing animates.
- **Grey-flash fix (background set unconditionally).** The Designer only put the fill colour on the
  `.w--open` state. Now that the list stays rendered, on close the fill is removed instantly and the
  nav fell back to Webflow's base `.w-dropdown-list { background:#ddd }`, flashing grey through the
  background-less search-field area during the collapse. The embed sets
  `background-color: var(--_colors---fill--secondary)` + `border-radius: inherit` on the nav in
  **every** state so it holds through the animation.
- **`top: 0` override.** The Designer set `top: 110%` on `.w--open` for the old overlay look; the
  in-flow accordion doesn't want that offset, so the embed resets it to `0`.
- **Covers all three dropdowns, including the disabled ones.** The `.is-disabled` instances never
  receive `.w--open`, so they simply stay collapsed at `0fr`.
- **Internal scroll is preserved.** The Designer's `max-height: 12rem` on
  `.filters_location-dropdown-list` still scrolls a long country list — it lives inside the clipped
  wrapper, so the accordion and the inner scroll don't fight.
- **Focus while collapsed.** The list is `height:0` + clipped but still in the DOM; Webflow's
  `aria-expanded` on the toggle still conveys state. Gating keyboard focus into the hidden inputs
  would require JS — out of scope for a CSS-only embed.
