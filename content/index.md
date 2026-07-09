---
title: "Introduction"
description: "Reference docs for the custom code powering The Starters Webflow site."
---

Reference documentation for the custom code powering [the-starters-3-0.webflow.io](https://the-starters-3-0.webflow.io).

These docs describe the JavaScript and CSS embeds that live in **The Starters** Webflow site. The
source of truth is one of two places — **mostly the Webflow embeds themselves**:

- **Webflow embeds** (most scripts) — the code lives directly inside the site's embed components in
  the Webflow Designer. The `Source:` line at the top of each page is the embed's path in the
  Webflow **Navigator**, e.g. `Global Embeds / Form Embeds / Checkbox Toggle`.
- **GitHub** — only when a script is loaded through a **jsDelivr CDN URL**. Those scripts live in
  the [the-starters/starters-webflow](https://github.com/the-starters/starters-webflow) repo and
  load with `defer`, so tagged releases go live **without editing any Webflow embed URLs**.

The docs site itself is deployed on **Vercel** under a temporary domain (no custom domain yet).
Site code and content live together in the
[the-starters/wf-starter-embeds-docs](https://github.com/the-starters/wf-starter-embeds-docs)
repo (content under `content/`) — pushes to `main` redeploy automatically.

## How these docs are organised

The docs mirror the **Webflow Navigator**, not a repo folder tree. The main folder —
**[Global Embeds](global-embeds/index.md)** — is the `embed-wrapper` component in Webflow. Inside it
are mostly **groups**, and each group holds the script(s) that get a walkthrough here. Single
embeds without extra scripts are single doc pages; groups with companion scripts become doc groups
with a page per script.

```
embed-wrapper (Webflow component)          →  Global Embeds
├── Remove CMS Wrapper – JS                →  Remove CMS Wrapper
├── List's Sort Dropdown                   →  List Sort Dropdown
├── Expert Card                            →  Expert Card
├── Featured Expert Card                   →  Featured Expert Card
│   └── …                                  →  Featured Expert Card Price
├── Tabs Radio Filter                      →  Tabs Radio Filter
├── Custom Scrollbar                       →  Custom Scrollbar
├── Form Embeds                            →  Form Embeds
│   ├── Password Toggle                    →  Password Toggle
│   ├── Datepicker                         →  Datepicker
│   ├── Form Validation                    →  Form Validation
│   │   └── Email Validate – JS            →  Email Validation
│   ├── Form Input Filter                  →  Form Input Filter
│   ├── Checkbox Toggle                    →  Checkbox Toggle
│   ├── Timepicker                         →  Timepicker
│   └── Input Preview – JS                 →  Input Preview
├── Modal                                  →  Modal
│   └── …                                  →  Reset on Close
├── Application Card                       →  Application Card
├── Application Form                       →  Application Form
├── Accordions                             →  Accordions
├── Step Flow                              →  Step Flow
│   └── Panel Nav Flow                     →  Panel Nav Flow
├── Tabs                                   →  Tabs
└── Start Project / Gen Contract           →  Start Project — Generate Contract
```

Style-only embeds in `embed-wrapper` (Global Styles, the card CSS embeds, Loader, Text Methods,
Extra Embeds) have no behaviour to walk through and aren't documented yet.

The remaining main groups cover scripts that live outside `embed-wrapper`:

- **[Algolia Result Modifiers](algolia-result-modifiers/index.md)** — post-render tweaks to Algolia
  result cards (companies, price label, roles).
- **[Freelancer CMS](freelancer-cms/index.md)** — freelancer CMS page scripts (datepicker,
  pre-fill helpers).
- **[Starters List Filter](starters-list-filter/index.md)** — the starters list filter UI and its
  custom Algolia scripts.

More groups will be added as the Webflow site grows — see
**[Documenting your own embed](adding-a-page.md)** for how to add your own page.

## How to read a component page

Every component page follows the same shape, so you can scan for what you need:

1. **What it is** — a one-paragraph summary of the behaviour.
2. **Markup contract** — the HTML structure / `data-*` attributes the script expects.
3. **API** — the `data-*` options and classes, as a table.
4. **File structure** — the embed files in Webflow, named as they appear in the Navigator
   (e.g. `Modal - CSS`, `Modal - JS`), plus any dependencies.
5. **Notes & gotchas** — accessibility, idempotency, mobile/touch behaviour, integration caveats.

## The contract

The HTML structure and the `data-*` attributes are the contract between the markup in Webflow and the
JavaScript. Don't change classes or hierarchy on one side without updating the other. Where possible
the code matches Webflow's exported class names rather than one-off renames, so the bridge to the
Designer stays intact.

## Reference

- Live site: <https://the-starters-3-0.webflow.io>
