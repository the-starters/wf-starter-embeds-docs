---
title: "Style Embeds"
---

Source: Webflow — `Global Embeds` (the style-only CSS embeds) · repo mirror: `global-embeds/*.css`

## What it is

The style-only CSS embeds inside `embed-wrapper` — no JavaScript to walk through, but plenty of
contract: several of them define the `data-*` attribute vocabularies that the JS embeds and page
scripts rely on. The repo copies under `global-embeds/` are hand-pasted mirrors of the Webflow
embeds, kept as the reviewable source of truth.

This page is an inventory. Where a file defines an attribute API, the highlights are called out
— read the file itself for the full rule set.

## Inventory

| File | What it styles |
| --- | --- |
| `global.css` | The site-wide foundation — see the highlights below. |
| `button.css` | The button theming matrix: `data-button-theme` (`black`, `white`, `sunny`, `disabled`, …) × `data-button-style` (`primary`, `secondary`, `tertiary`), plus `:focus-visible` outlines, reduced-motion handling, and `pointer-events: none` on `.clickable_wrap` while in the Designer. |
| `content-rte.css` | Floating decorative quote mark on `blockquote`s inside `.content_rte`, tunable via CSS variables (`--quote-size`, `--quote-color`, offsets). |
| `expertise-item.css` | Hover/state transitions for `.expertise_item` and its count wrapper. |
| `featured-case-study-card.css` | Two-column grid layout for the featured case study card. |
| `hide-scroll.css` | Hides native scrollbars on **all inner scrollers** (everything except `html`/`body`) — Windows-safe. |
| `learn-card.css` | Four-line clamp on `.learn-card_heading`, with mobile tweaks. |
| `marquee-card.css` | Hides empty `[data-marquee="title-company"]` slots. |
| `quill-editor.css` | Quill rich-text editor overrides (placeholder style, container/toolbar sizing). |
| `spinner.css` | `[data-spinner]` border-spinner variants (size/color via CSS variables). |
| `table-stats.css` | Two-column grid for `.table-stats_component`, one column under 768px — the list layout used by the [Gen Contract preview](start-proj-gen-contract/index.md). |

## `global.css` highlights

Beyond resets and the fluid root `font-size` scale, `global.css` carries several attribute-driven
utilities other embeds depend on:

- **Line-clamp utilities** — truncate to 1/2/3 lines with an ellipsis.
- **State Manager** — `[data-state~='checked|current|open|pressed|expanded|external']` flips the
  `--_state---true` / `--_state---false` custom properties when the element (or a descendant)
  matches the corresponding native state (`:checked`, `.w--current`, `.w--open`,
  `aria-pressed`, `aria-expanded`, `target="_blank"`). Style off those variables instead of
  duplicating selectors.
- **Trigger variables** — `[data-trigger~='hover|focus|mobile|group|…']` does the same for
  interaction states (`--_trigger---on` / `--_trigger---off`), including group patterns where
  hovering one member dims the others, and a `hover: none` mobile switch.
- **Slot Styler** — `[data-slot]` flattens Webflow Collection List wrappers (and
  `.u-display-contents` layers) to `display: contents`, so CMS items participate directly in
  the slot's grid/flex layout.
- **Hide utilities** — `.u-hide-if-empty` (empty or only `w-condition-invisible` children) and
  `.u-hide-if-empty-cms` (no `.w-dyn-item`) remove empty blocks entirely.
- **wf-algolia touch-ups** — e.g. the active page number highlight
  (`.wf-algolia-page-num[data-wf-algolia-active='true']`).

## Notes & gotchas

- These load in **Project Settings → Custom Code → Head** (or page-level head embeds) — see the
  [group conventions](index.md#conventions).
- `button.css` is the visual half of button gating: [Form Validation](form-embeds/form-validation/index.md)
  and [Disable Apply](../starters-list-filter/custom-algolia-scripts/disable-apply.md) swap
  `data-button-theme` to `disabled` — without this file loaded, that swap changes nothing
  visually.
- `hide-scroll.css` is global and aggressive by design; scrollers that must show a bar need the
  [Custom Scrollbar](custom-scrollbar/index.md) embed instead.
- The repo mirrors are the source of truth for review/diffs, but the **live** styles are the
  pasted Webflow embeds — keep both sides in sync when editing.
