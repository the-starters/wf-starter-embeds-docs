---
title: "Featured Expert Card Price"
---

Source: Webflow, `Global Embeds / Featured Expert Card`

## What it is

Tiny formatter that abbreviates prices to K-notation. On `DOMContentLoaded` it rewrites the text of
every `[data-price-text]` element: commas are stripped, the number is parsed, and values of 1000+
are shortened: `1000` becomes `1K`, `1100` becomes `1.1K`, and `9999` becomes `9.9K` (fractional
thousands keep one decimal and are **truncated**, not rounded, so a price never displays as a
bigger bucket than it is). Values under 1000 are rounded to a whole number. Non-numeric text is
left untouched.

The `$` sign is not added here; it comes from the CSS `::before` rule in
[`featured-expert-card.css`](./).

## File structure

```
Featured Expert Card
└── Featured Expert Card Price - JS
```

Pair with `Featured Expert Card - CSS` if you want the `$` prefix.

## Markup contract

```html
<span data-price-text>1,500</span>
<!-- becomes -->
<span data-price-text data-price-abbrev="1">1.5K</span>
```

## API

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-price-text` | price element | Marks text to abbreviate; CMS-bound number, commas OK. |
| `data-price-abbrev="1"` | set by JS | Processed marker; prevents double-abbreviating on re-run. |

## Notes & gotchas

- Runs exactly once at load; price elements injected later (pagination, filtering) are not
  abbreviated; there is no observer and no re-run hook exposed.
- The parse is `parseFloat` after comma-stripping, so text like `1500/mo` still parses (as 1500)
  and the suffix is lost in the rewrite, so keep the bound field to a bare number.
