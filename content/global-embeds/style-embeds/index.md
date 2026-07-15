---
title: "Intro"
---

Source: Webflow, `Global Embeds` (the style-only CSS embeds) · repo mirror: `global-embeds/*.css`

The style-only CSS embeds inside `embed-wrapper` contain no JavaScript, but plenty of contract:
several of them define the `data-*` attribute vocabularies and utility classes that the JS
embeds and page scripts rely on. The repo copies under `global-embeds/` are hand-pasted mirrors
of the Webflow embeds, kept as the reviewable source of truth.

Each file gets its own walkthrough page:

- **[Global Styles](./global.md)** (`global.css`): the site-wide foundation (fluid type scale,
  resets, line-clamp and hide utilities, the CSS state manager, the slot styler).
- **[Button](./button.md)** (`button.css`): the `data-button-theme` × `data-button-style`
  theming matrix.
- **[Spinner](./spinner.md)** (`spinner.css`): the `[data-spinner]` rotating loader ring.
- **[Hide Scroll](./hide-scroll.md)** (`hide-scroll.css`): hides native scrollbars on all inner
  scrollers.
- **[Content RTE](./content-rte.md)** (`content-rte.css`): decorative quote mark on rich-text
  blockquotes.
- **[Quill Editor](./quill-editor.md)** (`quill-editor.css`): restyles the Quill rich-text
  editor toolbar and canvas.
- **[Expertise Item](./expertise-item.md)** (`expertise-item.css`): hover choreography for the
  expertise cards.
- **[Learn Card](./learn-card.md)** (`learn-card.css`): line-clamps learn card headings.
- **[Marquee Card](./marquee-card.md)** (`marquee-card.css`): hides empty marquee company slots.
- **[Featured Case Study Card](./featured-case-study-card.md)** (`featured-case-study-card.css`):
  the card's grid layout and dark-theme accent.
- **[Table Stats](./table-stats.md)** (`table-stats.css`): the two-column stats grid used by the
  contract preview.

## Conventions

- These load in **Project Settings → Custom Code → Head** (or page-level head embeds).
- The **live** styles are the pasted Webflow embeds; the repo mirrors exist for review/diffs,
  so keep both sides in sync when editing.
