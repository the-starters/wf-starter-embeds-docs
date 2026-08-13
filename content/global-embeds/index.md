---
title: "Global Embeds"
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
- **[Expert Card](./expert-card/index.md).** Expert card behaviour, plus the browse loader that
  masks list churn on `/all-starters`.
- **Featured Expert Card.** Featured card behaviour, plus its price script.
- **[Replica List](./replica-list/index.md).** Curated "top X" lists rendered by wf-algolia's
  static-list mode from a hand-ranked Algolia replica, plus the relayout companion for lists that
  start out hidden.
- **Form Embeds.** The form utilities: input preview, checkbox toggle, datepicker, input filter,
  validation, password toggle, timepicker, disabler,
  [Turnstile Contents Fix](./form-embeds/turnstile-contents-fix.md).
- **List Sort Dropdown.** Dropdown-driven list sorting.
- **Modal.** Modal open/close, plus the reset-on-close helper.
- **Start Project: Generate Contract.** Contract preview flow.
- **Step Flow.** Multi-step form flow, plus the panel nav flow.
- **Tabs.** Attribute-driven tabs.
- **[Tabs Radio Filter](./tabs-radio-filter/index.md).** Reserved stub; folder removed from the CDN — do not install.
- **Remove CMS Wrapper.** Unwraps Webflow Collection List wrappers.
- **Loader.** The shared `setLoader()` loading-overlay helper.
- **Text Methods.** Shared text helpers (`truncateText`).
- **[Millify](./millify.md).** Attribute-driven number formatting (`12345` → `12.3K`).
- **[Logo Wall](./logo-wall/index.md).** CMS logos split into looping GSAP tracks. Testimonials-like Marquee UX; logo-only attribute contract.
- **[Learn CTA Gate](./learn-cta-gate/index.md).** Sign-up gate on a Learn article: character-count
  sentinel or short-article timer. Memberstack decides who is gated.
- **[Session Video](./session-video/index.md).** Learn Sessions hero player: ambient preview,
  click-to-watch, logged-out cut-point wall. Replaces the template inline script — do not run both.
- **Style Embeds.** Inventory of the style-only CSS embeds (global styles, buttons, cards,
  spinner, scrollbar hiding, Quill overrides).

## Conventions

- CSS files go in **Project Settings → Custom Code → Head** (or a page-level head embed).
- JS files load **before `</body>`** with `defer`, via the jsDelivr CDN pointed at the
  `the-starters/starters-webflow` repo.
- Scripts are plain browser JavaScript (no ES modules), written as IIFEs with an init guard so
  re-running them is safe.
