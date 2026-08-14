---
title: "Logo Wall"
source: global-embeds/logo-wall/logo-wall.js
sources:
  - global-embeds/logo-wall/logo-wall.css
---

Source: `global-embeds/logo-wall/logo-wall.js` (**v1.59.240**) · companion stylesheet:
`global-embeds/logo-wall/logo-wall.css` (same `@release`)

## What it is

Attribute-driven **Logo Wall**: a CMS list of brand logos split into looping
horizontal **Tracks**. The motion is Marquee UX (continuous, no snap) — the same
*feel* as the homepage testimonials strip, not a shared engine and not that
strip's markup.

**The container is the mask.** The wrapper carries `overflow: hidden` and clips
its Tracks at whatever width the Designer gave it. The script never measures the
window, never sizes the wrapper, and never writes to an ancestor's styles. A
band that runs the full width of the screen is a layout choice you make in
Designer by putting the wrapper in a full-width section, exactly the way the
testimonials strip's card-marquee layout gets its width. Drop the same wrapper
inside a padded container and it clips to that container instead, with no
attribute change.

On init the script unwraps Webflow Collection List and `display: contents`
wrappers, deals the unique logos round-robin across Tracks (default 3, the
homepage uses 1), then clones each Track's own items on both sides until the
Track is wide enough. Cloning both sides is what leaves the unique set centered
in the band on the first frame. GSAP's `horizontalLoop` helper then seamless-loops
each Track. Even Tracks run LTR (logos travel toward the right); odd Tracks run
RTL, so a single-band wall runs left to right. Hover pauses that Track, an
off-screen wrapper pauses every Track, and `prefers-reduced-motion: reduce`
leaves the bands filled and centered but frozen.

GSAP must already be on the page (it is, sitewide). Without GSAP the Tracks still
build and stay centered; they just do not loop.

## File structure

```
Logo Wall
├── logo-wall.css   the mask and the Track layout; Head, before the JS
└── logo-wall.js    builds and loops the Tracks; defer before </body>
```

CDN-served, not pasted into a Webflow embed. Load the CSS in **Head** and the JS
with `defer` before `</body>` (or Footer Code), both from the same pinned ref:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@v1.59.240/global-embeds/logo-wall/logo-wall.css">
```

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@v1.59.240/global-embeds/logo-wall/logo-wall.js"></script>
```

Pin the tag rather than using `@latest`: CDN edges have served a stale `@latest`
for hours after a newer tag existed, and a hand-edited `@latest` path once
carried a leftover branch name that 404'd the stylesheet in production.

Both files carry a matching `@release` header, and the script publishes the same
string at `window.__startersLogoWall.release`. To confirm what a page is actually
running, read that property in the console or request the served files and grep
for `@release`.

## Markup contract

```html
<div class="logo-wall_list-wrapper" data-logo-wall-element="wrapper">
  <!-- Collection List; unwrapped on init -->
  <div class="logo-wall_logo-item" data-logo-wall-element="item">
    <img class="logo-wall_logo-image" alt="" />
  </div>
</div>
```

Omit every config attribute and you get 3 tracks, default speed, and
pause-on-hover. Put `data-logo-wall-element="item"` on the inner logo cell
(the first visible child of each Collection Item) so it survives unwrap.

`data-logo-wall-element="track"` is **script-owned**. Do not author it.

## xAttribute JSON

`wrapper` is the clipping container:

```json
{ "data-logo-wall-element": "wrapper" }
```

`item` is each logo cell:

```json
{ "data-logo-wall-element": "item" }
```

Optional config on the same wrapper node:

```json
{
  "data-logo-wall-element": "wrapper",
  "data-logo-wall-tracks": "3",
  "data-logo-wall-speed": "0.4",
  "data-logo-wall-pause-on-hover": "true"
}
```

## API

| Attribute | Where | Required | Default |
| --- | --- | --- | --- |
| `data-logo-wall-element="wrapper"` | clipping container | yes | — |
| `data-logo-wall-element="item"` | each logo cell | yes | — |
| `data-logo-wall-element="track"` | row | script | — |
| `data-logo-wall-tracks` | wrapper | no | `3` |
| `data-logo-wall-speed` | wrapper | no | `0.4` (~40px/s) |
| `data-logo-wall-pause-on-hover` | wrapper | no | on; set `false` to opt out |

Booleans are `"true"` / `"false"`. Alternate direction is always on: even Tracks
LTR, odd Tracks RTL.

## When the stylesheet is missing

Before it clones anything, the script checks that each Track computes as a flex
row (`inline-flex` counts too). That rule lives only in `logo-wall.css`, so a
Track that is not a flex row is proof the stylesheet never applied. In that case
the script leaves the original logos alone, strips any clones from an earlier
healthy arm, skips the animation entirely, and logs one warning.

What a visitor sees is the real logos, present and readable but unstyled, which
without the Track rule is usually a vertical stack rather than a row. That is
worse-looking than the wall but harmless, and it is a deliberate trade.

The warning is dev-gated (`*.webflow.io`, localhost, `trycloudflare.com`, or
`window.STARTERS_DEBUG === true`), so production consoles stay silent.

This guard exists because of a real incident: a hand-edited embed URL 404'd the
stylesheet, the Track fell back to block layout, and the old fill loop kept
cloning toward a width target it could never reach, turning 22 CMS logos into
roughly 550 DOM nodes stacked down the hero. The fix for an installer is the
stylesheet URL itself. Check that the `<link>` in Head resolves (open it
directly; a 404 page is the tell), that it points at the same pinned tag as the
script, and that no branch name or stray path segment crept into it.

Under the install documented above (stylesheet `<link>` in Head, script
deferred), a slow-but-successful stylesheet cannot trip this: stylesheets block
deferred scripts, so a sheet that is merely late has still applied by the time
the script runs. The guard fires on hard CSS failures, not slow ones. It re-runs
on every re-arm as defense in depth, but it is not a recovery path. Nothing
retries the stylesheet.

## Notes & gotchas

- **Classes do nothing.** Missing wrapper or zero `item` nodes is a no-op.
  After unwrap, any leftover child that is not an `item` skips that instance
  with a staging warning (`*.webflow.io` / localhost / `STARTERS_DEBUG`) — no
  class fallback.
- **Designer canvas is skipped** (`html.wf-design-mode`) so Collection Lists stay editable.
- **Designer owns the width, the size, and the gap.** The companion CSS makes the
  wrapper a centered column with hidden overflow and makes each Track a
  `max-content` flex row that inherits the wrapper's `column-gap`. It sets no
  width and no margins. The one sizing rule is `max-width: 100%` on the wrapper,
  which caps what the wrapper contributes to intrinsic sizing: `overflow: hidden`
  clips what paints but does not stop a shrink-to-fit parent from growing to the
  full cloned band and pushing the page wide.
- **The unique set starts centered.** Clones go on both sides of the originals
  until the Track is at least 2× the wrapper's own width, capped at 24 extra
  copies per side. That includes the reduced-motion freeze and the no-GSAP path,
  so a handful of logos still fill the container.
- **A single logo still loops** once the Track is filled; there is no “need two
  children” gate.
- **Images.** The script forces every in-wall image to load eagerly at init. Webflow authors CMS images as lazy, and logos clipped outside the visible band can never lazy-load, which used to deadlock arming. Loops arm once all images have loaded or errored; if any are still pending after 3 seconds the wall arms early (with a staging-only console warning) and re-arms exactly once when the stragglers finish, so slow assets delay full fidelity but never block motion.
- **Re-arming.** The wall rebuilds when the wrapper's own width changes, watched
  with `ResizeObserver` where available and a debounced `resize` listener as a
  fallback, and only when the measured width actually differs (an iOS URL bar
  collapsing fires `resize` without moving the wrapper, and rebuilding for that
  would be free churn). A `prefers-reduced-motion` flip also re-arms.
- **A hidden or zero-width wrapper is left untouched.** No clones, no transforms,
  no styles written. It arms itself the moment it gains real width, so a wall
  inside a tab, an accordion, or a `display: none` section works when revealed.
- **Off-screen Tracks pause** via `IntersectionObserver` on the wrapper (intended).
  Hover pause is per Track (`mouseenter` / `mouseleave` only).
- **Not the testimonials marquee** and not `data-marquee="title-company"` (that
  attribute hides empty title@company slots on marquee cards).
</content>
</invoke>
