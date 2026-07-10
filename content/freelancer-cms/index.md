---
title: "Intro"
---

Scripts for the Freelancer CMS site. All three are small form pre-fill helpers: they write
values into form fields automatically (or on a click), then fire `input` and `change` events so
any other scripts listening on those fields (filters, step flows, validation) react as if the
user had typed the value. Each script is an IIFE with an init guard, so pasting it twice is safe.

- **Datepicker Current** (`datepicker-current.js`): writes today's date into any element tagged `data-set-current-date`, with a configurable format.
- **Pre-fill Attribute Value** (`pre-fill-attr-val.js`): on a trigger click, copies attribute-declared category/value pairs into matching form fields (text, select, radio, checkbox).
- **Prefill Memberstack Name** (`prefill-ms-name.js`): fills empty inputs tagged `data-mscustom-fullname` with the logged-in Memberstack member's full name from their custom fields.
