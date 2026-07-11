---
title: "Text Methods"
source: global-embeds/text-methods/text-methods.js
---

Source: Webflow, `Global Embeds / Text Methods` · repo mirror: `global-embeds/text-methods/text-methods.js`

## What it is

Shared **text helper(s)** for the other embeds and page scripts. Currently one function:

```js
truncateText(text, limit = 60)
```

Trims the input, returns it unchanged when it fits the limit, otherwise cuts at the limit,
backs up to the previous **word boundary** (no mid-word cuts), and appends `...`. Non-string
input returns an empty string.

Used by card renderers (e.g. marquee/company cards) to keep CMS-fed titles to a predictable
length.

## File structure

```
Text Methods
└── Text Methods - JS
```

## Notes & gotchas

- Like [Loader](loader.md), this is a **bare global function, not an IIFE**. It exists to be
  called by other scripts and must load before them.
- The limit counts **characters before the word-boundary backup**, so results are usually a few
  characters shorter than `limit`; size card layouts accordingly.
- The ellipsis is three ASCII dots (`...`), not the `…` glyph.
