---
title: "Quiz Loader"
source: quiz-loader/quiz-loader.js
---

Source: `quiz-loader/quiz-loader.js` (loaded via jsDelivr CDN)

## What it is

The head-time companion for the `/quiz-results` **loading component**. It is small and does
exactly two jobs:

1. **A synchronous skip-on-refresh paint gate.** When this quiz run has already played the
   loader, the script injects a `<style>` that hides the loader host so the pre-rendered scene
   never paints.
2. **The "results ready" producer signal.** `quiz-results.js` calls
   `window.StartersQuizLoader.signalReady()` once the results are settled, and the React loading
   component dismisses.

The loading component itself is a Webflow **DevLink React component**; this file is only the
bridge between it and the page's plain scripts. It never writes storage — it only reads
`starterQuizPending` and `starterQuizLoaderPlayed`, both owned by other quiz code.

## File structure

```
quiz-loader/quiz-loader.js   (~190 lines)
```

**Load it in the `/quiz-results` page `<head>`, registered and _without_ `defer`.** The paint
gate has to run at parse time, before `<body>` exists — that is the whole point of the file. A
deferred tag runs after the document is parsed, by which time the pre-rendered loader has
already painted and the gate is pointless.

```html
<script src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/quiz-loader/quiz-loader.js"></script>
```

Run-once guard: a second load returns early once `window.startersQuizLoaderController` is set.

## Skip-on-refresh paint gate

At publish time DevLink **pre-renders** the loading component's current scene into a
`<code-island data-hydrate="true">` host (declarative shadow DOM). On a refresh that should *not*
replay the loader, that pre-rendered scene still paints from HTML until React hydration takes
over and removes it. To guarantee zero frames of the loader, the decision is made synchronously
in the head and, when skipping, a `<style>` (id `starters-quiz-loader-skip-gate`) hides the host
until React really removes it.

The run ID and the skip rule **duplicate the component's own `sessionStorage` rule by design**.
The component stays the authority after hydration; the gate governs only the pre-hydration paint
window the component cannot reach in time. The two rules must stay in sync.

```
runId  = String(JSON.parse(sessionStorage.starterQuizPending).updatedAt)  // else "no-pending"
skip   = sessionStorage.starterQuizLoaderPlayed === runId
```

An unparseable or missing pending payload is a normal case, not an error: it falls through to
the literal `"no-pending"` run ID. Any failure at all means **no gate** — the loader simply
plays, the same graceful degradation as before the gate existed.

### The `statusStep1` selector contract

The gate finds the loader host with:

```js
const loaderHostSelector = 'code-island[data-props*="statusStep1"]'
```

DevLink renders the component into a `<code-island>` whose `data-props` JSON attribute lists the
component's prop names. `statusStep1` is a stable, loader-specific prop name, so this substring
match targets the loader host without catching other code-islands on the page.

**Renaming that prop in the React component silently breaks the paint gate** (and vice versa).
If the prop changes on either side, this selector must change with it. Nothing throws; the
loader just starts replaying on refreshes it used to skip.

## Ready signal: flag before dispatch

`signalReady()` is the producer half of a deliberately tiny handshake, because the React
component may mount **before or after** the results finish:

1. The producer sets `window.__starterQuizResultsReady = true` **first**.
2. The producer then dispatches the `document`-level `CustomEvent` `starterQuizResults:ready`.

A late-mounting component reads the durable flag synchronously; an already-mounted one hears the
event. **Flag-before-dispatch** is what stops a late consumer from waiting forever for an event
that already fired — reversing the two lines reintroduces exactly that race. `signalReady()` is
idempotent: repeat calls are no-ops.

| Surface | Value |
| --- | --- |
| `window.StartersQuizLoader.signalReady()` | Producer entry point, called by `quiz-results.js`. |
| `window.__starterQuizResultsReady` | Durable boolean flag, set before the event. |
| `starterQuizResults:ready` | `CustomEvent` dispatched on `document`. |

The script preserves any object a peer or earlier script already placed on
`window.StartersQuizLoader` and only adds (or refreshes) its own `signalReady` surface.

## Notes & gotchas

- **Diagnostics are staging-only.** `[Starter Quiz Funnel] [loader]` logs print on
  `*.webflow.io`, `localhost`, `127.0.0.1`, and `*.trycloudflare.com`. Force them on or off with
  `window.STARTERS_QUIZ_LOADER_DEBUG = true | false`; production is silent.
- **This file never writes `sessionStorage`.** If a skip decision looks wrong, the bug is in
  whoever wrote `starterQuizPending` (see [Quiz Funnel](./quiz-funnel.md#storage-keys)) or in the
  component that writes `starterQuizLoaderPlayed`.
- Nothing here is an access gate. A visitor who should not be on `/quiz-results` is handled by
  `quiz-results.js` and `v3/route-guard.js`.
