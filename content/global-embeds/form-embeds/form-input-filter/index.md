---
title: "Form Input Filter"
---

Source: Webflow — `Global Embeds / Form Embeds / Form Input Filter`

## What it is

Global form filter: shows one block of inputs based on a select or radio choice and hides the
rest. Each `data-input-filter="wrapper"` scopes one control + one list of swappable blocks, so a
page can hold many independent groups. Hidden blocks get the `hidden` attribute, their fields are
**disabled** (so duplicate field names don't submit twice), and any `required` /
`aria-required="true"` is stripped so Webflow's native validation can't block submit on invisible
fields — all of it restored when the block is shown again. Runs on `DOMContentLoaded` (or
immediately if the DOM is ready) and re-applies on every `change` of the control. Idempotent via
`data-input-filter-inited` on the list.

## File structure

```
Form Input Filter
├── Form Input Filter - CSS
└── Form Input Filter - JS
```

## Markup contract

```html
<div data-input-filter="wrapper">
  <!-- the control: a select… -->
  <select data-input-filter="select" name="Rate-Type" class="w-select">
    <option value="">Select one…</option>
    <option value="Hourly Rate">Hourly Rate</option>
    <option value="Fixed Price">Fixed Price</option>
  </select>

  <!-- …or a radio group instead:
  <div data-input-filter="radio-group">
    <label class="w-radio"><input type="radio" name="Rate-Type" value="Hourly Rate" />…</label>
    <label class="w-radio"><input type="radio" name="Rate-Type" value="Fixed Price" />…</label>
  </div>
  -->

  <div data-input-filter="list">
    <div data-input-filter-item="Hourly Rate">
      <!-- inputs shown when "Hourly Rate" is selected -->
    </div>
    <div data-input-filter-item="Fixed Price">
      <!-- inputs shown when "Fixed Price" is selected -->
    </div>
  </div>
</div>
```

Each item's `data-input-filter-item` value must match the control's selected option/radio `value`
exactly (values are trimmed before comparison). While the control has an empty value, **all**
items stay hidden.

## API

| Attribute | On | Purpose |
| --- | --- | --- |
| `data-input-filter="wrapper"` | group wrapper | Scopes one control + list pair. If absent, the script walks up from the list and uses the first control it finds — the wrapper is the reliable way. |
| `data-input-filter="select"` | the select element | The driving control (read via its `value`). |
| `data-input-filter="radio-group"` | wrapper around the radios | Alternative driving control (read via the checked radio's `value`). |
| `data-input-filter="list"` | list wrapper | Holds the swappable blocks; init and options live here. |
| `data-input-filter-item="<value>"` | each block | Shown when the control's value matches, hidden otherwise. |
| `data-input-filter-disable="off"` | list wrapper (optional) | Keeps fields in hidden blocks **enabled**. Default: hidden fields are disabled. |
| `data-input-filter-inited` | list (set by script) | Init guard — do not add manually. |
| `data-input-filter-required-removed` / `data-input-filter-aria-required-removed` | fields (set by script) | Bookkeeping so `required` / `aria-required` are restored when the block is shown again. |

The companion CSS is one rule:

| Rule | Purpose |
| --- | --- |
| `[data-input-filter-item][hidden]` forced to `display: none !important` | Items often use `display: contents`, which would beat the `hidden` attribute's UA style — this makes `hidden` win. |

## Notes & gotchas

- **Values must match exactly** (after trimming): the option/radio `value`, not its visible label,
  is compared against `data-input-filter-item`.
- Disabling hidden fields is the default on purpose — blocks that repeat the same field names
  would otherwise all submit. Only set `data-input-filter-disable="off"` if you rely on hidden
  values reaching the server, and be aware fields you disabled yourself will then be toggled by
  the script too.
- The `required` strip/restore only tracks what the **script** removed (via the
  `-removed` marker attributes); it won't invent `required` on fields that never had it.
- There is no pre-init CSS hide: all items are visible until the JS runs and applies the first
  filter. With an empty initial control value, everything then hides.
- Blocks and controls added to the DOM after init are not picked up — no MutationObserver.
- Prefer the explicit `data-input-filter="wrapper"`: the ancestor-walk fallback grabs the first
  control it finds and can pair the wrong control with a list when groups are nested.
