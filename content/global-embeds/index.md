---
title: "Intro"
description: "Site-wide Webflow embeds: interactive components, cards, and form utilities."
source: global-embeds
---

Source: Webflow, `embed-wrapper (component)`

Site-wide components loaded across The Starters Webflow site. Each folder in the source repo is a
group in this sidebar; a component's page documents its JS and CSS together.

## What's in this group

- **Accordions.** Attribute-driven accordion with ARIA wiring.
- **Application Card.** Application/CMS card behaviour.
- **Application Form.** Form-specific styles.
- **Custom Scrollbar.** Styled custom scrollbars.
- **Expert Card.** Expert card behaviour.
- **Featured Expert Card.** Featured card behaviour, plus its price script.
- **Form Embeds.** The form utilities: input preview, checkbox toggle, datepicker, input filter,
  validation, password toggle, timepicker.
- **List Sort Dropdown.** Dropdown-driven list sorting.
- **Modal.** Modal open/close, plus the reset-on-close helper.
- **Start Project: Generate Contract.** Contract preview flow.
- **Step Flow.** Multi-step form flow, plus the panel nav flow.
- **Tabs.** Attribute-driven tabs.
- **Tabs Radio Filter.** Reserved; no scripts yet.
- **Remove CMS Wrapper.** Unwraps Webflow Collection List wrappers.
- **Loader.** The shared `setLoader()` loading-overlay helper.
- **Text Methods.** Shared text helpers (`truncateText`).
- **Style Embeds.** Inventory of the style-only CSS embeds (global styles, buttons, cards,
  spinner, scrollbar hiding, Quill overrides).

## Conventions

- CSS files go in **Project Settings → Custom Code → Head** (or a page-level head embed).
- JS files load **before `</body>`** with `defer`, via the jsDelivr CDN pointed at the
  `the-starters/starters-webflow` repo.
- Scripts are plain browser JavaScript (no ES modules), written as IIFEs with an init guard so
  re-running them is safe.
