---
title: "Quiz Results"
source: quiz-results.js
---

Source: `quiz-results.js` (repo root) — **v1.59.131**

## What it is

The **quiz results page controller**, the largest script in the repo (~5,800 lines). It picks
up the quiz state saved by `quiz-main.js` before signup and turns it into the results page:

- **Input.** `sessionStorage.starterQuizPending`, written by the
  [Quiz Funnel](./quiz-funnel.md) controllers on `/quiz`.
- **Rendering.** Fills the optional Webflow result elements (`data-quiz-*` hooks: text/image
  slots, lists, conditional `data-quiz-show-if` blocks, formatted values, counts).
- **Recommendations.** Queries Algolia for the top matching freelancers (default index
  `Freelancers3.0-dev`) and for related learn-content articles (`LearnContent` index, rendered
  into the page's `wf-algolia-element="results"` region with a Swiper refresh loop).
- **Persistence.** Saves compact quiz state to the logged-in member's **Memberstack member
  JSON**, a short status/result summary to the `starter-quiz` Memberstack custom field, and the
  ad-attribution cookies alongside it (see
  [Attribution persistence](#attribution-persistence)).
- **Routing.** Sends visitors with no usable quiz data back to `/quiz`, with a retake flag when
  the reason is recoverable.

## File structure

```
quiz-results.js       (repo root — readable source, @release v1.59.131)
quiz-results.min.js   (repo root — minified build)
```

Loaded on the quiz results page via jsDelivr with `defer`. Init is guarded by a controller
flag, so double-inclusion is safe.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/quiz-results.js"></script>
```

> **`quiz-results.min.js` is not rebuilt with every change.** Its last commit predates most of
> the behaviour on this page, so treat the minified file as **potentially stale** and load
> `quiz-results.js` unless you have just verified the build. A page loading the `.min.js` will
> silently miss the draft, member-cache, taxonomy, and work-history fixes below.

A separate, older `/quiz-results` **v2-page** footer script exists at `v2/footers/quiz-results.js`
(see [Archives](../archives/v2-footers.md)); the two are not the same file.

The page's loading component is driven by [Quiz Loader](./quiz-loader.md) — this controller
calls `window.StartersQuizLoader.signalReady()` when the results are settled.

## Which payloads count

`sessionStorage.starterQuizPending` has more than one writer, so the controller is deliberately
picky about what it treats as results data:

| `status` | Treated as | Why |
| --- | --- | --- |
| `ready` | Results data | Written by `quiz-main.js` immediately before signup, before the auth-provider hand-off, and before a logged-in retaker is sent here. |
| `draft` | **No data at all** | `quiz-main.js` writes a draft on `/quiz` load, on every answer change, and on every back step. It means "somebody looked at the quiz", never "somebody completed it". |
| missing | Results data | Only old Memberstack/custom-field records have no `status`; downgrading them would bounce members who really do have saved answers. |

Honouring a draft used to hold a logged-out visitor on an empty `/quiz-results` instead of
sending them back to the quiz. A `draft` is now **ignored without being deleted** — `quiz-loader.js`
derives its skip-on-refresh run ID from the same key's `updatedAt` — and the controller falls
through to the saved-quiz lookup and then the `/quiz` redirect. (The single exception is a
member-cached draft belonging to a logged-out visitor; see below.)

This is looser than `quiz-redirect.js`, which accepts **only** an explicit `ready`. There the
fallback costs a redirect; here it costs a member their saved answers.

## Member cache and logout

The controller re-uses the same `starterQuizPending` key to cache a logged-in member's saved
answers, stamping them with **`memberstackSavedAt`** — a field `quiz-main.js`'s `savePendingQuiz()`
never writes, so the marker cleanly tells a member-side cache apart from the funnel's own
pre-signup record.

Because `sessionStorage` outlives logout, a **marked** payload is deleted as soon as Memberstack
**positively reports the visitor as logged out** — never when Memberstack is merely unavailable —
so a signed-out browser stops previewing the previous member's results. An **unmarked**
pre-signup payload is always kept and still previews, which is what makes the logged-out signup
preview work.

The marker is also dropped internally (forcing a re-save) when the taxonomy normalization
changes the payload or when the recommendations are refreshed.

## Attribution persistence

The quiz save is the **first authenticated moment** a paid click can be attached to a member, so
the attribution cookies written sitewide by
[Signup Attribution](./quiz-attribution.md) (`v3/signup-attribution.js`) ride into the **same
`updateMember` call** as `starter-quiz` — one write, not two. This is the `/quiz` half of the
split: `v3/signup-attribution.js` writes the fields itself on every armed signup surface except
`/quiz`.

The cookie-to-field map is the same eight pairs:

| Cookie | Memberstack field ID |
| --- | --- |
| `utm_source` | `utm-source` |
| `utm_campaign` | `utm-campaign` |
| `utm_adset` | `utm-adset` |
| `utm_content` | `utm-content` |
| `fbclid` | `fbclid` |
| `fbc` | `fbc` |
| `fbp` | `fbp` |
| `event_id` | `event-id` |

**This map is duplicated in `v3/signup-attribution.js` on purpose** and the two must stay in
step; a field ID that exists in only one of them is a value Memberstack silently drops on one of
the two signup routes.

Two rules keep the ride-along from ever costing a quiz save:

- **Absent and empty cookies are omitted**, so a later untagged visit never blanks a value an
  earlier tagged visit captured.
- **Gathering them can never fail the save.** Any error reading the cookies degrades to writing
  `starter-quiz` alone.

## Taxonomy migration and forced retakes

Saved answers created before a taxonomy rollout are normalized before retake prefill **and**
before results matching:

- Deterministic renames and merges map to their current IDs.
- Retired choices with no approved successor are discarded.
- If a saved payload has **no current category left**, the controller clears the stale session
  payload and replaces to **`/quiz?retake=true&taxonomyUpdate=1`**.

Keep the compatibility aliases, the 12-category/43-subcategory results catalog, and
`quiz-taxonomy-compatibility.test.js` aligned with each approved taxonomy release.

The **learn carousel** filters on the canonical V3 category ID and, for renamed categories, the
corresponding legacy `LearnContent` slug — `creative` ↔ `creative-brand` and
`marketing-strategy-brand` ↔ `marketing-strategy-leadership`. This keeps existing records
discoverable while new content uses the canonical values. Categories with no learn records, such
as `retention-crm`, stay empty rather than borrowing unrelated content.

## Missing-answers retake

An authenticated member can reach the page with a completion marker but no usable answers — the
`starter-quiz` custom field says "done" while the member JSON is missing or malformed. The
controller reads the marker and picks the destination accordingly:

| Visitor | Destination |
| --- | --- |
| Authenticated, `starter-quiz` custom field non-empty, no usable answers | `/quiz?retake=true&quizDataMissing=1` |
| Authenticated, no completion marker, no usable answers | `/quiz` |
| Logged out with no pending, test, or saved quiz data | `/quiz` |

The `retake=true` half matters: without it, `quiz-redirect.js` would bounce the member straight
back to `/quiz-results` on the strength of the same custom field, and the two controllers would
ping-pong.

## Algolia configuration priority

Freelancer-recommendation settings resolve **per value**, in this order:

1. `window.starterQuizAlgoliaConfig` = `{ appId, searchKey, indexName }`
2. Dedicated `data-starter-quiz-algolia-*` attributes on the page (legacy `data-algolia-*`
   attributes are still accepted)
3. The existing wf-algolia `script[data-app-id][data-search-key]`

Because each setting resolves independently, the app ID and search key may sit on a **different
element** from the index name. With no index configured anywhere, the default is
`Freelancers3.0-dev`; with no app ID, `PKVW6M9OPZ`. A missing search key throws with a message
naming all three ways to supply it.

**Do not use a general `[wf-algolia-index]` wrapper to configure these searches.** The page's
LearnContent carousel owns its own wrapper and index; borrowing that wrapper for freelancer
recommendations can return no Starter cards at all. The learn carousel resolves its own config
the same way, additionally honouring `window.starterQuizLearnContentAlgoliaConfig`.

## Main hook families (overview)

| Hook family | Purpose |
| --- | --- |
| `data-quiz-text` / `data-quiz-img` / `data-quiz-format` / `data-quiz-fallback` | Value slots filled from the quiz result (with formatting and fallback fields). |
| `data-quiz-list` / `data-quiz-card` / `data-quiz-index` / `data-quiz-join` / `data-quiz-sep` | List/template rendering of multi-value results. |
| `data-quiz-show-if` / `data-quiz-required` | Conditional visibility of result blocks. |
| `data-quiz-count` / `data-quiz-category-count` / `data-quiz-subcategory-count` / `data-quiz-starter-count` | Count slots. |
| `data-quiz-algolia-list` / `data-quiz-results` | Freelancer recommendation rendering. |
| `data-quiz-learn-index-name` / `data-quiz-learn-filter-field` / `data-quiz-learn-limit` | Learn-content Algolia overrides (defaults: `LearnContent`, `categories`, 4 hits). |
| `data-starter-quiz-algolia-app-id` / `data-starter-quiz-algolia-search-key` / `data-starter-quiz-algolia-index-name` | Algolia credential and index overrides on the page (legacy `data-algolia-*` still read). |
| `starter-quiz-test-*` | Built-in test-harness controls (grid/cards/actions) for QA. |

Recommendation cards also accept the shared wf-algolia grammar (`wf-algolia-text`,
`wf-algolia-if`, `wf-algolia-image`, `wf-algolia-format`, `wf-algolia-link-template`) as aliases
wherever the semantics match, so card markup can be shared with other Algolia surfaces.

## Work-history companies on recommendation cards (v1.59.112)

A `previous-company` binding now prefers **every** company in the hit's `work-history` attribute,
so recommendation cards list companies the same way `/all-starters` does (`work-history.0.company`,
`.1.company`, `.2.company`). Records without `work-history` fall back to the single
`previous-company` string, and a candidate with neither hides the binding as before.

Companies stay in the index's array order. Repeat stints at one company collapse to a single
entry, matched case-insensitively with the first spelling kept, and entries whose `company` is
missing or is not a string are dropped rather than coerced.

The fix shipped as **v1.59.112**; the source header briefly read `v1.59.111` before that tag was
taken by a concurrent release, so both numbers appear in the history for the same change.

## Role display names on recommendation cards (v1.59.131)

Recommendation cards resolve role slugs through a `ROLE_NAMES` map before they render — for
example `ui-ux-designer` → `UI/UX Designer`. The map is the same family as
`v3/saved-starters-roles.js` and `algolia-result-modifiers/roles.js`. A slug with no map entry
falls back to a title-cased version of the slug.

## Notes & gotchas

- `starterQuizResultsDebugEnabled` at the top of the file hard-disables its logging; otherwise
  logs are opt-in per session with `?starterQuizDebug=1` (see
  [Quiz Funnel → Diagnostics](./quiz-funnel.md#diagnostics)).
- The learn-content section retries aggressively (filter waits, post-process delays, Swiper
  refresh loops) because it renders into a wf-algolia region that finishes late. Don't
  "simplify" the retry constants without testing on a slow connection.
- Persistence needs a **logged-in** Memberstack member; anonymous visitors get the rendered
  results but nothing is saved.
- **v1.26.2:** when binding a freelancer image, the script strips the template `<img>`'s
  `srcset` and `sizes` attributes; Webflow templates carry a placeholder pair that outranks
  the newly set `src`, which kept rendering the placeholder.
- This page is an overview; the file's header comment and JSDoc are the detailed reference.

Run the focused Algolia-config, taxonomy, saved-answer fallback, draft-payload, and work-history
regressions with:

```sh
node --test quiz-results-config.test.js quiz-taxonomy-compatibility.test.js quiz-member-json-fallback.test.js quiz-results-pending-draft.test.js quiz-results-work-history.test.js
```
