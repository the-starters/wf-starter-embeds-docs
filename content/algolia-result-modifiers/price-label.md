---
title: "Price Label"
source: algolia-result-modifiers/price-label.js
---

Source: `algolia-result-modifiers/price-label.js`

## What it is

Shows the right price label on each expert card. Every card can contain two label elements
(one for "consult" pricing and one for "hire" pricing), and the script toggles between them based
on the card's expert type text.

For each `.expert-card_item` it reads the text of the `data-expert-type` element (trimmed,
lower-cased). If it equals `consult`, the consult label is shown and the hire label is hidden;
any other value (`hire`, `full`, or anything else) shows the hire label and hides the consult
label. Hiding is done with an inline `display: none !important`; showing removes the inline
`display` so the element's normal styling takes over.

## How it knows when to run

Two triggers, both always active:

1. A `MutationObserver` on **every** `wf-algolia-element="browse"` and
   `wf-algolia-element="results"` container on the page.
2. The engine's own `results` event, which wf-algolia emits after it has rendered hits.

Both are needed. The engine emits `results` from browse mode only, so the search overlay
(`.search-brilliance_results-wrapper`, which carries the `results` role) renders through a path
that fires no event at all; the observer is what covers it.

It waits for the global `WfAlgolia` API in short intervals with a ceiling of about two seconds,
then gives up and relies on the observer alone. Earlier versions polled every 100ms for a full
10 seconds on every page this file loaded on, which is why the ceiling exists.

Every pass is deferred through `requestAnimationFrame`. Note that a browser suspends
`requestAnimationFrame` in a background tab, so labels are applied when the tab is next
foregrounded rather than while it is hidden.

## File structure

```
Price Label - JS
```

Depends on the global `WfAlgolia` API, so load it after the WfAlgolia integration.

## Markup contract

```html
<div wf-algolia-element="results">
  <div class="expert-card_item">
    <div data-expert-type>consult</div> <!-- or "hire" / "full"; can be visually hidden -->
    <div data-type-label="consult">$150 / consult</div>
    <div data-type-label="hire">$8k / month</div>
  </div>
</div>
```

## API

No options.

| Hook | On | Purpose |
| --- | --- | --- |
| `.expert-card_item` | card | One result card; each is processed independently. |
| `data-expert-type` | text element | Source of truth for the card's type. A card without it is skipped. |
| `data-type-label="consult"` | label | Shown when the type is `consult`, hidden otherwise. |
| `data-type-label="hire"` | label | Shown for every type other than `consult`. |

For mutation-watching it observes **every** `wf-algolia-element="browse"` and
`wf-algolia-element="results"` container, with no precedence between them. There is no fallback
to a card's parent or to `body` any more: on `/all-starters` the served HTML carries five of each
role (the navbar and search overlay add their own), so picking a single first match was never
viable.

## Notes & gotchas

- If `window.WfAlgolia` never appears within about two seconds, the script stops waiting and
  relies on the container observer alone, so labels still toggle as results render.
- It stops immediately at boot if the page has no `.expert-card_item` and no `data-expert-type`
  element, and it binds only once even though the component that loads it is instantiated twice
  per page.
- If no browse or results container exists, it logs a warning, but only on staging hosts
  (`*.webflow.io`, `localhost`, `*.trycloudflare.com`) or when `window.STARTERS_DEBUG` is set.
  Production stays silent.
- The comparison is exact after trim/lowercase: only `consult` selects the consult label;
  everything else (including typos or empty text) falls through to the hire label.
- Both label elements can be visible in the Designer; expect a brief flash of both on load before
  the first apply pass. If that matters, hide one by default in Webflow.
- Hiding uses an inline `!important` display, so a CSS class can't override a hidden label; the
  script itself removes the inline style when the label should show again.
