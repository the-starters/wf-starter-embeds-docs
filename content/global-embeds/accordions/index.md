---
title: "Accordions"
---

Source: Webflow — `Global Embeds / Accordions`

## What it is

Attribute-driven accordion with GSAP height animation and full ARIA wiring. On `DOMContentLoaded`
the script inits every `data-accordion="wrapper"` on the page (idempotent — each wrapper is marked
with `data-script-initialized` so re-running is safe), animates each panel's height open/closed over
0.3s, and keeps `aria-expanded` / `aria-controls` / `aria-labelledby` in sync with generated ids.

The list slot is CMS-aware: on init, leading `.u-display-contents` helpers are flattened and a
nested Webflow Collection List is unwrapped, so CMS items behave as plain accordion cards.

The companion CSS only affects the Webflow Designer (`.wf-design-mode`): it forces
`data-accordion="content-wrap"` panels to `display: block` so you can edit collapsed content, and
adds design-mode styling for the site's `all-starters_filter-accordion` classes.

## File structure

```
Accordions
├── Accordions - CSS
└── Accordions - JS
```

GSAP must load before the JS. ScrollTrigger is optional — when present it is refreshed
after every open/close so pinned/triggered sections stay measured.

## Markup contract

```html
<div data-accordion="wrapper"
     data-close-previous="true"
     data-close-on-second-click="true">
  <div data-accordion="list">
    <!-- static items, or a Collection List (it gets unwrapped on init) -->
    <div data-accordion="component" class="accordion_item">
      <h3>
        <button data-accordion="toggle-button">Accordion Item</button>
      </h3>
      <div data-accordion="content-wrap">
        <div>…content…</div>
      </div>
    </div>
    <!-- × N -->
  </div>
</div>
```

Each `component` needs both a `toggle-button` and a `content-wrap`; a card missing either is
skipped with a `console.warn`. The open state is the `is-active` class on the `component` element —
style icon rotation / colors off that.

For CMS lists: the `list` slot may contain the Collection List directly (optionally wrapped in
`.u-display-contents` helpers, which are flattened first). On init, each collection item's first
visible child (skipping `w-condition-invisible`) is promoted into the slot and everything else that
was in the slot — including the Collection List wrappers — is removed. Put
`data-accordion="component"` on that inner element.

## API

Options sit on the `data-accordion="wrapper"` element.

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-open-by-default` | `all` or a number (1-based) | closed | Open every card, or just card N, instantly on load. `all` disables `data-close-previous`. |
| `data-close-previous` | `true` | off | Classic accordion: opening a card closes the previously opened one. |
| `data-close-on-second-click` | `true` | off | Clicking an open card's button closes it. Without this, an open card stays open. |
| `data-open-on-hover` | `true` | off | Also open on `mouseenter` of the toggle button. |

| Hook | On | Purpose |
| --- | --- | --- |
| `data-accordion="wrapper"` | root | One accordion instance; holds the options. |
| `data-accordion="list"` | slot | Direct parent of the cards; CMS unwrapping runs here. |
| `data-accordion="component"` | card | One accordion item; gets `is-active` when open. |
| `data-accordion="toggle-button"` | button | The toggle. Gets `aria-expanded` and a generated id. |
| `data-accordion="content-wrap"` | panel | Collapsible region. `display: none` when closed; height animated. |

## Notes & gotchas

- The `data-accordion` attributes are required — classes alone do nothing.
- The script assumes a global `gsap`; there is no guard, so without GSAP it throws.
- `data-open-on-hover` binds `mouseenter` unconditionally; on touch devices this fires on tap.
  Prefer leaving it off unless the accordion is desktop-only.
- No `prefers-reduced-motion` handling — the 0.3s height tween always runs.
- Keyboard works out of the box when the toggle is a real `button` element (click = Enter/Space).
- One-open-at-a-time (`data-close-previous`) tracks the previous index per wrapper, so multiple
  accordions on a page are independent.
- CMS unwrapping keeps only the first visible child of each collection item — wrap the whole card
  in a single element inside the Collection Item.
