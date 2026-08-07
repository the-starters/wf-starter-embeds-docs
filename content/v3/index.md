---
title: "Intro"
source: v3
---

Source: the `v3/` folder in [`the-starters/starters-webflow`](https://github.com/the-starters/starters-webflow/tree/main/v3)

The scripts that turn the 3.0 Webflow site into a **logged-in product**: route protection,
login routing, the Brand and Talent funnels, messaging, scheduling, the two dashboards,
and the onboarding flow. Where a Global Embed adds one behaviour to one element and a
[Page Script](../page-scripts/index.md) drives one page, these modules run across the whole
member experience and talk to the systems behind it — **Memberstack** (identity, plans,
custom fields), **Xano** (the authoritative data and API), **TalkJS** (chat), **Nylas**
(calendars), and **Stripe Connect** (Starter payouts).

They live in the repo and load through **jsDelivr CDN URLs** with `defer`, so a tagged
release goes live without editing any Webflow embed.

## Conventions shared by every v3 script

These hold across the whole group, so the individual pages below do not repeat them:

- **Designer owns the markup.** Every module binds to Webflow-authored elements through
  `data-*` (or bare custom) attributes. None of them generate forms, grids, tabs, or
  state copy. Rename an attribute in the Designer and the module goes quiet — which is
  exactly how the favorites section marker got broken once; see [Favorites](./favorites.md).
- **Run-once boot guard.** Each file is an IIFE that sets a `window.__starters…Booted`
  flag and returns early on a second load, so a duplicated embed is harmless.
- **Approved hosts.** Most modules are inert outside `the-starters-3-0.webflow.io`,
  `thestarters.com`, and `www.thestarters.com`. Some also allow `localhost`,
  `127.0.0.1`, and `*.trycloudflare.com` for the local dev-tunnel loop.
- **Staging-only diagnostics.** Console output is gated to `*.webflow.io`, localhost,
  `127.0.0.1`, `*.trycloudflare.com`, or `window.STARTERS_DEBUG === true`. Production is
  silent.
- **Fail open.** The redirect and funnel modules treat "leave the page exactly as
  authored" as the safe answer. Only a positive, unambiguous signal ever redirects.
  None of them is a security boundary — Memberstack gated content, the route guard, and
  Xano endpoint authorization are the enforced layers.
- **Trade-token auth.** Modules that call Xano trade the Memberstack JWT from
  `getMemberCookie()` at `api:g1vmSLWh/auth/trade-token/v3` for a Xano bearer token. The
  server derives the member from that token, so no client-supplied member id is trusted.
- **`@release` markers.** Most modules carry an ` * @release vX.Y.Z` header line naming the
  tag that shipped their current contents, often mirrored as a `release` property on the
  module's `window` API. A few older or chrome-only files omit it (for example
  `dashboard-action-items.js`). When present, checking
  `window.StartersV3RouteGuard.release` in the console is the fastest way to spot a stale
  CDN copy.

## What's in this group

- **[Route Guard](./route-guard.md)** (`route-guard.js`): the sitewide access boundary and
  the source of the shared role contract every other module borrows.
- **[Auth Route & Funnel Redirects](./auth-route-and-redirects.md)** (`auth-route.js`,
  `complete-profile-redirect.js`, `brand-profile-redirect.js`,
  `build-profile-redirect.js`): where a member lands after login, and the two
  profile-completion loops that keep them in the right funnel step.
- **[Accounts & Forms](./accounts-and-forms.md)** (`brand-account-controller.js`,
  `talent-application.js`, `password-recovery.js`, `starters-ms-redirect.js`): signup,
  account editing, the Talent apply intake, and password recovery — plus the two
  `/complete-profile` companions, `complete-profile-back.js` (the in-page back button) and
  `complete-profile-loader.js` (the submit spinner).
- **[Hire: Contract & Reviews](./hire-contract-and-reviews.md)** (`project-form.js`,
  `reviews.js`): the `/hire/<slug>` contract-generation form and the review surfaces.
- **[Messaging](./messaging.md)** (`messages.js`, `messages-profile.js`,
  `starter-dashboard-messages.js`): the TalkJS inbox, the profile chat modal, and the
  dashboard messages tile.
- **[Scheduling](./scheduling.md)** (`scheduling-auth.js`, `scheduling-v3-stage.js`,
  `scheduling-availability-init.js`, `scheduling-availability-writer.js`): the Bearer
  adapter, the legacy-to-V3 route map, and the availability flow.
- **[Dashboards](./dashboards.md)** (`dashboard-calls.js`, `starter-dashboard-points.js`,
  `starter-dashboard-stripe-connect.js`, `dashboard-action-items.js`): the call sections,
  the points/rank tile, Stripe Connect, and the Action Items panel chrome.
- **[Onboarding Tour](./onboarding-tour.md)** (`onboarding-tour.js`): attribute-driven
  product tours on driver.js.
- **[Starter Onboarding](./starter-onboarding.md)** (`patch-onboarding-status.js`,
  `onboarding-done-redirect.js`, `onboarding-profile-preview.js`): the
  `/starter-onboarding` page pair and the self-preview card.
- **[Favorites](./favorites.md)** (`all-starters-favorites.js`,
  `saved-starters-roles.js`): paid-Brand favourites on `/all-starters` and the saved-list
  role chips.
- **[Xano Grabber](./xano-grabber.md)** (`xano-grabber/xano-grabber.js`): mirrors an
  already-rendered value into another element on the page.

Most pages here are **cluster overviews**: enough to know what each script owns, where it
installs, and which hooks it reads. The scripts carry long header comments and each has a
sibling `*-WIRING.md` in the repo; treat those as the fine-grained reference. Attribute
tables on these pages are verified against the JavaScript constants.
