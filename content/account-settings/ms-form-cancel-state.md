---
title: "Cancel State"
source: account-settings/ms-form-cancel-state.js
---

Source: `account-settings/ms-form-cancel-state.js` (ships as `@release v1.59.91`)

## What it is

Shows one success message out of several, picked by the reason button the member clicked. It
exists because the cancel flow branches — a member who pauses, a member whose needs changed, and
a member who just cancels shouldn't all read the same confirmation — while Webflow gives a form
exactly one success div.

Nothing is submitted, fetched, or validated here: the script only decides which item inside
`.w-form-done` is visible.

Load it with `defer` in the page footer, after the Memberstack script:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/account-settings/ms-form-cancel-state.js"></script>
```

## Markup contract

Tag the Form Block, the buttons, and the messages:

```html
<div ms-form-cancel-state data-form-flow="cancel-membership" class="w-form">
  <form>
    <div data-form-flow-action="branch" data-form-flow-target="step-4a"
         ms-form-cancel-state-element="button"
         ms-form-cancel-state-change="needs"
         class="button_main-wrap">
      <div class="clickable_wrap"><button type="button" class="clickable_btn"></button></div>
      <div class="button_main-element"><div class="button_main-text">My needs changed</div></div>
    </div>
  </form>

  <div class="w-form-done">
    <div ms-form-cancel-state-element="success-wrapper">
      <div ms-form-cancel-state-element="success-item" ms-form-cancel-state-key="default">…</div>
      <div ms-form-cancel-state-element="success-item" ms-form-cancel-state-key="pause">…</div>
      <div ms-form-cancel-state-element="success-item" ms-form-cancel-state-key="needs">…</div>
    </div>
  </div>
</div>
```

## API

| Attribute | Goes on | Required | Purpose |
| --- | --- | --- | --- |
| `ms-form-cancel-state` | the Form Block (`.w-form`) | **Yes** | Marks one instance and scopes everything inside it. Its value is a free label; the opening state is always `default`. |
| `ms-form-cancel-state-element` | buttons, the success wrapper, the items | **Yes** | The role: `button`, `success-wrapper`, or `success-item`. |
| `ms-form-cancel-state-change` | the `.button_main-wrap` wrapper | **Yes** | The state **key** this button switches to. Must match a `ms-form-cancel-state-key`. |
| `ms-form-cancel-state-key` | each success item | **Yes** | Which state shows this item. `default` is what shows before anyone clicks. |

Written back, for CSS and QA: `ms-form-cancel-state-current` on the root (the live state) and
`aria-hidden` on every item. `ms-form-cancel-state-inited` marks a root that has had its first
paint.

## The root goes on the Form Block, not the `<form>`

Webflow emits `.w-form-done` as a **sibling** of the `<form>`, inside the `.w-form` Form Block,
so a root tagged on the form cannot see its own success items.

Ownership is strict: an element counts only when its **nearest** `[ms-form-cancel-state]`
ancestor is that root. That is what stops two cancel forms on one page — or a nested pair — from
reading or repainting each other. A root that contains no success items warns on staging rather
than widening its search; an earlier draft fell back to the enclosing `.w-form`, which coupled
behavior to a styling class and could let a root adopt items belonging to no root in an outer
block.

## A trigger needs both attributes

`ms-form-cancel-state-element="button"` **and** `ms-form-cancel-state-change="<key>"`. Either one
alone does nothing and says so on staging, so a half-tagged button is a loud mistake rather than a
silent one.

`-change` holds the state key and never the element role. A value of `button`,
`success-wrapper`, or `success-item` means the two attributes got swapped — the likeliest way to
author this wrong — and such a click is **inert**: it doesn't become a state named "button" and it
repaints nothing.

## The button is Webflow's `.button_main-wrap` component

Both attributes go on the **wrapper**, the same element `data-form-flow-action` and
`data-validate-element` already sit on. The click actually lands on the overlaid `.clickable_btn`
or on `.button_main-text`, never on the wrapper, so the trigger is resolved by walking up from
whatever was clicked. The inner `type` doesn't matter: branch buttons are `type="button"`, the
final Confirm is `type="submit"`, and both work because the click is never intercepted.

**A button the flow has gated never changes state.** step-flow and the tabs embed disable that
same wrapper by attribute (`data-button-theme="disabled"`, `data-form-flow-disabled`,
`aria-disabled="true"`) rather than by the native `disabled` property, so a gated Continue still
*receives* the click and is only `preventDefault()`-ed. This script checks those markers from the
trigger up to the root — never past it — and stands down, so the success message can't move for a
step the member never completed.

Nothing is inferred from labels or button styles the way step-flow does, so a tab control or
lookalike footer button is never hijacked.

## How it behaves

The key is the entire contract: `-change="needs"` shows every item keyed `needs` and hides the
rest, matched by value and never by DOM order or position. Keys are compared trimmed and
case-sensitively, so `Needs` and `needs` are two states. **Every** matching item shows, not the
first, so a heading and a card can share one key. `default` is reachable as a key like any other,
which is how a "Keep my membership" or reset button returns the block to its opening message.

A key with **no** item shows nothing and warns on staging. The contract is that only the matching
item shows, so a mistyped key is an authoring bug to surface, not something to paper over with a
different message; `-current` still reports the key that was clicked.

## `window.StartersMsFormCancelState`

| Key | Use |
| --- | --- |
| `release` | The tag this file ships in; matches the `@release` header. |
| `stagingHost(hostname)` | Whether a hostname counts as staging. |
| `diagnosticsEnabled()` | Whether this host warns. |
| `get(root)` | The root's current state key. |
| `set(root, key)` | Paint a state; returns the items left visible. |
| `refresh()` | Re-scan the page; returns the number of roots. |

`refresh()` gives new roots their first paint and repaints the state of roots already inited,
which is what picks up success items rendered after init — and what QA can call instead of faking
a click.

## Notes & gotchas

- **The switch happens at click time, not on submit.** The success div is in the DOM from page
  load — just hidden — so the right item is revealed before Webflow ever shows the block: no
  listener to wire, no race with the AJAX submit, and a member who changes their mind repaints
  immediately.
- **One delegated `document` listener in the capture phase** covers every root on the page, so
  buttons and items Webflow renders later need no re-init, and a `stopPropagation()` from a
  handler below can't swallow the state change.
- **The authored `display` is read before anything is hidden** and restored on show, so `flex`,
  `grid`, and `display: contents` all survive. An item hidden in the Designer computes to `none`,
  which nothing can be restored to, and falls back to `block`.
- **State is not persisted.** It survives Webflow's AJAX submit, which reveals the success div
  without a reload, but not a redirect or a page reload.
- **Why this isn't a step-flow capability.** step-flow never touches the success div — it manages
  steps inside the form, pre-submit, and `resetFlow()` deliberately clears its state on init, on
  `data-form-flow-action="reset"`, and on every panel-nav reopen. This state has to outlive the
  submit, so folding it in would mean bolting a reset-exempt second state concept onto an engine
  built on the opposite assumption. step-flow also ships to `/generate-contract`, which has no
  success messages to switch.
- **Staging-only diagnostics** (`*.webflow.io`, localhost, `127.0.0.1`, `*.trycloudflare.com`, or
  `window.STARTERS_DEBUG === true`) fire once per element, on the mistakes that are otherwise
  invisible: a key with no item, a root with no items, a half-tagged or swapped trigger, and a
  button outside every root.
- Safe to load twice; run-once guard `window.__startersMsFormCancelStateBooted`.
