---
title: "G2 Proof Marquee"
source: global-embeds/g2-proof/g2-proof.js
---

Source: `global-embeds/g2-proof/g2-proof.js` (**v1.59.514**). No stylesheet ships
with this script; the structural CSS lives in Webflow.

## What it is

The looping testimonial strip: rows of review cards that slide sideways forever,
slowing down while you hover or tab into them. Each row is one GSAP tween on a
track, and the track is padded with cloned copies of its card list so the loop
never shows its end.

It replaces the inline embed that used to sit in the same section. The inline
version checked for GSAP once, while it was parsing, and gave up when it did not
find it. This script waits instead: the GSAP check lives in the run step, so a
run without GSAP simply returns and a later run arms the strip.

It lives inside the HTML embed of the **Testimonials** section component (that is
the Designer name; the component's root element carries the class
`section_g2-proof`). The component has 16 instances and no slots, so one edit to
that embed covers every instance.

Not the [Logo Wall](../logo-wall). Same continuous feel, different engine and
different markup. Also not `data-marquee="title-company"`, which is an unrelated
attribute that hides empty title@company slots on marquee cards.

## File structure

```
G2 Proof Marquee
└── g2-proof.js   builds and loops the card tracks; defer, CDN-served
```

CDN-served, not pasted as raw JavaScript into Webflow. The tag sits in the
Testimonials component embed:

```html
<script src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@v1.59.514/global-embeds/g2-proof/g2-proof.js" defer></script>
```

Pin the tag. Never use `@latest`: jsDelivr resolves `@latest` to the newest git
tag rather than the newest commit, and its edges have served a stale copy for
hours after a newer tag existed. To confirm which version a page is running, read
`window.G2ProofMarquee.release` in the console.

A second copy of the tag is harmless. The script guards on
`window.__g2ProofMarqueeInited` and the second copy returns immediately.

## GSAP

The script assumes `window.gsap` as a page global. On the V3 site that is
Webflow's native GSAP integration, which Webflow emits at the end of the body,
after this deferred script has already been parsed. That ordering is why the GSAP
check is deferred to the run step.

The run step fires:

- On `DOMContentLoaded`, if the document was still loading when the script ran.
- Immediately, if the document was already parsed.
- On window `load`, or on a double `requestAnimationFrame` when `readyState` is
  already `complete`.
- On window `resize`, debounced 120 ms, and only when a measured segment width or
  layout width actually changed.
- On a change to the reduced-motion media query.
- On a change to the hover-capability media query, if nothing has armed yet.
  Once tracks are running, that change only rewires the hover listeners.

A run that finds no GSAP logs one warning and returns without touching the DOM.
The next run picks GSAP up. The script captures the `gsap` object present when it
arms and uses no plugins.

Do not add another GSAP tag for this section. A second jsDelivr copy of GSAP
would double-load the library, and that was explicitly rejected.

## Markup contract

Classes are the contract and they are Designer-authored.

```html
<div class="card-marquee_layout">      <!-- row group; hover and focus target; overflow hidden -->
  <div class="card-marquee-wrapper">    <!-- one track; needs TWO .card-marquee_list children -->
    <div class="card-marquee_list">     <!-- one card segment -->
      <div class="card-marquee-item">...</div>
    </div>
    <div class="card-marquee_list">...</div>
  </div>
</div>
```

On the live site each `.card-marquee_list` is a Collection List whose Webflow
wrappers use `display: contents`.

**Clone fill.** The script deep-clones the first list and appends copies marked
`data-marquee-list-clone` until the wrapper's `scrollWidth` reaches the layout
width plus one segment width. Every rebuild strips the old clones first. The cap
is 24 copies. Hitting the cap means the track is still short of that width and
its end can show, so a staging warning fires: `Clone cap reached; track may show
its end (check the section CSS).`

**Two lists are required.** With fewer than two `.card-marquee_list` elements
after the fill, that track is skipped and a staging warning fires: `Each
.card-marquee-wrapper needs two .card-marquee_list elements for a seamless loop.`

**Unmeasurable tracks are left alone.** A track whose first list or whose layout
measures under 1 px wide gets no clones and no tween, until a later run finds it
measurable.

## Motion

Each track is a single GSAP tween on the wrapper's `x`, linear ease, infinite
repeat, with `duration = segment width / speed`.

Forward tracks start at `x` 0 and tween to minus one segment width, so cards
travel toward the left. Reverse tracks start at minus one segment width and tween
to 0, so cards travel toward the right.

Without an override, tracks alternate by their index inside the layout: index 0
forward, index 1 reverse, and so on.

## xAttribute JSON

Speed and direction go on the wrapper (the track):

```json
{
  "data-marquee-speed": "50",
  "data-marquee-reverse": ""
}
```

Hover behaviour goes on the layout (the row group):

```json
{
  "data-marquee-hover-scale": "0.25"
}
```

Turning one track off, on the wrapper or any ancestor:

```json
{ "data-marquee-pause": "" }
```

## API

| Attribute | Where | Required | Default |
| --- | --- | --- | --- |
| `data-marquee-speed` | wrapper | no | `50` px per second |
| `data-marquee-forward` | wrapper | no | off; presence only |
| `data-marquee-reverse` | wrapper | no | off; presence only |
| `data-marquee-pause` | wrapper or any ancestor | no | off; presence only |
| `data-marquee-hover="off"` | layout | no | hover slowdown is on |
| `data-marquee-hover-scale` | layout | no | `0.25` |
| `data-marquee-fade="off"` | layout | no | CSS only, never read by the script |
| `data-marquee-list-clone` | clone copies | script | not authored |
| `data-marquee-armed` | wrapper | script | not authored |

Notes on the values:

- **Speed.** Blank, `NaN` or a non-positive number falls back to `50`.
- **Direction.** `data-marquee-forward` wins over `data-marquee-reverse`. Both are
  presence-only; the value is ignored.
- **Pause.** The wrapper is skipped entirely: no clones and no tween.
- **Hover scale.** This is the `timeScale` applied while the layout is hovered or
  focused. `"0"` pauses the row, `"1"` is a no-op. `NaN` or a negative number
  falls back to `0.25`.

## Hover and focus

Wired per layout, not per track. Pointer enter and leave are only bound on
devices matching `(hover: hover) and (pointer: fine)`. Focus in and out always
apply, and focus out only restores full speed once focus has left the layout.

The scale is applied to every track inside that layout. A scale that is currently
being held survives a rebuild under a stationary pointer, so the row does not
snap back to full speed while the cursor is still on it.

Hover slowdown needs `AbortController`. Without it the slowdown is disabled and a
staging warning fires.

## Reduced motion

With `prefers-reduced-motion: reduce`, the run step tears everything down and
returns before building anything, so the strip is the authored static markup with
no clones and no tweens.

The preference is observed, not just read once. Switching it on while the strip
is running tears the rows back to static. Switching it off arms them.

## Output markers

Script-owned. Never author these.

- `data-marquee-list-clone` on each appended copy.
- `data-marquee-armed` on a wrapper whose tween is running, removed on teardown.
- `window.G2ProofMarquee = { release: "v1.59.514", armed: <boolean> }`, where
  `armed` is `true` once at least one track has a tween.

## Re-arming

A `ResizeObserver` on each track's first list re-arms that track when the segment
width changes. The debounced window `resize` handles layout-width changes, and it
only rebuilds when a width really moved. That check matters on iOS: collapsing
the URL bar fires `resize` with every width unchanged, and rebuilding would
restart every row from its start position in view.

## When GSAP never arrives

The strip stays static, exactly as authored: no clones, no inline transforms, no
armed markers. `window.G2ProofMarquee.release` is still set, because it is written
before any bail, so you can still tell which version is on the page.

The warning is:

```
[g2-proof] GSAP not found; retrying on the next run (load/resize/hover change).
```

It is logged at most once per page, and it is dev-host gated: `localhost`,
`127.0.0.1`, `*.webflow.io`, `*.trycloudflare.com`, or
`window.STARTERS_DEBUG === true`. Production consoles stay silent.

## Structural CSS

The structural CSS is not shipped from the CDN. On the live site it is Webflow
class styling: `.card-marquee_layout` is a flex column with `overflow: hidden`,
`.card-marquee_list` is a nowrap flex row with `flex: none`, and
`.card-marquee-item` has a fixed width.

### Edge fade

`data-marquee-fade="off"` on the layout is meant to remove an edge-dissolve mask.
The script never reads this attribute. The rule exists only in a mirror
stylesheet, `g2-proof/g2-proof.css` in the personal embeds repo, which is not
deployed. That stylesheet defines the mask on `.card-marquee_layout` through four
custom properties:

| Custom property | Default |
| --- | --- |
| `--marquee-fade-in` | `4%` |
| `--marquee-fade-mid1` | `16%` |
| `--marquee-fade-mid2` | `84%` |
| `--marquee-fade-out` | `96%` |

As of 2026-09-04 the live site carries neither the mask rule nor the custom
properties, and there is no `[data-marquee-fade]` rule in either Webflow
stylesheet. So the attribute currently does nothing. It only starts working once
that CSS is added to the section's Webflow style embed.

## Notes & gotchas

- **Finding it in Designer.** The component is named "Testimonials". The class on
  its root element is `section_g2-proof`. Look for it by the component name,
  not by the class.
- **The Why Us page was a false positive.** Before this script existed, the
  inline embed happened to work there only because another section on that page
  loaded its own GSAP earlier in the document.
- **`data-marquee="title-company"` is unrelated.** It hides empty title@company
  slots on marquee cards and has nothing to do with this script.
- **Not the Logo Wall.** Same feel, different engine and different markup.
- **Resize restarts are deliberate.** A rebuild resets every track to its start
  position, which is visible, so the resize handler measures first and only
  rebuilds when a segment or layout width actually moved.
