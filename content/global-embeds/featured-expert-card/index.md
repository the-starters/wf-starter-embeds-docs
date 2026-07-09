---
title: "Featured Expert Card"
---

Source: Webflow — `Global Embeds / Featured Expert Card`

## What it is

Hover/tap reveal for the details panel on featured expert cards. The reveal itself is pure CSS — a
`grid-template-rows: 0fr → 1fr` transition (300ms ease-out) on `.details-wrapper_reveal`:

- **Hover-capable devices:** hovering a `.featured-experts_item` (or the details wrapper) opens the
  reveal.
- **Mobile (max-width 767px):** the small JS toggles the `data-details-open` attribute on the item
  when it is tapped anywhere except a link, button, or form control. Leaving the mobile breakpoint
  clears the attribute from all items.

The CSS also carries a few card-formatting rules: a `$` prefix before `[data-price-text]` elements
(pairs with the [price abbreviation script](./featured-expert-card-price)), comma-separated inline
rendering for the company list, and hiding `.details-wrapper_description` when its paragraph is
empty.

## File structure

```
Featured Expert Card
├── Featured Expert Card - CSS
└── Featured Expert Card - JS
```

## Markup contract

```html
<div class="featured-experts_item">
  <!-- …photo, name… -->
  <span data-price-text>1,500</span>

  <div class="company_list">
    <div data-company-list="item"><div>Acme</div></div>
    <div data-company-list="item"><div>Globex</div></div>
  </div>

  <div class="featured-experts_details-wrapper">
    <div class="details-wrapper_reveal">
      <div class="details-wrapper_reveal-inner">
        <div class="details-wrapper_description"><p>Bio…</p></div>
        <!-- …more details… -->
      </div>
    </div>
  </div>
</div>
```

`.details-wrapper_reveal` must directly wrap a single `.details-wrapper_reveal-inner` (the 0fr/1fr
grid trick collapses that one row).

## API

| Attribute / class | On | Purpose |
| --- | --- | --- |
| `featured-experts_item` | card | Hover scope on desktop; tap target on mobile. |
| `data-details-open` | card (set by JS) | Mobile open state — the CSS opens the reveal when present. |
| `featured-experts_details-wrapper` | details block | Alternative hover scope for the reveal. |
| `details-wrapper_reveal` / `details-wrapper_reveal-inner` | reveal pair | Grid-rows collapse/expand animation. |
| `details-wrapper_description` | description | Hidden entirely when it contains an empty `p` (CMS field unset). |
| `data-price-text` | price element | Gets a `$` prefix via a CSS `::before`. |
| `data-company-list="item"` | company item | Rendered inline; a `, ` separator is appended to all but the last. |

## Notes & gotchas

- The mobile toggle keys off viewport width (`max-width: 767px`), not touch capability — a narrow
  desktop window taps too, and a tablet in the hover media query hovers instead.
- The click listener is document-level, so CMS items rendered later still toggle without re-init.
- No ARIA is set by this script — the reveal is presentational.
- The `, ` company separator comes from a `::after` on every non-last `data-company-list="item"`;
  the `display: inline` rule on the item's descendants is what lets Webflow's nested divs read as
  one sentence.
- The empty-description rule uses the CSS `:has()` selector; on browsers without `:has()` support
  an empty description block simply stays visible.
- No `prefers-reduced-motion` handling — the 300ms reveal transition always runs.
