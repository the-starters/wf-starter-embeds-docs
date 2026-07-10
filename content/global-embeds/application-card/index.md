---
title: "Application Card"
---

Source: Webflow, `Global Embeds / Application Card`

## What it is

"See more / See less" toggle for the message block inside an application card. The CSS clamps the
collapsed message to 4 lines (`-webkit-line-clamp`); the JS measures the collapsed and expanded
heights of each `.application-card_message-wrapper` on `DOMContentLoaded` and animates `max-height`
between them with GSAP (0.32s, `power2.out`). If the message already fits in 4 lines, the wrapper
gets `is-collapsed-only` and the toggle row is hidden entirely. Expanded content is capped at
`min(20rem, 50vh)` and scrolls inside the wrapper. Without GSAP, or when the visitor prefers
reduced motion, the toggle still works, just instantly (a `console.warn` notes the missing GSAP).

## File structure

```
Application Card
├── Application Card - CSS
└── Application Card - JS
```

GSAP is optional but recommended for the animations.

## Markup contract

```html
<div class="application-card_message-wrapper">
  <div class="application-card_message-content-wrapper">
    <p>Long application message…</p>
  </div>
  <div class="button-group">
    <button class="application-card_see-more">
      <span class="application-card_see-more-text">See more</span>
      <span class="application-card_see-more-icon">…chevron…</span>
    </button>
  </div>
</div>
```

A wrapper is skipped unless it contains all three of: the content wrapper, the `see-more` button,
and the `see-more-text` label. The 4-line clamp applies to direct `p` children of the content
wrapper. The button label text is rewritten by the script ("See more" / "See less"), and the icon
rotation is pure CSS off the `is-expanded` class.

## API

There are no configuration attributes; everything is class-driven.

| Class | On | Purpose |
| --- | --- | --- |
| `application-card_message-wrapper` | root | One instance; carries the state classes. |
| `application-card_message-content-wrapper` | inner | Measured + animated region; gets a generated id for `aria-controls`. |
| `application-card_see-more` | button | The toggle. Gets `aria-expanded` and `aria-controls`. |
| `application-card_see-more-text` | label | Text swapped between "See more" and "See less". |
| `application-card_see-more-icon` | icon | Rotated 180° via CSS when expanded. |
| `button-group` | toggle row | Hidden by CSS when the wrapper is `is-collapsed-only`. |

| State class | Set by | Meaning |
| --- | --- | --- |
| `is-expanded` | JS | Message is open; clamp removed, scrollable up to the height cap. |
| `is-collapsed-only` | JS | Content fits in 4 lines; toggle disabled and hidden. |

| CSS variable | Default | Purpose |
| --- | --- | --- |
| `--application-card-msg-expand-max` | `20rem` | Absolute cap on the expanded message height. |
| `--application-card-msg-expand-max-vh` | `50vh` | Viewport-relative cap; the smaller of the two wins. |

## Notes & gotchas

- Layout re-runs on window resize (debounced 100ms), re-deciding `is-collapsed-only` per card,
  so a message can gain or lose its toggle as the viewport changes.
- Cards that start as `is-collapsed-only` never get a click listener, and their toggle state is
  not re-bound if a later resize makes them clamp again; the relayout keeps classes and ARIA
  correct, but binding happens once at boot.
- Reduced motion is respected twice: the JS skips the tween and the CSS zeroes the icon
  transition under `prefers-reduced-motion: reduce`.
- The measurement routine briefly toggles classes and forces reflows; it runs at boot and on
  resize only, so this is invisible in practice.
- Content injected after load (e.g. CMS re-render) is not picked up; the script only binds
  wrappers present at `DOMContentLoaded`.
