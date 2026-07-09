---
title: "Prefill Memberstack Name"
---

Source: `freelancer-cms/prefill-ms-name.js`

## What it is

Fills empty form inputs tagged `data-mscustom-fullname` with the logged-in Memberstack member's
full name, read from their custom fields. On `DOMContentLoaded` (or immediately if the DOM is
ready) it collects the tagged inputs, waits for the Memberstack DOM package
(`window.$memberstackDom`) by polling every 100ms up to 50 tries (about 5 seconds), then calls
`getCurrentMember` and joins the first matching first-name and last-name custom-field values
with a space.

The first non-empty value wins among these candidate keys, in order:

- First name: `free-user` (this site's legacy key), `first-name`, `First Name`, `firstName`, `first_name`, `firstname`
- Last name: `last-name`, `Last Name`, `lastName`, `last_name`, `lastname`

Each target is only filled if its current value is empty (whitespace counts as empty); a filled
target gets bubbling `input` and `change` events. A run-once guard on the `html` element keeps a
double paste harmless.

## Markup contract

```html
<input type="text" name="name" data-mscustom-fullname>
```

Any number of inputs can carry the attribute; all empty ones are filled with the same name.

## API

| Attribute | On | Description |
| --- | --- | --- |
| `data-mscustom-fullname` | input | Marks the field to receive the member's full name. Value-less — the attribute's presence is all that matters. |

No options. Poll interval (100ms) and retry cap (50) are constants in the script.

## File structure

```
Prefill Memberstack Name - JS
```

Memberstack (the DOM package that exposes `window.$memberstackDom`) must be installed on the
site; the script waits for it rather than requiring a load order.

## Notes & gotchas

- If Memberstack never appears within the ~5s polling window, the script gives up with a
  `console.warn` (`[pre-fill-input]` prefix) — nothing is filled.
- If the member has no custom field matching any candidate key, a warning lists the keys that do
  exist on the member, which is the fastest way to spot a key mismatch.
- Only one name part is fine: first-only or last-only members still get that part filled.
- Fields the user (or another script) already filled are never overwritten.
- Logged-out visitors: `getCurrentMember` returns no member data and the script exits quietly.
- Targets are collected once at init — inputs added to the page later (CMS render, modal
  injection) are not picked up.
