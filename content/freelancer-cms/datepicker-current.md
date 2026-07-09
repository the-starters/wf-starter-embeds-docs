---
title: "Datepicker Current"
---

Source: `freelancer-cms/datepicker-current.js`

## What it is

Writes today's date into every element tagged `data-set-current-date`. On `DOMContentLoaded`
(or immediately if the DOM is already parsed) it fills each tagged element once:

- **Inputs / textareas** get the formatted date as their `value`. If a jQuery UI datepicker
  widget is attached to the field, the script also calls `setDate` on it so the widget's
  internal state matches. It then fires bubbling `input` and `change` events.
- **Any other element** gets the formatted date as its text content.

Formatting uses `jQuery.datepicker.formatDate` when jQuery UI is on the page; otherwise a small
built-in fallback handles the `mm`/`dd`/`yy` tokens (`mm` = 2-digit month, `dd` = 2-digit day,
`yy` = 4-digit year).

Each filled element is marked with `data-set-current-date-inited="true"`, so re-runs (modal
reopen, script pasted twice) never clobber a date the user has since edited. The script also
listens for a `modal-open` custom event on `window` and re-fills any tagged elements inside
`event.detail.modal` — for modal content that renders or enables late.

## Markup contract

```html
<!-- Input, default format (mm/dd/yy) -->
<input type="text" data-set-current-date>

<!-- Input, custom format as the attribute value -->
<input type="text" data-set-current-date="dd/mm/yy">

<!-- Reuse an existing datepicker format attribute -->
<input type="text" data-set-current-date data-input-datepicker-format="mm/dd/yy">

<!-- Non-field element: gets the date as text -->
<span data-set-current-date="mm/dd/yy"></span>
```

## API

| Attribute | On | Values | Description |
| --- | --- | --- | --- |
| `data-set-current-date` | any element | empty, or a format string | Marks the element to be filled with today's date. A non-empty value is used as the format. |
| `data-input-datepicker-format` | same element | format string | Fallback format when `data-set-current-date` is empty. Default is `mm/dd/yy`. |
| `data-set-current-date-inited` | set by script | `true` | Init guard written after filling; elements carrying it are skipped on re-runs. |

Format resolution order: `data-set-current-date` value, then `data-input-datepicker-format`,
then the `mm/dd/yy` default.

## File structure

```
Datepicker Current - JS
```

jQuery / jQuery UI datepicker are optional — with them you get the full jQuery UI
format-token set; without them only `mm`, `dd`, and `yy` are understood.

## Notes & gotchas

- Without jQuery UI, any format token other than `mm`, `dd`, `yy` is left in the output as-is.
  In the fallback, `yy` produces the 4-digit year.
- Filling is once-per-element: a value the user changed afterwards is never overwritten, even
  when the modal reopens.
- The `modal-open` re-fill only works if your modal script dispatches that event on `window`
  with the modal element in `event.detail.modal`.
- The fired `input`/`change` events bubble, so dependent scripts (filters, validation) see the
  pre-filled date.
