---
title: "Learn Card"
---

Source: Webflow, `Global Embeds / Learn Card` · repo mirror: `global-embeds/learn-card.css`

## What it is

One job: keeps learn-content card headings to a predictable height.
`.learn-card_heading` is line-clamped to **4 lines** on desktop and **3 lines** under 768px,
with an ellipsis, so CMS-fed article titles of any length produce uniform cards.

Learn cards appear in the quiz results recommendations (see
[Quiz Results](../../page-scripts/quiz-results.md)) and learn-content sliders.

## Markup contract

Class-based: put `learn-card_heading` on the card's title element; the CMS binding does the
rest.

## Notes & gotchas

- Same `-webkit-line-clamp` technique as the `.text-style-Nlines` utilities in
  [Global Styles](global.md); this is just a component-scoped preset. If the clamp counts
  ever need to change per breakpoint, prefer swapping to those utilities instead of forking
  more component CSS.
- The clamp hides overflow, so make sure the full title is available elsewhere (the card links
  to the article, and `title`/aria attributes can carry the full text if needed).
