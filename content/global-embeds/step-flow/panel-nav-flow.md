---
title: "Panel Nav Flow"
source: global-embeds/step-flow/panel-nav-flow.js
---

Source: Webflow, `Global Embeds / Step Flow / Panel Nav Flow`

## What it is

Panel navigation for step flows (`panel-nav-flow.js`). It swaps visibility between sibling panels
inside a `[data-panel-parent]` scope, typically a hub panel (`reset-panel`) and whole flow roots
(`data-form-flow="pause-membership"`, etc.). Each parent keeps its own history stack so a
`data-panel-nav-back-button` returns to whichever panel was shown before. Panels are toggled with
instant `display` changes; there is no slide animation.

It complements [Step Flow](./index.mdx) with a clean division of labor: Panel Nav
Flow moves between **whole panels** (hub ↔ flow), Step Flow moves between **steps inside one
flow**. Step Flow also listens for `data-panel-nav-target` clicks and resets the targeted flow to
step-1, so opening a flow from the hub always lands on its first step. You only need this script
when a hub launches into separate flows; a single standalone wizard needs Step Flow alone.

## File structure

```
Step Flow
└── Panel Nav Flow - JS
```

Use on pages with the hub pattern, together with `Step Flow - JS` and `Step Flow - CSS`
(see [Step Flow](./index.mdx)); the Step Flow CSS also keeps child flows of
`main-container` hidden before hydration, preventing a flash of all panels on load.

## Markup contract

```html
<div data-panel-parent>
  <div data-form-flow="main-container">
    <!-- Hub panel: shown on load (Step Flow shows it; this script hides the flows) -->
    <div data-form-flow-element="reset-panel">
      <button data-panel-nav-target="pause-membership">Pause membership</button>
      <button data-panel-nav-target="cancel-membership">Cancel membership</button>
    </div>

    <!-- One panel per flow; the id is what data-panel-nav-target points at -->
    <div data-form-flow="pause-membership" data-panel-nav-display="contents">
      <button data-panel-nav-back-button>Back</button>
      …flow steps (see Step Flow)…
    </div>

    <div data-form-flow="cancel-membership" data-panel-nav-display="contents">
      <button data-panel-nav-back-button>Back</button>
      …flow steps…
    </div>
  </div>
</div>
```

Requirements found in the code:

- Panels are looked up by `data-form-flow` id **inside the same** `data-panel-parent`; a
  `data-panel-nav-target` value with no matching panel logs a `console.warn` and does nothing.
- The panel that gets hidden is the direct child of `data-panel-parent` that contains the clicked
  trigger (or, when the trigger sits inside `data-form-flow="main-container"`, the direct child
  of that container). Keep each panel as a direct child of one of those two wrappers.
- On init the script hides every `[data-form-flow]` panel inside the parent except
  `main-container` itself. The hub (`reset-panel`) is left alone; Step Flow shows it.

## API

| Attribute | Where | Purpose |
| --- | --- | --- |
| `data-panel-parent` | Wrapper (e.g. modal section) | Navigation scope; one click listener and one back-history stack per parent. |
| `data-panel-nav-target="flow-id"` | Button / link | Shows the panel whose `data-form-flow` equals the value, hides the current panel, and pushes it onto history. An empty value warns and is ignored. |
| `data-panel-nav-back-button` | Button / link | Pops history: hides the current panel and re-shows the previous one. Does nothing (and does not `preventDefault()`) when history is empty. |
| `data-panel-nav-display` | Panel | Display used when the panel is shown: `block`, `flex`, `grid`, `inline-flex`, `inline-block`, `contents`. Invalid or missing values fall back to the stored computed display, then `block`. |
| `data-panel-nav-stored-display` | Panel (JS-set) | Cache of the panel's computed `display`, captured before the first hide and reused on show. |
| `data-script-initialized` | Parent (JS-set) | Init guard; re-running the script won't double-bind. |

There is no JS API; the script is attribute-only.

## Notes & gotchas

- **Hidden panels are marked for assistive tech**: `aria-hidden="true"` when hidden,
  `aria-hidden="false"` when shown. There is no focus management; after a swap, focus stays on the
  clicked trigger.
- **History is in-memory per parent.** It does not touch the browser URL or history; a page
  refresh returns to the initial state (hub visible, flows hidden).
- **Back button semantics differ from Step Flow's `back` action.** `data-panel-nav-back-button`
  returns to the previous *panel*; Step Flow deliberately ignores clicks inside
  `data-panel-nav-back-button`, so the two never fight over the same control. Don't combine it
  with `data-form-flow-action` on one element.
- **Initial visibility relies on Step Flow.** This script hides flow panels on init but never
  shows the hub; `data-form-flow="main-container"` + `reset-panel` handling lives in
  `step-flow.js`. Use both scripts for the hub pattern.
- **Panels swap instantly** (`display` toggle only). If a panel needs `display: contents` or
  `flex` when shown, declare it with `data-panel-nav-display`; otherwise the first computed
  display is cached and reused, and a panel that starts hidden by inline style would fall back to
  `block`.
- **Idempotent** via `data-script-initialized` on each `data-panel-parent`; safe to include the
  embed twice.
- `e.preventDefault()` is only called when a swap actually happens, so link-based triggers with a
  bad target will still follow their `href`; prefer buttons for nav triggers.
