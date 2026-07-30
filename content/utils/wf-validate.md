---
title: "WF Validate"
source: utils/wf-validate.js
---

Source: `utils/wf-validate.js`

## What it is

Declarative form validation for Webflow. The rules come from the attributes the Designer already
sets (`required`, `type`, `pattern`, `min`/`max`, `minlength`/`maxlength`); the script only decides
**when** to validate and **how** to show the result: Designer-styled error elements instead of the
unstylable native bubbles. It is a thin presentation layer over the browser's own form validation
(the **Constraint Validation API**, if you want to look the behavior up in the spec).

Validation follows "reward early, punish late": a field first shows its error when the user
**leaves** it (`focusout`); once marked invalid it re-validates on every input, so the error clears
the moment the value becomes valid. Submitting validates everything, blocks the submit while
anything fails, focuses the first invalid field, and scrolls it to the middle of the viewport.

Client-side validation is UX only; server endpoints must keep validating.

## Quick start

Five minutes, one form, one field. Follow the steps in order and you will end up with a form that
shows an error when a field is left empty and refuses to submit until it is filled.

### 1. Add the script

Paste this into Webflow's custom code, just before the closing `</body>` tag.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/utils/wf-validate.js"></script>
```

Two places work, pick one:

- Site-wide: Site settings, Custom code, Footer code. Every page gets it.
- Page only: Page settings, Custom code, Before `</body>` tag. Only that page gets it.

`@latest` follows the newest release tag, which is what you want while you are building. For a
production page you can pin the version instead, so a future release can never change the page
without you: swap `@latest` for `@v1.59.28`.

Custom code runs neither on the Designer canvas nor in Preview mode, so every check in this
walkthrough happens on a published page. Publish to your staging site (`yoursite.webflow.io`), then
open the browser console there and type `WfValidate`.

**What you should see:** an object with three functions on it (`init`, `refresh`, `validate`). If
you get `undefined`, the script did not load: check that the snippet is in the footer slot, that
you published, and that nothing is blocking `cdn.jsdelivr.net`, such as an ad blocker or a content
security policy on the site.

Nothing on the page changes yet. The script does nothing at all until a form opts in, which is the
next step.

### 2. Opt the form in

Select your form in the Designer, open the Settings panel (the gear), find Custom attributes, and
add one:

| Name | Value |
| --- | --- |
| `wf-validate-element` | `form` |

In markup that is:

```html
<form wf-validate-element="form">
  ...
</form>
```

You can put the attribute on the Form Block wrapper instead of the `<form>` itself if that is the
element you have selected. The script accepts either and finds the `<form>` inside. Either way the
state classes are written to that inner `<form>`, never to the wrapper you tagged.

Publish, then in the console run `document.querySelector('form').noValidate`. (That grabs the first
form in the page, which on a real site is often a nav search or a newsletter signup. If the page has
more than one form, target yours specifically: give it an id, or query
`form[wf-validate-element="form"]` when the attribute sits on the form itself.)

**What you should see:** `true`. The script sets `novalidate` on the form so the browser's own
grey validation bubbles stop appearing. From here on, the messages you see are the script's, and
you can style them.

### 3. Give one field a name and make it required

Select the input, still in the Settings panel:

1. Set **Name** to `Email` (Webflow may have pre-named it something like `Email-2`; rename it).
   This is not optional. A field with no `name` is invisible to the script and will never be
   validated.
2. Check **Required**.
3. Set **Type** to `Email` while you are there, so a value like `abc` fails too.

The Designer writes plain native attributes, which is exactly what the script reads:

```html
<input name="Email" type="email" required />
```

Every rule works this way. `required`, the field type, Max characters, and a pattern all come from
Webflow's own field settings. There is no separate rule syntax to learn.

**What you should see:** still nothing new on the page. Errors are earned, not shown on arrival. A
freshly loaded form never greets the visitor with red text.

### 4. Publish, then leave the field empty

Publish to staging again and open the page there, since none of this runs in the Designer or in
Preview.

Click into the email field, type nothing, then click somewhere else on the page.

**What you should see:** a line of plain unstyled text appears directly below the field, saying
something like "Please fill out this field." (the wording is the browser's, and it is localized to
the visitor's language). The field itself picks up the class `is-wf-validate-invalid`.

That text is a fallback slot the script injected for you, with the class
`wf-validate_error-auto`. You did not add any markup for it. It exists so an opted-in form can
never block a submit without telling the visitor why. Step 6 replaces it with something you
designed.

Now type a real address into the field, one character at a time.

**What you should see:** the error disappears the moment the value becomes valid, without waiting
for you to leave the field again. That is the timing rule: a field shows its first error only when
the visitor leaves it, and once it is showing an error it re-checks on every keystroke so the error
clears immediately.

The email rule is looser than it looks, so expect the clear to come early: `type="email"` is
satisfied by anything shaped like `a@b`, long before you have typed a real address.

Two things to keep expectations straight: no CSS ships with this script, so the error text will
look like unstyled body copy until you style it, and the error only appeared because you left the
field. Clicking into a field and back out is the trigger, not loading the page.

### 5. Try to submit while it is empty

Clear the field, then click your submit button.

**What you should see:** four things at once.

1. Nothing submits. No Webflow success message, no request, no page change.
2. The error appears, along with the error for every other invalid field on the form. Submitting
   checks all of them, not just the ones the visitor touched.
3. The first invalid field takes focus, so typing goes straight into it.
4. The page scrolls that field to the middle of the viewport, so its label and its error stay in
   view. The scroll is smooth, or instant if the visitor has "reduce motion" turned on in their OS.

The form element also picks up `is-wf-validate-invalid` when a submit attempt fails, which is
useful if you want a form-level treatment. The form's copy of the class updates only on the next
whole-form check, meaning another submit attempt or a `WfValidate.validate()` call, and not as
individual fields change.

Fill the field in and click submit again: the form submits normally, and the script gets out of
the way.

### 6. Swap in your own error slot and message

The auto-injected slot is a safety net, not a design. Replace it with an element you styled.

In the Designer, add a Text Block directly under the field, inside the same wrapper as the field
(a Form Block field wrapper, or whatever div holds the input and its label). Type placeholder text
into it such as "Error message goes here" so you can see it while designing, then style it: red,
small, whatever the brand asks for. Give it one custom attribute:

| Name | Value |
| --- | --- |
| `wf-validate-element` | `error` |

Then select the input again and add your own wording:

| Name | Value |
| --- | --- |
| `wf-validate-message-required` | `Please enter your email.` |

In markup, the pair looks like this:

```html
<form wf-validate-element="form">
  <div class="field-wrap">
    <input name="Email" type="email" required
           wf-validate-message-required="Please enter your email." />
    <div wf-validate-element="error">Error message goes here</div>
  </div>

  <button type="submit">Send</button>
</form>
```

The slot has to live inside the form. It binds itself to the nearest field that shares an ancestor
with it, which is why placing it in the field's own wrapper matters. If your layout is dense and
you want to be certain, name the field explicitly with `wf-validate-for="Email"`.

Webflow's default Form Block gives you no such wrapper: the labels and inputs sit directly inside
the form. On a single-field form that is fine, because a slot placed right after the input is the
nearest thing to it and binds correctly anyway. Once there are several fields, wrap each field and
its slot in a div like the example above, or skip the guessing entirely and put `wf-validate-for`
on every slot.

Publish, then repeat step 4: leave the field empty and click away.

**What you should see:** your styled element appears instead of the plain fallback line, and it
says "Please enter your email." rather than the browser's wording. The placeholder text you typed
in the Designer is gone, replaced at runtime. Before that first error it is still in the page: the
script hides the slot with an inline `display: none` and leaves your placeholder inside it, so
finding that text in DevTools on a freshly loaded page is expected and not a sign of failure. Type
`abc` into the field and the message switches to the browser's default type message, because you
only overrode the required rule so far. Add `wf-validate-message-type` the same way to own that one
too.

### Where to go next

Three classes are worth styling now that the behavior works, and none of them ship any CSS:

- `is-wf-validate-invalid` on each failing field. This is the hook for a red border or ring, and it
  is the one to style rather than the browser's `:invalid`, which would paint before the visitor
  has done anything.
- `is-wf-validate-invalid` on the form itself once a submit attempt fails, if you want a
  form-level treatment such as a banner or a border on the whole card. The form's copy updates on
  the next whole-form check, not as fields change.
- `wf-validate_error-auto` on any fallback slot the script had to inject. Styling it gives you a
  reasonable floor on fields you have not designed a slot for yet.

Everything past this point is opt-in: a positive "looks good" slot per field, live character and
word counters, soft-disabled submit buttons, a confirm-password match rule, and gating for div
buttons that live outside the form. The reference sections below cover each one.

## Markup contract

The grammar is the Finsweet-style element/setting split (same dialect as wf-xano).

The script ships JS only; **no CSS is shipped**. Style the error and success elements, the
`is-wf-validate-invalid` class, and the `is-wf-validate-disabled` class in Webflow.

```html
<form wf-validate-element="form" wf-validate-submit-disable="data-button-theme">
  <input name="Email" type="email" required
         wf-validate-message-required="Please enter your email."
         wf-validate-message-type="That doesn't look like an email." />
  <div wf-validate-element="error">Replaced with the message at runtime</div>
  <div wf-validate-element="success" wf-validate-for="Email">Looks good!</div>

  <textarea name="Brief" maxlength="2500"></textarea>
  <div wf-validate-element="count" wf-validate-for="Brief"></div>

  <button type="submit">Send</button>
</form>

<!-- a clickable outside the form that should also be gated -->
<div wf-validate-element="submit" class="button_main-wrap">…</div>
```

`wf-validate-element="form"` may sit on the `<form>` itself or on a wrapper containing one.
Form-level settings such as `wf-validate-submit-disable` go on that same element. Error, success,
and count slots bind to the **nearest field sharing an ancestor**, or explicitly via
`wf-validate-for="<input name>"`, and they must live inside the form.

## xAttribute JSON

Applying the hooks with the **xAttribute** Webflow app (by xAtom)? Select the element in the
Designer and paste the matching block.

`form`, the form (or a wrapper around it):

```json
{ "wf-validate-element": "form" }
```

`form` with soft-disabled submit buttons, theming off the project's own button attribute:

```json
{ "wf-validate-element": "form", "wf-validate-submit-disable": "data-button-theme" }
```

`error`, a styled error slot bound explicitly to a field:

```json
{ "wf-validate-element": "error", "wf-validate-for": "Email" }
```

`success`, a styled "this one is good" slot bound explicitly to a field:

```json
{ "wf-validate-element": "success", "wf-validate-for": "Email" }
```

`count`, a live character/word counter:

```json
{ "wf-validate-element": "count", "wf-validate-for": "Brief" }
```

`count` in word mode with an explicit denominator:

```json
{
  "wf-validate-element": "count",
  "wf-validate-for": "Brief",
  "wf-validate-count-mode": "words",
  "wf-validate-count-max": "500"
}
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

## Reference

### Roles: `wf-validate-element="…"`

| Role | On | Purpose |
| --- | --- | --- |
| `form` | `<form>` or wrapper | Opts the form in. Native bubbles are suppressed via `novalidate`; the API stays available. |
| `error` | any element | Designer-styled error slot. Hidden on init, shown with the message while its field is invalid. |
| `message` | child of an error | Optional inner text target, so the error slot can carry icons/decoration. |
| `success` | any element | Designer-styled positive slot, the twin of an error. Hidden on init, shown only while its field group is **touched and valid**, so it never appears next to a visible error. The script never writes into it and adds no `role`: whatever the Designer put there is what shows. |
| `count` | any element | Live character counter (`1,234 / 2,500`). `wf-validate-count-mode="words"` switches it to a word counter (`312 / 500 words`). See the counter settings below for where the denominator comes from. |
| `submit` | clickable | Marks a submitter outside the form (or a non-native div button) so its clicks are gated too. |

### Form settings

`wf-validate-submit-disable` on the form soft-disables its submit buttons while anything on the
form is still incomplete.

| Attribute | Purpose |
| --- | --- |
| `wf-validate-submit-disable` | Opt in to soft-disabled submitters while the form is incomplete. The value names the attribute that receives `"disabled"` when it starts with `data-`; any other value (no value, `true`, a typo) means the default `data-theme`. |

While the form is incomplete, every submitter gets three writes:

- the class `is-wf-validate-disabled`, which is the canonical styling hook
- `aria-disabled="true"`
- the theme attribute set to `"disabled"`

The theme attribute is `data-theme` unless the opt-in's value names another one:
`wf-validate-submit-disable="data-button-theme"` writes `data-button-theme="disabled"`. That
exists so button components which already theme off their own attribute get the disabled look
with no extra CSS. Style the class, not the attribute.

All three writes are removed once the form validates. A pre-existing value of the configured
attribute (say `data-theme="black"`) is cached the first time it is overwritten and put back on
re-enable; if the attribute was not there at all, it is removed again. The cache stores the
attribute name alongside the value, so two forms on one page naming different theme attributes
never restore into each other's.

The native `disabled` property is never used. The button stays clickable and in the tab order,
so a click while the form is incomplete still hits the gate, paints every error at once, and
focuses the first invalid field. Submitters are re-collected on every state change (native
submit buttons inside the form, plus every `wf-validate-element="submit"` that resolves to it),
so buttons injected after bind are covered without a MutationObserver.

Completeness is computed **silently**: nothing is painted and no group is marked touched. It
runs at bind time (an empty required form starts out disabled), on every `input`, `change`,
`focusout`, and `focusin`, inside every `validateAll` (so both gates and `WfValidate.validate()`
refresh it), after a reset, and when a dialog or popover containing the form opens.

### Field settings

| Attribute | Purpose |
| --- | --- |
| `wf-validate-message-<rule>` | Per-rule message override. Rules: `required`, `type`, `pattern`, `minlength`, `maxlength`, `min`, `max`, `step`, `match`, `minwords`, `maxwords`. |
| `wf-validate-message` | Catch-all override for any failure. No override at all falls back to the browser's localized message. |
| `wf-validate-match="<name>"` | Field must equal the field named `<name>` (confirm-password pattern). Enforced via `setCustomValidity`, so it flows through the same pipeline as native rules. |
| `wf-validate-minwords` / `wf-validate-maxwords` | Word-count bounds (whitespace-separated). The native API has no word rules; unlike `maxlength` these don't block typing; the error shows and submit is gated until within bounds. |

`minlength`/`maxlength` are enforced by the script itself; the native `tooShort`/`tooLong` flags
only fire for user-typed values, so JS-set/autofilled values would silently bypass them.

### Counter settings

| Attribute | Purpose |
| --- | --- |
| `wf-validate-count-max` | The denominator shown after the slash. Display only: it never gates submit. |
| `wf-validate-count-mode="words"` | Count whitespace-separated words instead of characters, and append `words` to the output. |

The denominator is resolved in this order:

1. `wf-validate-count-max` on the counter element itself wins whenever it is present.
2. Otherwise the field's own limit: `maxlength` in character mode, `wf-validate-maxwords` in
   word mode.
3. Neither one: the counter renders a bare count with no denominator (`1,234`).

**Webflow writes `maxlength="256"` by default.** A character counter that mysteriously shows
`/ 256` is reading that Designer default off the field, not making it up. Fix it in the
field's **Max characters** setting rather than papering over it with
`wf-validate-count-max`, which is display only: if the two disagree, the field still stops
input at the real `maxlength` while the counter promises more room.

### State classes and JavaScript API

| Class | Meaning |
| --- | --- |
| `is-wf-validate-invalid` | Class on each invalid field, and on the form after a whole-form validation fails (a submit attempt or `WfValidate.validate()`); the form's copy updates on the next whole-form validation, not as fields change. Style it in Webflow. |
| `is-wf-validate-disabled` | Class on every soft-disabled submitter while a `wf-validate-submit-disable` form is incomplete. The canonical styling hook for the disabled look; style this rather than the theme attribute. |
| `wf-validate_error-auto` | Class on auto-injected fallback error slots. |

| Function | Meaning |
| --- | --- |
| `window.WfValidate.init(scope?)` | Scan for unbound `wf-validate-element="form"`. Call after injecting forms dynamically; already-bound forms are skipped (WeakMap guard). |
| `window.WfValidate.refresh(form)` | Register controls injected into an already-bound form, without duplicating listeners or clearing touched state. |
| `window.WfValidate.validate(form)` | Programmatically validate a bound form (shows all errors); returns a boolean. Returns `true` for unbound forms. |

- Forms injected after load are not picked up automatically; call `WfValidate.init()` (or
  `init(scope)`) after injecting.
- The script is init-guarded on `window.WfValidate`; double-inclusion is a no-op.

## Notes and gotchas

### Accessibility

- **Accessibility is handled**: error slots get `role="alert"` and an id; fields get
  `aria-invalid` and `aria-describedby` pointing at their slot. Success slots deliberately get
  no `role`: they are not alerts.
- **Success slots are per-field, not per-submission.** Webflow's native `.w-form-done` /
  `.w-form-fail` blocks report the outcome of a submission; a `success` slot reports the state
  of one field group while the visitor is still filling the form. They are unrelated, and both
  can be used on the same form.

### Writing the attributes

- **Attribute values in selectors are case-sensitive.** `wf-validate-element="Submit"` matches
  nothing; so does `wf-validate-count-mode="Words"`. Always lowercase.
- Slot binding without `wf-validate-for` walks up from the slot until an ancestor contains a
  *named* field. In dense layouts, prefer the explicit `wf-validate-for`.
- Same-name controls (radio/checkbox sets) validate as **one group** with one error slot.

### Styling the disabled state

- **Marker placement for composite buttons.** A native submit button inside the form is gated
  automatically, but the disabled-state markers only land on the submitters the script knows
  about. For a button component with an invisible native button inside a styled wrapper, put
  `wf-validate-element="submit"` on the **wrapper** (the visible component root) so the wrapper
  is what receives `is-wf-validate-disabled` and the theme attribute.
- **Optional: mouse-inert disabled buttons.** Adding `pointer-events: none` to the disabled
  style makes the button ignore mouse clicks outright. The cost is the click-reveals-errors
  behavior: with no click event there is nothing to paint, so someone clicking a dead button
  gets no explanation. Keyboard users still reach the gate (tabbing to a native submit button
  and pressing Enter fires the submit gate), and errors still appear on blur as fields are
  left. Pick the trade per project; the script writes the same markers either way.

### Visibility and timing

- **Forms inside dialogs recompute on open.** A form bound while its `<dialog>` is closed
  measures every field as unrendered, so an empty required form counts as complete and its
  submitter starts enabled. The script listens for the `toggle` event at document level and
  recomputes the submit-disable state and counters the moment a dialog, popover, or `details`
  element reveals content, silently, with nothing painted. Entering any field (`focusin`)
  recomputes too, which covers tab and step reveals and, because `showModal()` autofocuses,
  also covers dialogs in browsers too old for the `toggle` event.
- **Stale disabled look after eventless show/hide.** Completeness is only recomputed on the
  triggers listed above. Revealing fields by swapping a class or style from JS, with no event
  and no dialog toggle behind it, leaves the button looking stale until the next event or
  click. This is an accepted limitation, and it is cosmetic only: the gate recomputes on every
  submit attempt, so a stale-looking button can never let an invalid form through.
- **Resetting the form wipes the validation state.** On the `reset` event every group goes back
  to untouched and unpainted and the form's invalid class is dropped, synchronously. Counters
  and the submit-disable state are recomputed on the next tick, because `reset` fires *before*
  the browser reverts the control values.
- **Fields that are not rendered are skipped.** `display: none` step/variant inputs are passed
  over, so per-variant required inputs never block submit invisibly. The skipping uses
  `getClientRects()`, i.e. actual rendering, so a field inside a `visibility: hidden` (not
  `display: none`) wrapper still validates.

### How the gate hooks in

- **A blocked submit brings the field to the user**: `focus({ preventScroll: true })` first (the
  browser's own focus scroll is instant and lands the field wherever it likes), then
  `scrollIntoView({ block: 'center' })` so the label and error slot stay in view. Smooth by
  default, instant under `prefers-reduced-motion: reduce`.
- **Submit interception happens at document capture**, which runs before Webflow's own form
  handler or any page controller bound on the form, regardless of script load order (including
  scripts injected async via [`loadEnvScript`](./loader.md)). The gate blocks with
  `stopImmediatePropagation()` there, so another capture-phase document listener registered
  **earlier** would still run first: load this script early.
- **Clicks are gated too.** Page controllers often bind `click` on the submit button and call an
  API directly (that path never fires a `submit` event). Clicks on native submit buttons inside
  a bound form are gated automatically; clickables **outside** the form (modal footers) or
  non-native div "buttons" are opted in with `wf-validate-element="submit"`.
