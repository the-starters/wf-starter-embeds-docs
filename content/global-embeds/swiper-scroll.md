---
title: "Swiper Scroll"
---

Source: Webflow — `Global Embeds / Swiper Scroll`

## What it is

Attribute-driven horizontal scroll / carousel regions for Webflow, built on
[Swiper 11](https://swiperjs.com/) with a custom draggable scrollbar thumb. No classes to wire up —
everything is controlled by `data-*` attributes. The script auto-inits every
`[data-swiper-scroll="swiper"]` on the page, scopes each scrollbar to its own swiper, and is safe on
pages with no matching blocks. An optional Algolia bridge re-measures after WF-Algolia renders hits.

## Markup contract

The scrollbar lives **inside** the swiper as a direct child (not a sibling outside it):

```html
<!-- optional outer container: stacks swiper + anything else -->
<div data-swiper-scroll-container>
  <div data-swiper-scroll="swiper">
    <div data-swiper-scroll="swiper-wrapper">
      <div data-swiper-scroll="swiper-slide">Slide 1</div>
      <div data-swiper-scroll="swiper-slide">Slide 2</div>
    </div>

    <!-- scrollbar: DIRECT child of the swiper -->
    <div data-swiper-scroll="swiper-scrollbar" data-scrollbar-theme="green">
      <div data-scrollbar-thumb></div>
    </div>
  </div>
</div>
```

It won't init unless it finds a `swiper-wrapper`, at least one `swiper-slide`, **and** a
`swiper-scrollbar` containing a `data-scrollbar-thumb`. For multiple swipers in one container, the
script pairs by order; to be explicit, give a swiper and its scrollbar a matching
`data-swiper-scroll-id`.

### CMS slides (Collection List inside the wrapper)

Instead of static slides, the wrapper may hold a Webflow **Collection List** — optionally inside
`.u-display-contents` helper divs. On init the script strips the extra Webflow wrappers so each
item's content becomes a real slide:

```html
<div data-swiper-scroll="swiper-wrapper">
  <div class="u-display-contents">          <!-- optional helper(s), unwrapped -->
    <div class="w-dyn-list">                <!-- Collection List, removed -->
      <div class="w-dyn-items">
        <div class="w-dyn-item">
          <div class="my-card">…</div>      <!-- promoted to a direct wrapper child -->
        </div>
      </div>
    </div>
  </div>
</div>
```

Each collection item's first **visible** child is promoted (children with `w-condition-invisible`
from conditional visibility are skipped), old wrappers and static placeholders are removed, and the
promoted elements are tagged `data-swiper-scroll="swiper-slide"` automatically — no attribute needed
on the items themselves. Static markup is untouched: nothing runs unless a `.u-display-contents` or
`.w-dyn-list` wrapper actually exists, and an empty Collection List is left alone so Webflow's empty
state stays visible.

#### Opting out: `data-swiper-scroll-cms="true"`

Set `data-swiper-scroll-cms="true"` on the swiper root (default `false`) to keep the Collection List
markup exactly as Webflow renders it — no unwrapping. Two things change in this mode:

- **You own the slide contract**: each slide element needs `data-swiper-scroll="swiper-slide"`
  itself, and slides must still end up as direct children of the wrapper as far as layout is
  concerned (e.g. `display: contents` on the `w-dyn-list` / `w-dyn-items` wrappers via CSS).
- **The scrollbar moves outside**: it is resolved as a **sibling** of
  `[data-swiper-scroll="swiper"]` (direct child of the swiper's parent), not as a child inside it:

```html
<div data-swiper-scroll-container>
  <div data-swiper-scroll="swiper" data-swiper-scroll-cms="true">
    <div data-swiper-scroll="swiper-wrapper">
      <!-- Collection List left as-is; slides carry data-swiper-scroll="swiper-slide" -->
    </div>
  </div>

  <!-- scrollbar: SIBLING of the swiper in CMS mode -->
  <div data-swiper-scroll="swiper-scrollbar" data-scrollbar-theme="green">
    <div data-scrollbar-thumb></div>
  </div>
</div>
```

`data-swiper-scroll-id` pairing works the same way in both modes.

## API

### Structural hooks (required)

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-swiper-scroll="swiper"` | root | The Swiper instance root. One per carousel. |
| `data-swiper-scroll="swiper-wrapper"` | track | The moving track holding the slides. |
| `data-swiper-scroll="swiper-slide"` | slide | Each slide. |
| `data-swiper-scroll="swiper-scrollbar"` | track | Custom scrollbar track. Must be a direct child of the swiper. |
| `data-scrollbar-thumb` | thumb | The draggable thumb inside the scrollbar track. |
| `data-swiper-scroll-container` | wrapper | Optional outer flex column wrapper (layout only). |
| `data-swiper-scroll-id="…"` | root + scrollbar | Optional; pairs a swiper to a specific scrollbar. |

### Behaviour & layout (optional, on the swiper root)

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-swiper-scroll-mode` | `scroll` · `free` · `slide` | `scroll` | Free horizontal scroll vs. snap carousel. |
| `data-swiper-scroll-cms` | `true` | `false` | Keep CMS markup intact (no unwrapping); scrollbar is resolved as a sibling of the swiper instead of a child. |
| `data-swiper-free-mode` | `true` · `sticky` | — | Forces free-scroll; `sticky` adds gentle snap momentum. |
| `data-swiper-slides-per-view` | number · `auto` | `3` | Desktop slides visible. `auto` = each slide's own width. |
| `data-swiper-slides-per-view-mobile` | number · `auto` | `1.15` | Slides visible below the breakpoint (the `.15` peek hints there's more). |
| `data-swiper-breakpoint` | px | `992` | Min width at which desktop values apply. |
| `data-swiper-space-between` | px | `0` | Gap between slides on desktop. |
| `data-swiper-space-between-mobile` | px | = desktop | Gap below the breakpoint. |
| `data-swiper-mousewheel` | `false` | on | Disable horizontal mouse-wheel scrolling. |
| `data-swiper-grab-cursor` | `false` | on | Hide the grab/grabbing cursor. |
| `data-swiper-design-slides-per-view` | number | `3` | Columns shown inside the Webflow Designer (design mode only). |

### Scrollbar & clipping (CSS-driven)

| Attribute | On | Description |
| --- | --- | --- |
| `data-scrollbar-theme="…"` | scrollbar track | Hook for your own track/thumb colours (lives in your scrollbar CSS). |
| `data-swiper-clip-sides` | any wrapper | `left` / `right` bleed one edge past the viewport, or `both` = plain `overflow:hidden`. |

### Algolia bridge (`swiper-scroll-algolia-init-js.html`)

Opt in with `data-swiper-scroll-algolia="true"` on the swiper (or `"reinit"` to force destroy+reinit).
Re-measures on WfAlgolia `ready` / `response`. Public API: `window.SwiperScrollAlgolia.refresh()`.

## Modes

| Mode | Feel | Use when |
| --- | --- | --- |
| `scroll` *(default)* | Free, momentum-based horizontal scroll. Doesn't snap (~3 up on desktop, ~1.15 mobile). | Logo strips, card rails, galleries. |
| `slide` | Snap carousel (~450ms), rests on slide boundaries with end resistance. | One-at-a-time carousels, testimonial decks, hero sliders. |

## File structure

```
Swiper Scroll
├── Swiper CDN (library)
├── Swiper Scroll - CSS
├── Scrollbar Theme - CSS
├── Swiper Scroll - JS
└── Algolia Bridge - JS (optional)
```

Order matters: **Swiper CDN → Swiper Scroll - CSS → Scrollbar Theme - CSS → Swiper Scroll - JS**.
The library must load before the init script; the scrollbar styling must be present for the thumb
to show. The Algolia bridge, if used, goes after `Swiper Scroll - JS` and the WF-Algolia CDN.

## Notes & gotchas

- The scrollbar must be a **direct child** of the swiper — `resolveScrollbarPair` queries
  `:scope > swiper-scrollbar` only. Exception: with `data-swiper-scroll-cms="true"` it must instead
  be a direct child of the swiper's **parent** (a sibling of the swiper).
- CMS unwrapping happens **once, before Swiper init** (guarded by `data-swiper-scroll-inited`). If
  the list is re-rendered later (e.g. by Algolia), use the Algolia bridge — the unwrap does not
  re-run on DOM mutations.
- Each collection item should have **one** content element; only the first visible child is
  promoted, anything after it inside the item is dropped with the wrappers.
- `updateThumb` only reads Swiper state; layout remeasures call `swiper.update()` outside event
  handlers (avoids an `update → progress → updateThumb → update` recursion).
- The scrollbar **auto hides/shows with content changes** (e.g. filtering): when the slides fit the
  viewport the track is hidden; when scrolling is needed again it comes back. Visibility is decided
  from Swiper's metrics before the track is measured, and Swiper's `observerUpdate` triggers a
  debounced remeasure on DOM changes inside the swiper.
- Right-bleed alignment is pure CSS: `data-swiper-scroll-bleed="right"` bleeds the swiper to the
  viewport while the scrollbar stays container-width; a wrapper `::after` end spacer
  (`calc(50vw - 50%)`) fixes the last slide.
- Known source typo flagged: `swiper-scroll-css.html` had `width: aut0;` (should be `auto`).
