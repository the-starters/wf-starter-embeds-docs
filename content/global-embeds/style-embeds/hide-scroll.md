---
title: "Hide Scroll"
---

Source: Webflow — `Global Embeds / Hide Scroll` · repo mirror: `global-embeds/hide-scroll.css`

## What it is

Hides native scrollbars on **every inner scroller** — all elements except `html` and `body` —
so Windows Chrome's classic arrow scrollbars never appear inside cards, dialogs, and scroll
regions. Scrolling still works; only the bars are hidden (`scrollbar-width: none`,
`-ms-overflow-style: none`, and zeroed `::-webkit-scrollbar`).

The page-level bar is deliberately left visible; a commented-out block in the file can hide
that too if ever wanted.

## Walkthrough

1. **Global rule** — `*:not(html):not(body)` drops the bar on Firefox (`scrollbar-width`),
   legacy Edge/IE (`-ms-overflow-style`), and WebKit (`::-webkit-scrollbar { display: none }`).
2. **Page bar** — untouched (the optional `html` block is commented out).
3. **Custom tracks** — the [Custom Scrollbar](../custom-scrollbar/index.md) embed draws its own
   track/thumb elements, which are ordinary DOM — this file doesn't affect them.

## Notes & gotchas

- This is **global and aggressive by design**: any element that overflows scrolls invisibly.
  If a region needs a visible affordance, give it the Custom Scrollbar treatment — don't try
  to re-show the native bar with more CSS (`scrollbar-width: none` on `*` wins the specificity
  fight annoyingly often).
- Scroll *hints* disappear with the bars — make sure scrollable regions are visually obvious
  (fades, "more" indicators), especially on Windows where users expect bars.
- `global.css` also ships a scoped `[hide-scrollbar]` attribute and a `.no-scrollbar` class —
  those predate this file; with Hide Scroll loaded they're redundant but harmless.
