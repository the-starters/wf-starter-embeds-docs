---
title: "Expertise Item"
---

Source: Webflow — `Global Embeds / Expertise Item` · repo mirror: `global-embeds/expertise-item.css`

## What it is

The hover choreography for the expertise cards (the category grid). At rest, each card shows a
count badge; on hover the card tints, the count **cross-fades into an arrow icon** (opacity +
blur + scale/translate), and a hidden "view more" row unfolds beneath the title.

Pure CSS — the Webflow structure supplies the elements, this embed supplies the transitions and
the hover states.

## Walkthrough

Resting state:

- `.expertise_item` and `.expertise_count-wrapper` get 240ms background/shadow transitions.
- `.expertise_count-text` sits visible (opacity 1, no blur); `.expertise_hover-icon` sits
  hidden — transparent, slightly blurred, translated down-left, `pointer-events: none`.
- `.expertise_view-more` is collapsed: `max-height: 0`, transparent, nudged up.

On hover (only under `@media (hover: hover) and (pointer: fine)` — real mice only, no touch or
stylus emulation):

- the card background turns `--colors--sky`;
- the count wrapper goes white with a soft shadow;
- the count text blurs/shrinks away while the arrow icon slides into place (300ms, same easing);
- the view-more row expands to `max-height: 1.5rem` and fades in.

## Markup contract

Class-based; the structure the CSS expects:

```html
<a class="expertise_item">
  <div class="expertise_count-wrapper">
    <div class="expertise_count-text">24</div>
    <div class="expertise_hover-icon"><!-- arrow svg --></div>
  </div>
  <h3>Brand Design</h3>
  <div class="expertise_view-more">View starters →</div>
</a>
```

## Notes & gotchas

- The view-more reveal animates `max-height` to a fixed `1.5rem` — tune that value to the
  row's line-height; multi-line content gets clipped.
- Touch devices never see any of this (the hover block requires `pointer: fine`), so the card
  must make sense without the reveal — the count badge is the resting affordance.
- The icon swap animates `filter: blur()` and `scale`/`translate` — cheap on modern browsers,
  but avoid adding more blurred layers per card.
