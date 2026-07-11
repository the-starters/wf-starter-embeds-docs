---
title: "Quiz Results"
source: quiz-results.js
---

Source: `quiz-results.js` (repo root; `quiz-results.min.js` is its minified build)

## What it is

The **quiz results page controller**, the largest script in the repo (~5,100 lines). It picks
up the quiz state saved by `quiz-main.js` before signup and turns it into the results page:

- **Input.** `sessionStorage.starterQuizPending`, written by `quiz-main.js` (the quiz flow
  itself lives in Webflow, not in this repo).
- **Rendering.** Fills the optional Webflow result elements (`data-quiz-*` hooks: text/image
  slots, lists, conditional `data-quiz-show-if` blocks, formatted values, counts).
- **Recommendations.** Queries Algolia for the top matching freelancers and for related
  learn-content articles (`LearnContent` index, rendered into the page's
  `wf-algolia-element="results"` region with a Swiper refresh loop).
- **Persistence.** Saves compact quiz state to the logged-in member's **Memberstack member
  JSON**, and a short status/result summary to the `starter-quiz` Memberstack custom field.

## File structure

```
quiz-results.js       (repo root — readable source)
quiz-results.min.js   (repo root — minified build)
```

Loaded on the quiz results page via jsDelivr with `defer`. Init is guarded by a controller
flag, so double-inclusion is safe. A separate, older `/quiz-results` **v2-page** footer script
exists at `v2/footers/quiz-results.js` (see [Archives](../archives/v2-footers.md)); the two
are not the same file.

## Main hook families (overview)

| Hook family | Purpose |
| --- | --- |
| `data-quiz-text` / `data-quiz-img` / `data-quiz-format` / `data-quiz-fallback` | Value slots filled from the quiz result (with formatting and fallback fields). |
| `data-quiz-list` / `data-quiz-card` / `data-quiz-index` / `data-quiz-join` / `data-quiz-sep` | List/template rendering of multi-value results. |
| `data-quiz-show-if` / `data-quiz-required` | Conditional visibility of result blocks. |
| `data-quiz-count` / `data-quiz-category-count` / `data-quiz-subcategory-count` / `data-quiz-starter-count` | Count slots. |
| `data-quiz-algolia-list` / `data-quiz-results` | Freelancer recommendation rendering. |
| `data-quiz-learn-index-name` / `data-quiz-learn-filter-field` / `data-quiz-learn-limit` | Learn-content Algolia overrides (defaults: `LearnContent`, `categories`, 4 hits). |
| `starter-quiz-algolia-app-id` / `starter-quiz-algolia-search-key` | Algolia credential overrides on the page. |
| `starter-quiz-test-*` | Built-in test-harness controls (grid/cards/actions) for QA. |

## Notes & gotchas

- `starterQuizResultsDebugEnabled` at the top of the file controls its console logging.
- The learn-content section retries aggressively (filter waits, post-process delays, Swiper
  refresh loops) because it renders into a wf-algolia region that finishes late. Don't
  "simplify" the retry constants without testing on a slow connection.
- Persistence needs a **logged-in** Memberstack member; anonymous visitors get the rendered
  results but nothing is saved.
- This page is an overview; the file's header comment and JSDoc are the detailed reference.
