---
title: "Intro"
---

Source: the GitHub repo [`the-starters/starters-webflow`](https://github.com/the-starters/starters-webflow) (repo root)

Whole-page controllers for the 3.0 site. Where a Global Embed adds one behaviour to one
element, these scripts drive an entire page (or a page family plus its modals): they
authenticate the member, talk to the Xano API, and render/bind large parts of the page.

Like the [Utils](../utils/index.md), they are hosted in the `starters-webflow` GitHub repo and
loaded through **jsDelivr CDN URLs** with `defer` in the page (or site) footer custom code. The
one exception is [Quiz Loader](./quiz-loader.md), which must load in the `<head>` **without**
`defer`.

## What's in this group

**Opportunities**

- **[Opportunities 3.0: Core](./opportunities-3-0.md)** (`opportunities-3.0.js`): the shared
  Webflow ↔ Xano binder for the opportunities pages, the merged `/opportunities` feed, the
  starter-dashboard sections, and their modals; exposes `window.Opp30`.
- **[Opportunities: Create](./opportunities-create.md)** (`opportunities---create.js`): the
  `/opportunities---create` page controller; binds the brand "create opportunity" form through
  the core.

**Quiz funnel**

- **[Quiz Funnel](./quiz-funnel.md)** (`quiz-main/`): the homepage hero form, the `/quiz` entry
  redirect, and the `/quiz` category flow that produce the saved quiz payload.
- **[Signup Attribution](./quiz-attribution.md)** (`v3/signup-attribution.js`): sitewide
  UTM/Meta ad capture, form-detection for signup surfaces, `CompleteRegistration` on signup,
  and Memberstack field persistence (the `/quiz` path rides those cookies into
  [Quiz Results](./quiz-results.md)).
- **[Quiz Results](./quiz-results.md)** (`quiz-results.js`): the quiz results page controller
  that renders results, fetches Algolia recommendations, and persists quiz state to
  Memberstack.
- **[Quiz Loader](./quiz-loader.md)** (`quiz-loader/quiz-loader.js`): the head-time skip-on-refresh
  paint gate and "results ready" signal for the `/quiz-results` loading component.

**Messaging**

These scripts live in `v3/` but are documented here because they are page-scoped.

- **[Messages 3.0](./messages-3-0.md)** (`v3/messages.js`): the `/messages` TalkJS inbox
  bootstrap, including `?with=` deep links.
- **[Profile Message Modal](./messages-profile.md)** (`v3/messages-profile.js`): the "Message
  this starter" chatbox inside the `/hire/<slug>` modal.

**Other**

- **[Profile Image Auth Shim](./profile-image-auth-shim.md)** (`profile-image-auth-shim.js`): an
  interim `fetch` wrapper that adds Xano auth (and downscales the image) for profile-photo
  uploads. Temporary — see the page.

These pages are **overviews**: enough to know what each script owns, how it loads, and which
hooks it reads. The scripts themselves carry detailed header comments and JSDoc; treat those as
the fine-grained reference.
