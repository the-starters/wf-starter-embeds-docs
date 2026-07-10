---
title: "Content RTE"
---

Source: Webflow — `Global Embeds / Content RTE` · repo mirror: `global-embeds/content-rte.css`

## What it is

A decorative **floating quote mark** behind blockquotes in rich text, scoped to `.content_rte`.
Every `blockquote` gets a large, translucent `”`-glyph (an inline SVG rendered through a CSS
`mask`) positioned top-left behind the first lines of the quote, with the text nudged right so
the two overlap nicely.

`isolation: isolate` keeps the mark stacked behind the quote text but **not** behind the
section background, and `pointer-events: none` keeps it from blocking selection.

## Markup contract

None — add the `content_rte` class to the Rich Text element and every `blockquote` inside it
gets the treatment automatically.

## API

All knobs are CSS variables on `.content_rte blockquote`, overridable per page or per class:

| Variable | Default | Purpose |
| --- | --- | --- |
| `--quote-size` | `7rem` | Glyph box size. |
| `--quote-color` | `rgba(182, 213, 215, 0.5)` | Mark color (`#B6D5D7` @ 50%). |
| `--quote-offset-x` | `-0.5rem` | Horizontal offset; negative pushes past the left edge. |
| `--quote-offset-y` | `-1rem` | Vertical offset above the first line. |
| `--quote-text-pad` | `1.75rem` | Left padding on the quote text so it overlaps the mark. |

## Notes & gotchas

- The glyph is drawn as a **mask over a background-color**, so recoloring is just
  `--quote-color` — no need to touch the SVG.
- Because the mark is a `::before` on the blockquote itself, it scrolls and wraps with the
  quote — no absolute-positioned sibling to manage.
- Outside `.content_rte`, blockquotes are untouched.
