---
title: "Marquee Card"
source: global-embeds/marquee-card.css
---

Source: Webflow, `Global Embeds / Marquee Card` · repo mirror: `global-embeds/marquee-card.css`

## What it is

A single rule: `[data-marquee="title-company"]:empty { display: none }`.

Marquee cards render a "title @ company" slot from CMS/script data; when a card has no company
value the slot ends up as an **empty element**, which would still take up layout space (gaps,
separators). This hides it entirely so the card collapses cleanly around the missing value.

The slot text itself is filled by the card-rendering scripts, with titles kept short via
[Text Methods](../text-methods.md)' `truncateText`.

## Notes & gotchas

- `:empty` is strict: a single space or line break in the element makes it non-empty and the
  rule stops working. Scripts must leave the slot truly empty (no whitespace text nodes) when
  there's no value: `textContent = ''`, not `' '`.
- If the slot ever needs a placeholder ("—"), remove the attribute rather than fighting this
  rule.
