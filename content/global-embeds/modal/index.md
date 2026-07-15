---
title: "Modal"
source: global-embeds/modal
---

Source: Webflow, `Global Embeds / Modal`

## What it is

Modal system built on the native `dialog` element (`showModal()` / `close()`), with GSAP open/close
animations, scroll locking, focus restore, and a small global API at `window.lumos.modal`. On
`DOMContentLoaded` it inits every `.modal_dialog` on the page (idempotent via
`data-script-initialized`).

Per modal it supports three animation variants (centered default, side panel, full screen), opens
via trigger attributes or plain anchor links, closes on Escape, close buttons, or a global
close-all trigger, and can auto-open from a `modal-id` URL parameter. Custom `modal-open` and
`modal-close` events are dispatched on `window` for other scripts to hook into (see
[Reset on Close](./reset-on-close.md)).

The companion CSS keeps the native `::backdrop` invisible (the design's own `.modal_backdrop`
element is animated instead) and adds Designer-only rules so modals can be previewed while editing.

## File structure

```
Modal
├── Modal - CSS
└── Modal - JS
```

GSAP is optional. Load it first if you want animations; without it modals still open and
close, just instantly.

## Markup contract

```html
<!-- Anywhere on the page -->
<button data-modal-trigger="signup">Open modal</button>
<!-- or a plain link: -->
<a href="#signup">Open modal</a>

<dialog class="modal_dialog" data-modal-target="signup"
        data-wf--modal--variant="side-panel">
  <div class="modal_backdrop"></div>
  <div class="modal_content">
    <div class="modal_slot" data-modal-scroll>
      …modal content…
      <button data-modal-close>Close</button>
    </div>
  </div>
</dialog>
```

The modal element must have the class `modal_dialog` and a unique `data-modal-target` id. The GSAP
timelines animate elements with classes `modal_backdrop`, `modal_content`, and (full-screen variant
only) `modal_slot`, scoped to that modal.

## API

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-modal-target="id"` | the `.modal_dialog` element | Unique id linking triggers to this modal. |
| `data-wf--modal--variant` | the `.modal_dialog` element | `side-panel` (slides in from the right), `full-screen` (fades content, then slot), or anything else / absent (fade + rise from below). |
| `data-modal-trigger="id"` | any element | Click opens the matching modal. |
| `href="#id"` | any anchor | Anchors whose hash matches a modal id also open it (default navigation prevented). |
| `data-modal-close` | any element inside the modal | Click closes the modal (animated). |
| `data-close-all-modals` | any element | Click closes every currently open modal on the page. |
| `data-modal-scroll` | scrollable elements inside the modal | Scroll position is reset to the top every time the modal opens. |

| JS API (`window.lumos.modal`) | Description |
| --- | --- |
| `open(id)` | Open the modal registered under `id`. |
| `closeAll()` | Close all modals that are currently open. |
| `list` | Map of id → object with `open`, `close`, and `el` (the dialog element). |
| `init()` | Re-scan the page for new `.modal_dialog` elements (safe to call after injecting content). |

| Event (on `window`) | When |
| --- | --- |
| `modal-open` | After the modal opens; `event.detail.modal` is the dialog element. |
| `modal-close` | After the close animation finishes and the dialog is closed; same `detail`. |

| URL parameter | Behavior |
| --- | --- |
| `?modal-id=id` | Opens the matching modal on load, then removes the parameter from the URL via `history.replaceState`. |

## Notes & gotchas

- Escape is intercepted (`cancel` event, default prevented) so closing always runs the reverse
  animation instead of snapping shut.
- Scroll locking prefers Lenis: if a global `lenis` instance exists it is stopped/started;
  otherwise `overflow: hidden` is toggled on `body`.
- Focus is saved on open and restored to the previously focused element on close.
- Trigger clicks are handled by a document-level listener per modal, so triggers added to the DOM
  later still work, but modals added later need `window.lumos.modal.init()`.
- Every anchor with `href="#id"` matching a modal id becomes a trigger and its default jump is
  prevented; avoid reusing modal ids as ordinary section anchors.
- The Designer-only CSS shows a `.modal_dialog` when it has no component instance child or when it
  carries `data-preview="True"`, and hides it when `data-preview="False"`: a Designer preview
  toggle, with no effect on the published site.
