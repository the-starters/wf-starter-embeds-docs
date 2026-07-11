---
title: "Modal Mobile"
source: starters-list-filter/modal-mobile.js
---

Source: `starters-list-filter/modal-mobile.js`

## What it is

A five-line layout kick for the mobile filter modal. When a `modal-open` event fires on
`window`, the script dispatches a synthetic `resize` event twice:

- once on the next `requestAnimationFrame` (after the modal is in the top layer and has
  layout), and
- once more after 450ms (after the open tween has finished).

Widgets inside the modal that measure themselves on `resize` (range sliders and similar) would
otherwise have been measured while hidden and render with zero/stale dimensions.

## File structure

```
Modal Mobile - JS
```

For pages that open the filter modal.

## Markup contract

None. The script binds to a window event, not to markup:

```js
// Whatever opens the modal must announce it:
window.dispatchEvent(new Event('modal-open'));
```

## API

| Event | Direction | Purpose |
| --- | --- | --- |
| `modal-open` (on `window`) | listened to | Triggers the double `resize` re-dispatch. |
| `resize` (on `window`) | dispatched | Fired twice so size-aware widgets recalculate. |

## Notes & gotchas

- It does nothing unless something actually dispatches `modal-open`; the modal-opening code
  is responsible for firing that event.
- The 450ms follow-up is tuned to the modal's open animation; a much longer tween would
  finish after the second recalc.
- Every `resize` listener on the page runs when this fires, not just the modal's widgets.
