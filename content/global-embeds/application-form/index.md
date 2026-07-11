---
title: "Application Form"
source: global-embeds/application-form
---

Source: Webflow, `Global Embeds / Application Form`

## What it is

A single-rule CSS fix, no JavaScript. It targets the Webflow **Designer only**:

```css
html.wf-design-mode .form_tag-list {
    position: static
}
```

Webflow adds the `wf-design-mode` class to `html` while you are editing in the Designer. This rule
un-positions `.form_tag-list` in that context so the tag list sits in normal document flow and stays
visible/selectable while designing, instead of using whatever `position` it has on the published
site. Published pages are unaffected.

## File structure

```
Application Form
└── Application Form - CSS
```

Style-only; there is no script.

## Notes & gotchas

- Purely a Designer ergonomics helper; removing it changes nothing for visitors.
- It assumes the element uses the `form_tag-list` class and relies on Webflow's built-in
  `wf-design-mode` flag.
