---
title: "Plan Dates"
source: account-settings/plan-dates.js
---

Source: `account-settings/plan-dates.js` (ships as `@release v1.59.90`)

## What it is

Prints a member's plan and billing dates into the page, formatted `Jan 10, 2000`. It exists so a
pause UI can tell a member the date their subscription actually resumes — which by default is
their paid-through date plus the pause, **not** their signup date plus the pause.

Load it with `defer` in the page footer, after the Memberstack script:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/account-settings/plan-dates.js"></script>
```

Tag any text element with the field you want. That is the only attribute required:

```html
<span ms-form-pause-date="next-billing">—</span>
```

## Markup contract

A whole pause block, configured once on the wrapper, with the member choosing the length:

```html
<div ms-form-pause-input>
  <label class="w-radio"><input type="radio" name="pause" value="1 month"> 1 month</label>
  <label class="w-radio"><input type="radio" name="pause" value="2 months"> 2 months</label>
  <label class="w-radio"><input type="radio" name="pause" value="3 months"> 3 months</label>
</div>

<div ms-form-pause-months="3">
  <p>Paused from <span ms-form-pause-date="next-billing">—</span></p>
  <p>Billing resumes <span ms-form-pause-date="resumes-at">—</span></p>
</div>
```

## API

| Attribute | Goes on | Required | Default | Purpose |
| --- | --- | --- | --- | --- |
| `ms-form-pause-date` | the text element that displays the date | **Yes** | — | Names which date to print. This is what makes the element render at all; an element without it is ignored. |
| `ms-form-pause-input` | the radio-group wrapper, **or** each input | No | — | Marks the control the member uses to choose the pause length. `resumes-at` re-renders on every `change`. |
| `ms-form-pause-reveal` | a wrapper around the whole sentence | No | — | Keeps the block hidden until the member picks an option **and** every date inside resolves. Needs the paired CSS rule. |
| `ms-form-pause-months` | the date element or any ancestor | No | `1` | Static pause length in months, used when no marked control is checked. |
| `ms-form-pause-anchor` | the date element or any ancestor | No | `next-billing` | What `resumes-at` counts from: `next-billing` or `signup`. |
| `ms-form-pause-empty` | the date element or any ancestor | No | `—` | Text rendered when the date cannot be resolved. |

Everything except `ms-form-pause-date` and `ms-form-pause-input` is read from the element **or
any ancestor**, so one wrapper configures a whole block; an attribute on the element itself beats
the same one on a wrapper.

### Values for `ms-form-pause-date`

| Value | Source | Notes |
| --- | --- | --- |
| `signup` | `member.createdAt` | The signup date, **not** the subscription start. A member who joined free in January and upgraded in June still reads January. |
| `next-billing` | `payment.nextBillingDate` | End of the current period; the paid-through date. |
| `resumes-at` | anchor + pause length | The date billing restarts. |

Only `signup` resolves for a free-plan member: Memberstack sends `payment: null` there, so
`next-billing` renders the empty text, and `resumes-at` does too unless its anchor is `signup`.

## Choosing what `resumes-at` counts from

`next-billing` is the default because a member pausing on the 20th of a cycle that renews on the
1st would otherwise ride unpaid days or be charged mid-pause. The paid-through date is the end of
the period they already bought, which is what Stripe's `pause_collection.resumes_at` means.

That default is a recommendation, not a restriction. `signup` answers a different and legitimate
question, and it is the **only** anchor that resolves for a member with no paid connection:

```html
<span ms-form-pause-date="resumes-at" ms-form-pause-anchor="signup">—</span>
```

## Resolving the pause length

Sources resolve **nearest-first**: a marked control in the closest ancestor that has one (the
wrapper counts as its own scope), then the document, then the inherited static
`ms-form-pause-months`, then one month. Walking up before reading the document is what lets two
independent pause groups coexist on one page — each output reads the group it is nested inside,
and an untouched block falls back to its own static attribute rather than borrowing the other
group's checked option.

A control's value is parsed for its first integer, so `2` and `2 months` both mean two. Radios,
checkboxes, `<select>`, and a plain number input all work. An **unchecked** radio expresses
nothing and is skipped — reading its value anyway is how a three-option group ends up reporting
whichever option sits first in the DOM rather than the one the member picked.

**If the Designer value is blank, the label text is read instead.** Webflow only emits a radio's
`value` when the author fills in Radio Settings → Value, so a group whose options merely *read*
"1 month / 2 months / 3 months" reports `""` or `"on"` to the browser. The control's own label
text is parsed as a fallback, and a selected control with no number anywhere warns on staging by
name. Filling in the Designer value is still the better habit.

The change listener is delegated on `document`, so a group inside a Webflow component or an
inactive tab pane still works, and a radio click costs **no** Memberstack round trip — the member
hasn't changed, only the arithmetic.

## Hiding the sentence until the member chooses

Wrap the paragraph — copy and inline date together — and paste the paired CSS once:

```html
<style>
  [ms-form-pause-reveal]:not(.is-ms-form-pause-shown) { display: none !important; }
</style>

<div ms-form-pause-reveal>
  <p>Your membership pauses and billing resumes
     <span ms-form-pause-date="resumes-at">—</span>.</p>
</div>
```

The wrapper reveals only when **both** hold: a marked control has expressed a pause length, and
every date element inside resolved to a real date. The second condition is the point of wrapping
a sentence rather than just the date — "Billing resumes —" is exactly the state the wrapper
exists to prevent. A wrapper containing no date element rests on the first condition alone.

"Has not chosen yet" and "chose one month" both compute a one-month pause, so the reveal test
reads the **source** of the answer, not its value: a static `ms-form-pause-months` does not count
as the member choosing.

**Why a class plus a CSS rule and not an inline style.** The rule hides the block from the very
first paint, so nothing flashes before this deferred script runs, and revealing doesn't have to
guess whether the Designer set the block to `block`, `flex`, or `grid`. If the script never loads
the block stays hidden, which is the right outcome for a sentence whose only content is a date it
cannot fill. **Do not swap the rule for the `hidden` attribute** — a Webflow class carrying
`display: flex` beats the user-agent `[hidden]` rule and the block stays visible.

## `window.StartersPlanDates`

Every exported key, for staging console checks and the test suite. An earlier revision exported
27 keys while documenting 8; if you add one, document it in the same commit.

| Key | Use |
| --- | --- |
| `release` | The tag this file ships in; matches the `@release` header. |
| `diagnosticsEnabled()` | Whether this host warns. |
| `toDate(v)` | Normalize Date / ISO / Unix seconds / Unix ms. |
| `formatDate(v)` | `"Jan 10, 2000"`, always UTC. |
| `addMonths(v, n)` | Day-clamping month arithmetic. |
| `parseMonths(raw)` | First integer in a value, or `null`. |
| `pickConnection(member)` | The connection dates are read from. |
| `resolveField(member, field, opts)` | One raw date; `opts` takes `pauseMonths` and `anchor`. |
| `resolvePause(el)` | `{months, fromControl}` for an element. |
| `renderElement(el, member)` | Render one element; returns its text. |
| `renderAll(member)` | Render the page. |
| `rerender()` | Re-render against the member already resolved. |
| `shouldReveal(wrapper, resolved)` | Reveal decision for one wrapper. |
| `applyReveal(resolved)` | Toggle every reveal wrapper. |
| `fields` | `['signup', 'next-billing', 'resumes-at']` |
| `anchors` | `['next-billing', 'signup']` |

## Notes & gotchas

- **This module does not pause anything.** It only reads and prints; the actual pause needs a
  Xano endpoint calling Stripe `pause_collection` with `resumes_at`.
- **Dates format in UTC, and that is not configurable.** Memberstack returns billing dates as
  instants, and rendering one in the viewer's local zone moves the calendar day for everyone west
  of UTC. A per-block `ms-form-pause-tz` override existed and was removed rather than fixed:
  month arithmetic runs on UTC calendar fields, so the override made the two fields disagree —
  `2026-03-01T00:00:00Z` in `America/Los_Angeles` printed `next-billing` as **Feb 28, 2026**
  beside a one-month `resumes-at` of **Mar 31, 2026**. If a fixed business zone is ever genuinely
  needed, the arithmetic has to move into that zone in the same change.
- **Month arithmetic clamps the day.** Jan 31 plus one month is Feb 28 (Feb 29 in a leap year),
  and Aug 31 plus one month is Sep 30. Plain `setMonth` overflows Jan 31 into Mar 3, so don't
  swap it back in. A clamped month is not a fixed number of days.
- **Timestamps are unit-sniffed, not assumed.** `createdAt` arrives as an ISO string while the
  `payment.*` dates arrive as numbers, and Memberstack isn't consistent about seconds versus
  milliseconds, so `toDate()` splits at `1e10`. A seconds value passed straight to `new Date()`
  renders in January 1970.
- **The plan connection is auto-picked** as the first *active* connection carrying a `payment`
  object, then any active connection. A member can hold both a free and a paid connection, and
  only the paid one has billing dates, so "first connection" is never safe.
- **Verify a field exists before adding one.** Every field name is confirmed against Memberstack's
  published response example. An earlier revision shipped a `cancel-at` field reading
  `payment.cancelAtDate`, a key absent from that example, so it could only ever have rendered the
  empty text.
- **Fail-quiet everywhere.** A logged-out visitor, a free-only member, a `payment: null`
  connection, a failed `getCurrentMember`, or Memberstack never appearing all render the
  `ms-form-pause-empty` text — never a stale date, never `Invalid Date`. A page with no
  `[ms-form-pause-date]` element never calls Memberstack at all.
- **Login and logout re-render without a refresh** via `onAuthChange`, with a `pageshow` guard so
  the back/forward cache can't restore the previous member's dates.
- **Staging-only diagnostics** (`*.webflow.io`, localhost, `127.0.0.1`, `*.trycloudflare.com`, or
  `window.STARTERS_DEBUG === true`) warn about an unknown field or anchor value, a non-numeric
  `ms-form-pause-months`, a selected pause control with no month count in its value or label, a
  failed `getCurrentMember`, and Memberstack never appearing. Deliberately silent: a member with
  no paid connection, and a group with nothing checked yet — both are ordinary states, not
  authoring mistakes.
