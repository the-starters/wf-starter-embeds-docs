---
title: "Section Custom TOC"
source: utils/section-custom-toc/section-custom-toc-main.js
---

Source: `utils/section-custom-toc/section-custom-toc-main.js` (companion stylesheet:
`utils/section-custom-toc/section-custom-toc-main.css`)

## What it is

A horizontal bar of hand-authored links that tracks which page section is in view, marks the
matching link active, and scrolls that link into view inside the bar. Any number of bars per
page, zero per-page JS config: link text is authored in Webflow and the script never writes it.

Everything visual belongs to Webflow classes. The stylesheet is structural only — it makes the
bar a scroller with no visible scrollbar, shrink-wraps the list so the centering opt-in can
work, and ships a deliberately minimal `[data-toc-active='true']` rule that any Webflow class
can override.

## File structure

```
utils/section-custom-toc/section-custom-toc-main.js    the bar: spy, click-scroll, hash landing
utils/section-custom-toc/section-custom-toc-main.css   structural styles (scroller + centering)
utils/section-custom-toc/hide-empty-sections.js        optional companion, documented separately
```

Load both with `defer` from jsDelivr. Run-once guard: `window.__startersSectionTocInit`.

## Markup contract

```html
<!-- the navbar (recommended) -->
<div class="navbar" data-toc-navbar>…</div>

<!-- the bar -->
<div data-toc-element="wrapper" data-toc-align="center" data-toc-spy-zone="0.3">
  <div data-toc-element="list">
    <a data-toc-element="link" data-toc-id="overview" href="#overview">Overview</a>
    <a data-toc-element="link" data-toc-id="reviews" href="#reviews">Reviews</a>
  </div>
</div>

<!-- the sections, anywhere in the document -->
<section data-toc-section="overview" id="overview">…</section>
<section data-toc-section="reviews" id="reviews">…</section>
```

Sections do not have to be siblings of each other or sit near the bar; they are matched by
value, not by position. `[data-toc-element="list"]` is the inner flex container, at any depth
inside the wrapper — optional, but the CSS centering opt-in needs it. Without it the wrapper is
treated as the list and `data-toc-align="center"` does nothing.

## API

| Attribute | On | Values | Purpose |
| --- | --- | --- | --- |
| `data-toc-element` | wrapper, list, link | `wrapper` \| `list` \| `link` | Declares the role. One controller per wrapper. |
| `data-toc-id` | link | a section name | Pairs the link with its section. |
| `data-toc-section` | section | the same name | The section a link points at. Duplicates: first in document order wins. |
| `data-toc-navbar` | the site navbar(s) | present | Its live height is added to the offset. Tag **as many stacked bars as cover the top of the page** — the heights add up. |
| `data-toc-ignore-navbar` | wrapper | present = on, `="false"` = off | Leaves every navbar out of that bar's offset. |
| `data-toc-offset` | wrapper | px, default `0` | **Extra** offset on top of the navbar, not a replacement for it. |
| `data-toc-spy-zone` | wrapper | `0`–`0.8`, default `0.3` | How far down the free viewport the scroll-spy line sits. |
| `data-toc-align` | wrapper | `center` | Centers the links while they fit, falling back to a left-aligned scroller once they overflow. Pure CSS. |

Written by JS: `data-toc-active="true"` on the active link (removed entirely from the others,
never set to `"false"` — style it in Webflow), and `data-toc-inited="true"` on a wrapper that
has a controller.

With nothing tagged `data-toc-navbar`, the script falls back to Webflow's own `.w-nav`, a
single element.

## How the offset and the spy line are computed

The **offset** is where a clicked section lands, summed live on every pass from three parts:
`data-toc-offset`, plus the combined height of the navbars that are `fixed`/`sticky` *right
now*, plus the wrapper's own height when the wrapper is itself sticky or fixed. Nothing is
cached, so a navbar that is fixed on desktop and static on mobile, or hidden at some
breakpoint, needs no per-breakpoint config: a bar that isn't currently stuck contributes
nothing and a hidden one measures 0.

Two navbars are deliberately excluded from a bar's own offset. A tagged bar that **is** the
wrapper never counts, because the sticky-self rule already measures it. A tagged bar that merely
**contains** the wrapper is skipped only while the wrapper is itself sticky or fixed — a static
TOC strip inside a sticky profile header counts that header in full, because nothing else
measures it.

The **spy line** is the offset plus 2px of slack plus `data-toc-spy-zone` of whatever viewport
is left below the chrome. The default `0.3` means a section takes the highlight once its top
reaches 30% into the free viewport, which is what makes a screen-filling section read as active
while a hero still sitting above it does not. `0` puts the line hard against the bars. Values
outside `0`–`0.8`, and anything unparseable, fall back to `0.3`.

The zone moves the **spy line only**. Click-scroll landings and hash corrections use the offset
alone, so retuning the highlight never moves where a clicked section lands.

## Multiple bars on one page

Every wrapper computes its own offset and its own spy line. That is by design — a sticky bar and
an in-flow bar sit in different contexts — but it means two bars tracking the same sections only
highlight in lockstep when their **effective** offsets match. The navbar contribution is
identical for both, so only the differing parts need reconciling: a sticky bar 58px tall
resolves to navbar + 58, so an in-flow bar alongside it needs `data-toc-offset="58"` to agree.

## JS API

```js
window.StartersSectionToc.refresh()
```

Re-scans for new wrappers, re-resolves every link's section, and re-runs the spy without
animating the bar. Call it after late-added links or sections land — Webflow CMS renders, tabs,
filters.

## Notes & gotchas

- **No link is active above the first section.** While every section top is still below the spy
  line, the bar shows no highlight, which is the honest answer for a hero filling the screen.
- **Hidden sections take no part.** A `display: none` section measures a top of `0`, which clears
  the spy line from the very first pixel and would hold the highlight for ever — so a REVIEWS
  panel emptied by [Hide Empty Sections](./hide-empty-sections.md) can never steal the active
  state. Webflow's `display-contents` wrappers are the exception and count as rendered whenever
  anything inside them does.
- **Page bottom is special-cased.** A short final section can never reach the spy line, so at max
  scroll the last *visible* section always wins.
- **A link whose `data-toc-id` matches no section is left completely alone** — no
  `preventDefault` — so cross-page TOC links keep working.
- **Clicks never jump natively.** A resolving link smooth-scrolls the page and updates the URL
  with `history.replaceState` when the section has an `id`. During the scroll the spy stands down
  so it cannot fight the animation; `scrollend` releases the lock early where supported and a
  1s timer is the fallback for Safari.
- **A `#hash` landing is re-anchored** below the offset, since the browser's native jump ignores
  sticky chrome. It fires only while the page is still within 4px of where the browser dropped
  it, so it can never yank a page the visitor has already scrolled, and it re-checks on `load`
  because fonts and images move every section.
- **The bar only scrolls when the active link is not already fully visible** (2px slack), so an
  overflowing bar rests where it is instead of creeping on every section change, then animates
  the link to center once it would fall out of view.
- **Reduced motion is respected** — `prefers-reduced-motion: reduce` makes every programmatic
  scroll instant, checked per scroll rather than cached.
- **Keep active indicators inside the bar's box.** The wrapper pins `overflow-y: hidden` so a
  stray vertical scrollbar can't appear, and any non-visible overflow clips vertically.
- **Staging-only diagnostics.** On `*.webflow.io`, localhost, or a cloudflared tunnel, the script
  warns (prefixed `[section-toc]`) about a link with no `data-toc-id`, a link whose id matches no
  section, and a wrapper with no links. Production consoles stay clean; force them with
  `window.STARTERS_DEBUG = true`.
