---
title: "Intro"
---

Source: the GitHub repo [`the-starters/starters-webflow`](https://github.com/the-starters/starters-webflow) (repo root)

Whole-page controllers for the 3.0 site. Where a Global Embed adds one behaviour to one
element, these scripts drive an entire page (or a page family plus its modals): they
authenticate the member, talk to the Xano API, and render/bind large parts of the page.

Like the [Utils](../utils/index.md), they are hosted in the `starters-webflow` GitHub repo and
loaded through **jsDelivr CDN URLs** with `defer` in the page (or site) footer custom code.

## What's in this group

- **[Opportunities 3.0: Core](opportunities-3-0.md)** (`opportunities-3.0.js`): the shared
  Webflow ↔ Xano binder for the opportunities pages and their modals; exposes `window.Opp30`.
- **[Opportunities: Create](opportunities-create.md)** (`opportunities---create.js`): the
  `/opportunities---create` page controller; binds the brand "create opportunity" form through
  the core.
- **[Quiz Results](quiz-results.md)** (`quiz-results.js`): the quiz results page controller
  that renders results, fetches Algolia recommendations, and persists quiz state to
  Memberstack.

These pages are **overviews**: enough to know what each script owns, how it loads, and which
hooks it reads. The scripts themselves carry detailed header comments and JSDoc; treat those as
the fine-grained reference.
