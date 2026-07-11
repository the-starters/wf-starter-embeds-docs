---
title: "Reset on Close"
source: global-embeds/modal/reset-on-close.js
---

Source: Webflow, `Global Embeds / Modal`

## What it is

Small opt-in add-on for the [Modal](/global-embeds/modal) system: when a modal that contains a
Webflow form is closed after a successful submit, the page is reloaded. That reload naturally
resets the form and the success/error states for the next open.

It works by listening for the `modal-close` event that `modal.js` dispatches on `window`. On close
it checks the modal for a `.w-form` block and treats the submit as successful only when both are
true: the `form` element is hidden and the `.w-form-done` block is visible (Webflow's own success
behavior). Requiring both avoids false positives when `.w-form-done` is styled visible in the
Designer. A global guard (`window.__modalReloadOnSubmitInited`) makes the script safe to include
twice.

## File structure

```
Modal
└── Reset on Close - JS
```

Only reacts to the `modal-close` event; it does nothing without `Modal - JS` on the page.

## Markup contract

```html
<dialog class="modal_dialog" data-modal-target="signup"
        data-modal-reload-on-submit>
  <!-- normal modal content, including a Webflow Form Block (.w-form) -->
</dialog>
```

## API

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-modal-reload-on-submit` | the `.modal_dialog` element | Opt in to the reload-after-successful-submit behavior. Any value works except `off` or `false` (case-insensitive), which disable it. |

## Notes & gotchas

- Nothing happens on close if the form was not submitted successfully; the user can reopen the
  modal and continue where they left off.
- The reload is a full `window.location.reload()`; any other unsaved page state is lost too.
- Only the first `.w-form` inside the modal is checked.
