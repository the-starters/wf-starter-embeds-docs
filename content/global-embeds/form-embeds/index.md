---
title: "Intro"
---

Source: Webflow, `Global Embeds / Form Embeds`

Everything form-related that ships as a global embed lives in this group. Each embed is a small,
attribute-driven script (plus, in some cases, a companion CSS file) that you drop into Webflow
custom code and wire up with `data-*` attributes.

## What's in this group

- **Checkbox Toggle.** Show or hide an element based on a checkbox's checked state.
- **Datepicker.** Date selection for form inputs.
- **Form Input Filter.** Show one block of inputs based on a select or radio choice.
- **Form Validation.** Form validation behavior.
- **Password Toggle.** A show/hide button for password fields.
- **Timepicker.** Time selection for form inputs.
- **Input Preview** (`input-preview.js`, loose in the group folder): mirrors a field's value
  into a live preview slot as the user types or selects.

## Shared styles

`form.css` sits at the group root as the shared stylesheet for form embeds. It is currently an
**empty placeholder**, so there is nothing to load yet. Styles that apply across form embeds will land here;
until then, each embed's own CSS file (where one exists) is all you need.
