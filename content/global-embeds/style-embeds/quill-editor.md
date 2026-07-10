---
title: "Quill Editor"
---

Source: Webflow — `Global Embeds / Quill Editor` · repo mirror: `global-embeds/quill-editor.css`

## What it is

Restyles the **Quill** rich-text editor (used for cover letters / long-form inputs in the app
flows) so it matches the site instead of Quill's stock look. Everything is `!important` on
purpose — it has to beat Quill's own injected stylesheet.

## Walkthrough

- **Placeholder** — `.ql-editor.ql-blank::before` drops Quill's italic style and renders the
  placeholder at 40% black.
- **Canvas** — 1rem font size; the editing area is clamped between `12.5rem` and `20rem` tall
  with bottom padding, so the editor never collapses or grows unbounded (it scrolls instead).
- **Toolbar buttons** — bold/italic/list/link/clean become uniform 2rem chips with a 1px
  border, rounded corners, and consistently sized icons.
- **Header picker** — fixed at `6.25rem` wide with smaller text so "Heading" fits.
- **Active/hover states** — buttons and picker labels turn `--colors--rollie-blue` (icon
  strokes included) on a faint gray background.
- **Mobile (≤479px)** — tighter toolbar margins and picker padding so the toolbar fits.
- **Rich-text bridge** — `.w-richtext li[data-list='bullet']` restores disc bullets when
  Quill-authored HTML is rendered inside a Webflow Rich Text element (Quill marks list type
  with `data-list` instead of semantic tags).

## Notes & gotchas

- Scoped entirely to Quill's own classes (`.ql-*`) — pages without a Quill instance are
  unaffected; no markup contract of our own.
- The min/max height clamp is the main UX decision in this file: long cover letters scroll
  inside the editor rather than stretching the modal. Change `.ql-editor`'s bounds if a flow
  needs a taller editor.
- If Quill is upgraded, re-check this file first — it depends on Quill's internal class names
  and toolbar structure.
- The `data-list` bullet fix matters anywhere Quill HTML is re-rendered (e.g. an application's
  cover letter shown to a brand) — without it, bullets render as plain rows.
