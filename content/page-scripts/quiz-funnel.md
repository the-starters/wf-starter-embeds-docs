---
title: "Quiz Funnel"
source: quiz-main
sources:
  - quiz-main/quiz-home.js
  - quiz-main/quiz-main.js
  - quiz-main/quiz-redirect.js
---

Source: `quiz-main/quiz-home.js`, `quiz-main/quiz-main.js`, `quiz-main/quiz-redirect.js`
(loaded via jsDelivr CDN URLs)

## What it is

The three page controllers that run **before** the results page: the homepage hero form, the
`/quiz` entry redirect, and the `/quiz` category/subcategory flow. Together they collect the
member's answers and hand them to [Quiz Results](./quiz-results.md) through
`sessionStorage`.

- **`quiz-home.js`** owns `[data-quiz-form="home"]` on the home page. It saves the IDs of the
  selected checkboxes to `sessionStorage.quizSelectedCategories` on every change and on submit,
  then sends the visitor to `/quiz`.
- **`quiz-redirect.js`** (**v1.59.84**) is the `/quiz` entry gate. `/quiz` sits outside every
  page table in `v3/route-guard.js`, so this controller is the only thing deciding who may not
  sit on the page.
- **`quiz-main.js`** (**v1.59.88**) owns the quiz itself: it restores prior selections,
  persists answers to `sessionStorage.starterQuizPending`, skips the signup step for a
  logged-in retaker, and writes the post-signup redirect attributes onto the signup form.

The quiz results page (`quiz-results.js`) and the head-time loading gate
([Quiz Loader](./quiz-loader.md)) are separate controllers with their own pages.

Sitewide UTM/Meta ad attribution lives in `v3/signup-attribution.js`, not in this funnel. See
[Signup Attribution](./quiz-attribution.md).

## File structure

```
quiz-main/
├── quiz-home.js         (~170 lines — home page)
├── quiz-redirect.js     (~280 lines — /quiz entry gate)
├── quiz-main.js         (~1,540 lines — /quiz flow)
└── quiz-tabs.js, quiz-tabs-toggler.js, quiz-page-theme.js, *.css
```

The tab/theme files power the tab-driven quiz layout (panels, Previous/Next gating, page
background theming) and are not part of the funnel contract described here.
Attribution lives in `v3/` — see [Signup Attribution](./quiz-attribution.md).

**Load order.** On the home page, one deferred tag:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/quiz-main/quiz-home.js"></script>
```

On `/quiz`, both controllers with `defer`, **after** the site Memberstack bootstrap, and the
redirect first so a member who should not be on the page is moved before the flow initializes:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/quiz-main/quiz-redirect.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/quiz-main/quiz-main.js"></script>
```

Each file carries its own controller flag, so a duplicate tag is skipped rather than
double-binding. `quiz-home.js` also initializes correctly whether the DOM is already parsed or
not.

## Entry redirect table

`quiz-redirect.js` waits up to ten seconds for `$memberstackDom`, then tests these branches in
order — **the first match wins**:

| Member state | `/quiz` behaviour | `?retake=` |
| --- | --- | --- |
| Paid Brand (`pln_new-paid-plan-463h04ph`) or Test Brand (`pln_dorxata-test-brand-plan-777r02pa`) | Replace with `/brand-dashboard` | Suppressed |
| Talent (`pln_dorxata-test-free-plan-dvcg0k8o`) | Replace with `/starter-dashboard` | **Ignored** |
| Any logged-in member whose `sessionStorage.starterQuizPending` payload has `status: 'ready'`, whatever their plan and custom field say | Replace with `/quiz-results` | Suppressed |
| Free Brand (`pln_free-plan-f6kn0dxz`) with a non-empty `starter-quiz` custom field | Replace with `/quiz-results` | Suppressed |
| Incomplete free Brand, logged-out visitor, inactive or unknown plan | Stay on `/quiz` | n/a |

`?retake=true`, `?retake=1`, or `?retake=yes` keeps an otherwise redirected Brand on the quiz;
retake links must use one of those three values. The Talent bounce deliberately ignores the
parameter — the hatch exists so a Brand can re-run their own quiz, and Talent has no quiz to
retake. A member holding both a Talent and a paid Brand plan keeps the paid
`/brand-dashboard` outcome (that state is the `conflicting-plan-roles` configuration error, and
this page is not where it gets resolved). The controller also re-evaluates after a Memberstack
auth change, and its plan IDs match the roles in `v3/route-guard.js`.

### Ready-payload safety net

The `ready`-payload row is a **self-healing branch for a signup that came back to the wrong
page**. If Memberstack loses the post-signup destination (see the signup redirect contract
below), the brand-new member lands on `/quiz` at step 1, and the `starter-quiz` custom field is
no help because `/quiz-results` is what writes it. The `ready` payload `quiz-main.js` saved
immediately before signup is the only evidence the quiz was finished, so it alone moves them —
deliberately without requiring a plan or the custom field, because a member who just signed up
has neither yet.

Only an explicit `ready` counts. A `draft` or status-less payload just means somebody looked at
the quiz, and a malformed payload is ignored silently; all three leave the visitor on `/quiz`.
This is **stricter than `quiz-results.js`**, which also accepts a status-less payload as usable,
because there the fallback costs a member their saved answers while here it only costs a
redirect.

The branch sits after both the paid-Brand and Talent bounces so neither destination changes, and
`?retake=` suppresses it like every other Brand redirect — a deliberate retake has to be able to
sit on `/quiz` with a stale `ready` payload still in session. The controller never writes or
deletes the key.

## Storage keys

| Key | Written by | Read by | Contents |
| --- | --- | --- | --- |
| `sessionStorage.quizSelectedCategories` | `quiz-home.js` | `quiz-main.js` | JSON array of homepage bucket checkbox IDs. |
| `sessionStorage.starterQuizPending` | `quiz-main.js` (`draft` on load and on every answer change, `ready` before signup / auth hand-off / retaker navigation); re-written by `quiz-results.js` as a member cache | `quiz-redirect.js`, `quiz-main.js`, `quiz-results.js`, `quiz-loader.js` | `categories`, `subcategories`, optional `resultSlug`, `status`, `updatedAt`, `completedAt`. |
| `sessionStorage.starterQuizLoaderPlayed` | the DevLink loading component | `quiz-loader.js` | The run ID whose loader animation already played. |

Three consumers read `starterQuizPending` differently, which is why nobody deletes it casually:
`quiz-redirect.js` only honours `ready`; `quiz-results.js` ignores a `draft` **without** removing
it; and `quiz-loader.js` derives its skip-on-refresh run ID from the same key's `updatedAt`.
The one payload `/quiz-results` does delete is a member cache (one carrying `memberstackSavedAt`,
a field `quiz-main.js` never writes) held by a positively logged-out visitor.

## Signup redirect contract

At boot `quiz-main.js` sets `redirect="/quiz-results"` on `[data-quiz-form="signup"]`, from the
same `resultsRedirectPath` constant the logged-in retake redirect uses.

**Both redirect attributes have to be present, and they are read by different Memberstack code
paths:**

- `data-ms-redirect` is picked up only from a **click** listener, which stashes the value in
  `sessionStorage["ms-redirect-override"]` when a click lands inside the element. An **Enter-key
  submit never registers the override**.
- The plain `redirect` attribute is read by Memberstack's signup submit handler directly off the
  form, and that value outranks both the stored override and the server-side plan redirect.

With `data-ms-redirect` alone, an Enter-key signup therefore fell back to the plan redirect and
returned the brand-new member to `/quiz` at step 1. This is the same defect that
`configureLoginForms()` in `v3/auth-route.js` fixes for the `/login` forms, and the fix is the
same shape.

`data-ms-redirect` stays the Designer's — it is what carries the destination through the
click-driven provider flows — so the controller only fills it in when the markup has no value at
all and never overwrites an authored one. Adding `redirect="/quiz-results"` in the Designer as
well is harmless: the script writes the same value, so the two are idempotent.

## Restoring saved answers

`quiz-main.js` pre-fills the quiz from three independent sources, in priority order:

1. **The visitor's own draft.** An **unmarked** `sessionStorage.starterQuizPending` payload is
   restored **first and wins over the homepage seed**, so a reload or a browser Back/Forward
   keeps the answers the user actually has instead of snapping back to what they picked on the
   home page. Details below.
2. **Homepage buckets.** Bucket IDs from `sessionStorage.quizSelectedCategories` are mapped to
   category checkbox IDs through the hidden `[data-quiz-bucket]` CMS list. This is a **one-time
   seed**: it applies only when there is no draft yet, and it is cleared on the first user edit
   so it can never outlive the answers it seeded.
3. **Memberstack member JSON.** A logged-in member's saved `starterQuiz` object is read
   asynchronously and its matching category and subcategory IDs are checked. The restore never
   clears existing selections, so the sources merge. Restoring a saved subcategory also
   selects its parent category, so merged or renamed subcategories keep a valid parent. If the
   member edits or advances the quiz before Memberstack returns, the delayed restore is skipped.

Any source flips the start-heading copy from `[data-start-default]` to `[data-start-filled]`.
Saved answers are restored whenever a logged-in member with a non-empty `starterQuiz` object
reaches `/quiz`; `?retake=true` controls only the entry redirect, not the restore.

### The draft boundary

`starterQuizPending` has two writers, so `quiz-main.js` is picky about which payloads it will
accept back as a draft:

| Payload on the key | Treated as | Why |
| --- | --- | --- |
| Unmarked, holds at least one answer | **The authority** | It is the visitor's own live selection, so it outranks the homepage seed. |
| Unmarked but empty | **No draft** | Nothing to restore, so a first arrival stays on the homepage-seed path. |
| Carries `memberstackSavedAt` | **Rejected** | It is `quiz-results.js`'s member cache, not a pre-signup draft. |
| Unparseable or not an object | **No draft** | Ignored silently; the seed path still runs. |

The `memberstackSavedAt` rejection is the important one. That marker is stamped by
`quiz-results.js` onto a logged-in member's cached answers (see
[Member cache and logout](./quiz-results.md#member-cache-and-logout)), and because `sessionStorage`
outlives logout **in the same tab**, accepting it here would restore one member's answers into
the quiz form for whoever opens `/quiz` next. Rewriting it through `savePendingQuiz()` — which
never emits the marker — would also erase the very field `quiz-results.js` needs in order to
clear the cache. Member answers belong to the Memberstack restore in step 3, which resolves the
current member first.

The marker is read type-safely (trim, no `String()` coercion) because `sessionStorage` is
visitor-writable: a tampered or numeric marker must not throw and take the whole boot flow down.

**An empty draft is not a seed replay.** The empty-payload row exists so that "I have a draft
with nothing in it" degrades to the homepage seed rather than blocking it — the seed still only
applies once.

Answers created before a taxonomy rollout are normalized before retake prefill and results
matching — see [Taxonomy migration](./quiz-results.md#taxonomy-migration-and-forced-retakes).

## Webflow markup contract

Publish these custom attributes in Webflow before releasing scripts that use this contract. Keep
the existing Webflow form names and IDs during rollout; the scripts no longer read them, but
removing them is a separate cleanup.

| Attribute | On | Required | Purpose |
| --- | --- | --- | --- |
| `data-quiz-form="home"` | the single homepage quiz form | yes (home) | Stable role for the hero form, independent of generated form names/IDs. |
| `data-quiz-form="categories"` | the single main category form | yes | Category step form. |
| `data-quiz-form="subcategories"` | every subcategory form | yes | Subcategory step forms. |
| `data-quiz-form="signup"` | the single final signup form | yes | Receives the `redirect` / `data-ms-redirect` attributes; saves the `ready` payload on submit. |
| `data-main-is-categories` / `data-main-is-subcategories` | the two main steps | yes | Marks which step is which. |
| `data-tab-wrapper` + `data-tab="previous\|next"` | navigation | yes (tab layout) | Tab-driven navigation. `[data-step-back]` / `[data-step-next]` wrappers are the custom-step alternative. |
| `data-quiz-bucket` | hidden CMS list | optional | One child per homepage bucket: a checkbox whose `id` is the bucket ID, plus a nested CMS list whose `[role="listitem"]` text values are category checkbox IDs. |
| `data-start-heading` + `data-start-default` / `data-start-filled` | start heading | optional | Alternative copy shown when the form arrives pre-filled. |
| `data-tab-category-link="<category id>"` / `data-tab-content` | subcategory panels/slides | optional (tab layout) | The final answer slide must be `data-tab-content="ways"` and the signup slide `data-tab-content="signup"`. |
| `data-category="<category id>"` | subcategory items | optional (non-tab layout) | Parent category for each subcategory item. |
| `data-ms-auth-provider` | provider signup triggers | optional | Saves the `ready` payload before the auth hand-off, alongside the signup form's own submit. |
| `data-quiz-result-slug="<slug>"` | anywhere on the page | optional | Supplies an already-calculated result slug into the payload. |

The script updates both native checkbox state and Webflow's custom checked class. Category IDs
in the forms, bucket mappings, and subcategory parent attributes must match **after trimming**.
Saved subcategory IDs match the checkbox `id` first, then its `value`, then its visible label.

## Diagnostics

Append `?starterQuizDebug=1` (also `true` or `yes`) to enable namespaced
`[Starter Quiz Funnel]` console logs for the session; `?starterQuizDebug=0` (also `false` or
`no`) clears the session flag. A `localStorage.starterQuizDebug` value of `"true"` also enables
logging. Logging defaults **off** across the homepage, `/quiz`, and `/quiz-results` controllers.

Run the focused quiz tests, including the form-selector contract regression, with:

```sh
node --test quiz-main/*.test.js quiz-results-config.test.js quiz-taxonomy-compatibility.test.js quiz-member-json-fallback.test.js quiz-results-pending-draft.test.js
```

## Notes & gotchas

- **A logged-in retaker never sees the signup step.** From the final quiz step, `quiz-main.js`
  saves the `ready` payload and navigates straight to `/quiz-results`.
- **Browsing the quiz leaves a `draft` behind.** `quiz-main.js` writes the payload once on
  `/quiz` load and again on every answer change, so a `draft` payload means "somebody looked at
  the quiz", never "somebody completed it". Downstream consumers are built around that.
- **`/quiz` is not route-guarded.** Access rules for the page live entirely in
  `quiz-redirect.js`; `v3/route-guard.js` deliberately has no table entry for it.
- **A member cache never restores into the quiz form.** See
  [The draft boundary](#the-draft-boundary); this is the rule that keeps a logged-out visitor
  from inheriting the previous member's answers in the same tab.
- `quiz-main.js` is tagged **v1.59.88** and `quiz-redirect.js` **v1.59.84**; `quiz-home.js`
  carries no release header. Sitewide attribution is `v3/signup-attribution.js` — see
  [Signup Attribution](./quiz-attribution.md).
