---
title: "Intro"
description: "Site-wide Webflow embeds: interactive components, cards, and form utilities."
---

Source: Webflow — `embed-wrapper (component)`

Site-wide components loaded across The Starters Webflow site. Each folder in the source repo is a
group in this sidebar; a component's page documents its JS and CSS together.

## What's in this group

- **Accordions** — attribute-driven accordion with ARIA wiring.
- **Application Card** — application/CMS card behaviour.
- **Application Form** — form-specific styles.
- **Custom Scrollbar** — styled custom scrollbars.
- **Expert Card** — expert card behaviour.
- **Featured Expert Card** — featured card behaviour, plus its price script.
- **Form Embeds** — the form utilities: input preview, checkbox toggle, datepicker, input filter,
  validation, password toggle, timepicker.
- **List Sort Dropdown** — dropdown-driven list sorting.
- **Modal** — modal open/close, plus the reset-on-close helper.
- **Start Project — Generate Contract** — contract preview flow.
- **Step Flow** — multi-step form flow, plus the panel nav flow.
- **Tabs** — attribute-driven tabs.
- **Tabs Radio Filter** — reserved; no scripts yet.
- **Remove CMS Wrapper** — unwraps Webflow Collection List wrappers.
- **Loader** — the shared `setLoader()` loading-overlay helper.
- **Text Methods** — shared text helpers (`truncateText`).
- **Style Embeds** — inventory of the style-only CSS embeds (global styles, buttons, cards,
  spinner, scrollbar hiding, Quill overrides).

## Conventions

- CSS files go in **Project Settings → Custom Code → Head** (or a page-level head embed).
- JS files load **before `</body>`** with `defer`, via the jsDelivr CDN pointed at the
  `the-starters/starters-webflow` repo.
- Scripts are plain browser JavaScript (no ES modules), written as IIFEs with an init guard so
  re-running them is safe.
