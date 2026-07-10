---
title: "Price Label"
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

The script waits for the global `WfAlgolia` API (polling every 100ms, giving up silently after
10 seconds), then re-applies on every `response` event, on any mutation of the results container,
and once on init, so labels stay correct through searches, pagination, and load-more.

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

For mutation-watching it observes, in order of preference: `wf-algolia-element="results"`, then
`wf-algolia-element="browse"`, then the parent of the first `.expert-card_item`, then `body`.

## Notes & gotchas

- If `window.WfAlgolia` never appears within 10 seconds, the script gives up silently and labels
  are never toggled.
- The comparison is exact after trim/lowercase: only `consult` selects the consult label;
  everything else (including typos or empty text) falls through to the hire label.
- Both label elements can be visible in the Designer; expect a brief flash of both on load before
  the first apply pass. If that matters, hide one by default in Webflow.
- Hiding uses an inline `!important` display, so a CSS class can't override a hidden label; the
  script itself removes the inline style when the label should show again.
