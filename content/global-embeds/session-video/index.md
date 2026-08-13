---
title: "Session Video"
source: global-embeds/session-video/session-video.js
---

Source: `global-embeds/session-video/session-video.js` (**v1.59.203**)

## What it is

The Learn Sessions hero player (`/learn/sessions/<slug>`): a free preview for logged-out
visitors, and the site's signup modal as the wall after it.

**It replaces the template's inline hero-video script — do not run both.** Two players of the
same video, only one of them clamped, makes the gate decorative.

Three phases:

| Phase | Trigger | Behaviour | Gate |
| --- | --- | --- | --- |
| Background | mount | Autoplays muted and loops inside the first `data-session-video-bg` seconds (default 20). No controls, no sound, no full screen. | **Not armed** |
| Watch | click `[data-element-trigger="show-video"]` (also `#videoClickOverlay` or `#playPauseBtn` while unarmed) | Overlay hides, controls appear, sound on, looping stops. Playback **continues from the ambient position** — it does not restart. | Armed |
| Clamp | playback reaches `data-session-video-cut` seconds (default 180) | Playback freezes, position is pinned at the cut, and the hidden signup trigger is clicked. Dismissing the modal leaves the frame frozen; any play attempt reopens it. | Enforced |

A member never reaches the clamp and gets the whole video, full screen included.

The ambient phase must **not** arm the gate: a loop left running would cross the cut on its own
and throw the wall at somebody who never asked to watch. The loop is also capped inside the
teaser window, or a page left open rolls past the cut muted and the watch click freezes instantly.

CDN-served, loaded with `defer` in the Learn Sessions template before `</body>`:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/global-embeds/session-video/session-video.js"></script>
```

Production may pin `@vX.Y.Z` instead of `@latest`.

With no `[data-session-video="root"]` the script returns immediately and leaves the page as
authored. Several roots on one page are independent.

## File structure

```
Session Video
└── session-video.js
```

The script loads Vimeo's `https://player.vimeo.com/api/player.js` itself. There is no companion
CSS in this folder — template CSS must still size the built iframe (existing
`.hero-video-wrap iframe` keeps working if the stage sits in that wrap) and hide
`#fullscreenBtn[data-sv-fullscreen="hidden"]`.

## Markup contract

Found by **attribute or id only, never by class**. Designer-authored:

```html
<div
  data-session-video="root"
  data-session-video-id="123456789"
>
  <div data-session-video="stage">
    <!-- iframe is built here. Optional [data-sv-poster] cover image inside. -->
  </div>

  <!-- Absorbed from the template — pre-existing, do not rename -->
  <div data-element="hero-element">…overlay…</div>
  <div data-element-trigger="show-video">Watch</div>
  <div id="video-controls">
    <div id="playPauseBtn"></div>
    <div id="muteBtn"></div>
    <div id="fullscreenBtn" data-ms-content="members"></div>
  </div>
  <div id="videoClickOverlay"></div>

  <!-- Hidden; carries modal.js's data-modal-trigger. No modal id lives in this file. -->
  <div hidden data-session-video="signup-trigger" data-modal-trigger></div>
</div>
```

A root without `data-session-video-id` is skipped. Without a stage, nothing mounts. Without
`signup-trigger`, the wall cannot open (staging warning).

Id-based controls are resolved **inside the root first**, then the document, so two roots do not
share one `#playPauseBtn`.

## xAttribute JSON

Applying the hooks with the **xAttribute** Webflow app (by xAtom)? Select the element in the
Designer and paste the matching block.

Root — `data-session-video-id` is required (CMS-bound). Cut, bg, and native-min are optional:

```json
{
  "data-session-video": "root",
  "data-session-video-id": ""
}
```

Stage and signup trigger:

```json
{ "data-session-video": "stage" }
```

```json
{ "data-session-video": "signup-trigger" }
```

Watch control (absorbed template hook):

```json
{ "data-element-trigger": "show-video" }
```

Hero overlay:

```json
{ "data-element": "hero-element" }
```

## API

| Attribute | On | Values | Default | Purpose |
| --- | --- | --- | --- | --- |
| `data-session-video` | root / stage / signup-trigger | `"root"`, `"stage"`, `"signup-trigger"` | — | Marks the three authored parts. |
| `data-session-video-id` | root | Vimeo id | — | Required. CMS-bound to `id-video-for-waching`. |
| `data-session-video-cut` | root | seconds | `180` | Logged-out freeze point. Empty or unusable falls back. |
| `data-session-video-bg` | root | seconds | `20` | Ambient loop length. Empty or unusable falls back. |
| `data-session-video-native-min` | root | px | `768` | Minimum **stage** width for Vimeo's own controls. Measured once at mount via `getBoundingClientRect`. |
| `data-element-trigger` | watch control | `"show-video"` | — | Absorbed. First click arms the gate. |
| `data-element` | overlay | `"hero-element"` | — | Absorbed overlay. |
| `data-modal-trigger` | signup-trigger | modal name | — | Authored for [Modal](../modal/index.md). This file only clicks the element. |
| `data-sv-poster` | optional image inside the stage | — | — | Cover; retired when `data-sv-video="ready"`. Never retired if the video never loads. |

State attributes, written for template CSS — never classes:

| Attribute | On | Values | Meaning |
| --- | --- | --- | --- |
| `data-sv-player` | root | `native` \| `custom` | Which UI is in charge. `native` is the cue to lift `pointer-events` onto the iframe and hide `#videoClickOverlay` plus the template bar. |
| `data-sv-video` | root | `loading` \| `ready` | `ready` once the video is genuinely playing (no-library member path writes `ready` at mount). |
| `data-sv-overlay` | `[data-element="hero-element"]` | `visible` \| `hidden` | Overlay. |
| `data-sv-controls` | `#video-controls` | `visible` \| `hidden` | Template control bar. |
| `data-sv-play` | `#playPauseBtn` | `playing` \| `paused` | Playback. |
| `data-sv-mute` | `#muteBtn` | `on` \| `off` | `on` means muted. |
| `data-sv-fullscreen` | `#fullscreenBtn` | `visible` \| `hidden` | `visible` only for an ungated viewer holding a player object. This file never writes inline `display` on that button. |

`window.StartersSessionVideo` exposes `status()` and `reveal()` (force the wall).

## Notes & gotchas

- **Do not run this and the template inline hero-video script together.** Remove the inline
  script; this module absorbs that player's controls.
- **Ambient must not arm the gate.** Arming on the watch click is what stops a background loop
  from throwing the signup wall on its own.
- **Fails closed**, unlike [Learn CTA Gate](../learn-cta-gate/index.md). A clamped member reloads
  and recovers; a leaked video is gone. If the player library never arrives, a gated viewer gets
  nothing rather than the whole video. A confirmed member still gets a player on a no-API path
  (forced native regardless of width).
- **Membership comes from `$memberstackDom.getCurrentMember().data`, never from
  `window.memberReady`'s resolved value.** On this site `memberReady` resolves `{}` for every
  visitor. Treating that as the answer made `!!{}` true for everyone (`@release v1.59.170` was
  inert). Await `memberReady` for *when*, then ask `getCurrentMember` and test `data`.
- **Mounts gated first, then upgrades.** Fullscreen permission is evaluated at iframe load and
  never re-evaluated, so a member rebuilds the frame. Membership resolution runs in parallel with
  the player-library load, not chained behind it.
- **Native Vimeo controls** need a member *and* a stage at least `data-session-video-native-min`
  px wide (default 768). Below that, Vimeo's bar overflows and drops full screen (measured at
  375px); everyone gets the template controls. Width is the stage, not the window. A rotation
  cannot change `controls` without rebuilding the frame.
- **`#fullscreenBtn` must carry `data-ms-content="members"`**, and template CSS must include
  `#fullscreenBtn[data-sv-fullscreen="hidden"] { display: none }`. This file writes the attribute
  only — an inline `display` from us on an element Memberstack meant to hide is how a members-only
  control leaks.
- Template controls are `<div>`s; the script gives them `role="button"`, `tabindex`, and
  Enter/Space itself.
- The freeze is idempotent and pins position: the player keeps reporting `timeupdate` after
  `pause()`, and those events must not drift past the wall. Re-opening the wall is the job of a
  *play attempt*, not of arriving at the cut again. Keyboard seek and PiP are off on gated frames
  on purpose.
- Window events (once each for start and wall): `session-video-preview-start`,
  `session-video-wall`, `session-video-complete`. Detail includes `videoId`, `cut`, `bg`, `gated`,
  `armed`, `position`.
- Idempotent via `window.__startersSessionVideoBooted`.
- Staging-only diagnostics (`*.webflow.io`, `localhost`, `127.0.0.1`, `*.trycloudflare.com`, or
  `window.STARTERS_DEBUG === true`). Production is silent.
