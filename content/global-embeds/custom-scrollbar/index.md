---
title: "Custom Scrollbar"
source: global-embeds/custom-scrollbar
---

Source: Webflow, `Global Embeds / Custom Scrollbar`

## What it is

Custom horizontal scrollbar for overflow scrollers (card rows, tables, galleries). The CSS hides
the native scrollbar on the scroll content; the JS draws a proportional, draggable thumb on a
track and keeps it in sync with the scroller. The track hides itself automatically when there is
nothing to scroll.

It initializes on window `load` (idempotent via `data-scrollbar-inited`) and then re-measures
aggressively (on scroll, resize, `ResizeObserver` changes, image loads, font readiness, DOM
mutations inside the scroller, and whenever the wrapper scrolls into view), because `scrollWidth`
for an overflow scroller can report stale values until layout settles.

## File structure

```
Custom Scrollbar
├── Custom Scrollbar - CSS
└── Custom Scrollbar - JS
```

## Markup contract

```html
<div data-scrollbar-container>
  <div data-scroll-content>
    <!-- the overflowing items -->
  </div>
  <div data-scrollbar-track data-scrollbar-theme="green">
    <div data-scrollbar-thumb></div>
  </div>
</div>
```

All four hooks are required; a wrapper missing `data-scroll-content`, `data-scrollbar-track`, or
`data-scrollbar-thumb` is skipped silently. Position and size the track/thumb with your own
classes; the script only sets the thumb's `width` and `left` (in pixels) and toggles the track's
`display`.

## API

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-scrollbar-container` | wrapper | One scrollbar instance; marked `data-scrollbar-inited="true"` after init. |
| `data-scroll-content` | scroller | The horizontally overflowing element. CSS hides its native scrollbar (`overflow-x: auto`, `scrollbar-width: none`, WebKit scrollbar hidden). |
| `data-scrollbar-track` | track | Container the thumb moves within; hidden (`display: none`) when the content does not overflow. |
| `data-scrollbar-thumb` | thumb | Draggable handle. Width is proportional to the visible fraction of the content. |
| `data-scrollbar-theme` | track | `green` or `blue`: CSS-only color presets (silver track, 1rem tall, site color variables for the thumb). The preset styles the element carrying the attribute as the bar, so put it on the track itself. Optional; style the track/thumb yourself instead if you prefer. |

## Notes & gotchas

- Horizontal only; the math is entirely `scrollWidth` / `scrollLeft` based.
- Dragging uses Pointer Events with pointer capture; touch dragging works (`touch-action: none` is
  set on the thumb), and text selection is disabled during a drag. Only the primary button drags.
- Clicking the empty track does not jump the scroll position; only thumb dragging and native
  scrolling/swiping move the content.
- Because init waits for window `load` and re-measures on visibility, scrollers inside tabs,
  modals, or initially hidden sections sync themselves once they become visible.
- The theme presets reference site color variables (`--colors--silver`, `--colors--rollie-green`,
  `--colors--rollie-blue`); on a site without those variables, skip `data-scrollbar-theme` and
  style the track/thumb with your own classes.
