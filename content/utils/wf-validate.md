---
title: "WF Validate"
---

Source: `utils/wf-validate.js`

## What it is

Declarative form validation for Webflow: a thin presentation layer over the browser's native
**Constraint Validation API**. The rules come from the attributes the Designer already sets
(`required`, `type`, `pattern`, `min`/`max`, `minlength`/`maxlength`); the script only decides
**when** to validate and **how** to show the result: Designer-styled error elements instead of
the unstylable native bubbles.

The grammar is the Finsweet-style element/setting split (same dialect as wf-xano). Validation
follows "reward early, punish late": a field first shows its error when the user **leaves** it
(`focusout`); once marked invalid it re-validates on every input, so the error clears the
moment the value becomes valid. Submitting validates everything, blocks the submit while
anything fails, and focuses the first invalid field.

Two details keep the gating reliable:

- **Submit interception happens at document capture**, which runs before Webflow's own form
  handler or any page controller bound on the form, regardless of script load order (including
  scripts injected async via [`loadEnvScript`](loader.md)).
- **Clicks are gated too.** Page controllers often bind `click` on the submit button and call an
  API directly (that path never fires a `submit` event). Clicks on native submit buttons inside
  a bound form are gated automatically; clickables **outside** the form (modal footers) or
  non-native div "buttons" are opted in with `wf-validate-element="submit"`.

Fields that are not rendered (`display: none` step/variant inputs) are skipped, so per-variant
required inputs never block submit invisibly. An invalid field with **no** error slot gets a
plain one auto-injected after it (class `wf-validate_error-auto`), so a gated form never blocks
submission without visible feedback.

Client-side validation is UX only; server endpoints must keep validating.

## File structure

```
utils/wf-validate.js
```

JS only; **no CSS is shipped**. Style the error elements and the `is-wf-validate-invalid`
class in Webflow.

## Markup contract

```html
<form wf-validate-element="form">
  <input name="Email" type="email" required
         wf-validate-message-required="Please enter your email."
         wf-validate-message-type="That doesn't look like an email." />
  <div wf-validate-element="error">Replaced with the message at runtime</div>

  <textarea name="Brief" maxlength="2500"></textarea>
  <div wf-validate-element="count" wf-validate-for="Brief"></div>
</form>

<!-- a clickable outside the form that should also be gated -->
<div wf-validate-element="submit" class="button_main-wrap">…</div>
```

`wf-validate-element="form"` may sit on the `<form>` itself or on a wrapper containing one.
Error/count slots bind to the **nearest field sharing an ancestor**, or explicitly via
`wf-validate-for="<input name>"`.

## xAttribute JSON

Applying the hooks with the **xAttribute** Webflow app (by xAtom)? Select the element in the
Designer and paste the matching block.

`form`, the form (or a wrapper around it):

```json
{ "wf-validate-element": "form" }
```

`error`, a styled error slot bound explicitly to a field:

```json
{ "wf-validate-element": "error", "wf-validate-for": "Email" }
```

`count`, a live character/word counter:

```json
{ "wf-validate-element": "count", "wf-validate-for": "Brief" }
```

`submit`, a clickable outside the form (or a div button) to gate:

```json
{ "wf-validate-element": "submit" }
```

input with custom messages (rules come from the native attributes):

```json
{
  "wf-validate-message-required": "Please enter your email.",
  "wf-validate-message-type": "That doesn't look like an email."
}
```

## API

### Roles: `wf-validate-element="…"`

| Role | On | Purpose |
| --- | --- | --- |
| `form` | `<form>` or wrapper | Opts the form in. Native bubbles are suppressed via `novalidate`; the API stays available. |
| `error` | any element | Designer-styled error slot. Hidden on init, shown with the message while its field is invalid. |
| `message` | child of an error | Optional inner text target, so the error slot can carry icons/decoration. |
| `count` | any element | Live character counter (`1,234 / 2,500`). Max from the field's `maxlength` or `wf-validate-count-max`. `wf-validate-count-mode="words"` switches to a word counter (`312 / 500 words`), max from `wf-validate-maxwords` or `wf-validate-count-max`. |
| `submit` | clickable | Marks a submitter outside the form (or a non-native div button) so its clicks are gated too. |

### Settings on the input/select/textarea

| Attribute | Purpose |
| --- | --- |
| `wf-validate-message-<rule>` | Per-rule message override. Rules: `required`, `type`, `pattern`, `minlength`, `maxlength`, `min`, `max`, `step`, `match`, `minwords`, `maxwords`. |
| `wf-validate-message` | Catch-all override for any failure. No override at all falls back to the browser's localized message. |
| `wf-validate-match="<name>"` | Field must equal the field named `<name>` (confirm-password pattern). Enforced via `setCustomValidity`, so it flows through the same pipeline as native rules. |
| `wf-validate-minwords` / `wf-validate-maxwords` | Word-count bounds (whitespace-separated). The native API has no word rules; unlike `maxlength` these don't block typing; the error shows and submit is gated until within bounds. |

### State & JS API

| Hook | Meaning |
| --- | --- |
| `is-wf-validate-invalid` | Class on each invalid field, and on the form while any field is invalid. Style it in Webflow. |
| `wf-validate_error-auto` | Class on auto-injected fallback error slots. |
| `window.WfValidate.init(scope?)` | Scan for unbound `wf-validate-element="form"`. Call after injecting forms dynamically; already-bound forms are skipped (WeakMap guard). |
| `window.WfValidate.validate(form)` | Programmatically validate a bound form (shows all errors); returns a boolean. Returns `true` for unbound forms. |

## Notes & gotchas

- **Accessibility is handled**: error slots get `role="alert"` and an id; fields get
  `aria-invalid` and `aria-describedby` pointing at their slot.
- `minlength`/`maxlength` are enforced by the script itself; the native `tooShort`/`tooLong`
  flags only fire for user-typed values, so JS-set/autofilled values would silently bypass
  them.
- Same-name controls (radio/checkbox sets) validate as **one group** with one error slot.
- Error/count binding without `wf-validate-for` walks up from the slot until an ancestor
  contains a *named* field. In dense layouts, prefer the explicit `wf-validate-for`.
- The gate blocks with `stopImmediatePropagation()` at document capture. Another
  capture-phase document listener registered **earlier** would still run first, so load this
  script early.
- Hidden-field skipping uses `getClientRects()`, i.e. actual rendering, so a field inside a
  `visibility: hidden` (not `display: none`) wrapper still validates.
- Forms injected after load are not picked up automatically; call `WfValidate.init()` (or
  `init(scope)`) after injecting.
- The script is init-guarded on `window.WfValidate`; double-inclusion is a no-op.
