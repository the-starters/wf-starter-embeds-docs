---
title: "Spinner"
source: global-embeds/spinner.css
---

Source: Webflow, `Global Embeds / Spinner` · repo mirror: `global-embeds/spinner.css`

## What it is

The rotating loader ring. An element tagged `data-spinner="1"` becomes a circular
border-spinner: a 5×`--size` border in `--color-1` with the bottom segment in `--color-2`,
spinning once per second (`rotation` keyframes, linear, infinite).

Used inside the [Loader](../loader.md) overlay's `[data-loader]` element, and anywhere an
inline busy indicator is needed.

## Markup contract

```html
<div data-spinner="1" style="width: 2rem; height: 2rem;"></div>
```

Size the element with your Webflow class; the CSS only draws the ring, and width/height come from
the element itself.

## API

| Variable | Default | Purpose |
| --- | --- | --- |
| `--color-1` | `--_colors---border--primary` | Ring color. |
| `--color-2` | `--_colors---border--outline` | The contrasting bottom segment that makes rotation visible. |
| `--size` | `1px` | Border weight unit; the ring is `calc(5 * var(--size))` thick. |

Override per instance in the Designer (element styles) or with a wrapper class.

## Notes & gotchas

- The value is part of the selector: `data-spinner="1"` exactly. Other values are reserved
  for future spinner variants and currently style nothing.
- The animation runs whenever the element is rendered; hide spinners with `display: none`
  (as the Loader helper does) rather than `visibility` if you care about idle GPU work.
- There is no `prefers-reduced-motion` handling here; the ring always spins.
