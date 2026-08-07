---
title: "Onboarding Tour"
source: v3/onboarding-tour.js
---

Source: `v3/onboarding-tour.js`

## What it is

Attribute-driven product tours built on [driver.js](https://driverjs.com/) (MIT, ~5kb,
pinned to `1.8.0` on jsDelivr). **Tour steps are authored entirely in the Webflow Designer**
— copy or step changes never need a code release.

On load the module scans the page for `data-tour-step` elements, groups them into tours, and
auto-starts **at most one** per page load: the first tour in DOM order whose role
restriction matches the member and that the member has not already seen. It waits for
`window.load` plus a one-second layout-settle delay, then confirms the first step still
exists, so a page whose hydration removes the tour markup skips the tour instead of erroring.

The module is **presentation-only**. It never gates access; the role check reuses the plan-ID
map from [`route-guard.js`](./route-guard.md) purely to pick an audience. On guarded pages it
waits for the `starters:v3-route-guard-allowed` signal, so a redirecting page never flashes a
tour.

## Install

Page Settings → Custom Code → Head Code, on each page that has a tour:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/onboarding-tour.js"></script>
```

Prefer the env-switch [loader](../utils/loader.md) where the page already uses it. **Do not
install sitewide** — the script is cheap, but tours are page-scoped.

Current scope: `/starter-dashboard` (a 5-step Talent tour) and `/brand-dashboard` (a 6-step
`brand-paid` tour).

driver.js needs no separate embed: the module injects the pinned JS and CSS from jsDelivr
only when a tour is about to run, and nothing loads on a page with no eligible tour.

## Step attributes

Set on the element that defines each step. By default that element is also the highlighted
one; `data-tour-target` overrides the highlight.

| Attribute | Required | Example | Meaning |
| --- | --- | --- | --- |
| `data-tour-step` | yes | `starter-dashboard:1` | A page-unique `<tourId>:<order>`. Order is any integer; ties with distinct values (`1` and `01`) keep Designer order. Duplicate values are ignored. |
| `data-tour-title` | no | `Your dashboard` | Popover title |
| `data-tour-text` | no | `Track applications here.` | Popover body |
| `data-tour-side` | no | `bottom` | driver.js popover side: `top`, `right`, `bottom`, `left` |
| `data-tour-align` | no | `start` | driver.js popover align: `start`, `center`, `end` |
| `data-tour-target` | no | `.post-opportunity` or `text:Post Opportunity` | Highlight a different element. A CSS selector uses its first match. `text:<label>` prefers the smallest visible `a`, `button`, or `[role="button"]` whose trimmed text matches exactly, then the smallest visible `span`, `div`, or `p`. An invalid selector, no match, or no visible exact-text match falls back to the tagged element. |
| `data-tour-open` | no | `.navbar_profile-dropdown .w-dropdown-toggle` | CSS selector for a disclosure control to open before highlighting the target |
| `data-tour-roles` | no | `talent` | Comma list; the tour auto-starts only for these roles (`talent`, `brand-paid`, `brand-free`). Put it on any one step — lists on multiple steps are merged. |
| `data-tour-once` | no | `false` | On any step: replay the tour every visit, instead of the default show-once |
| `data-tour-start` | — | `starter-dashboard` | On a **trigger** element (e.g. a "Show me around" link): click starts that tour immediately, bypassing the settle delay, role restrictions, and seen-state. Never marks the tour seen. |

Webflow's Designer strips valueless custom attributes, so **every attribute above takes a
value**, matching the `wf-xano-element` grammar convention.

### `data-tour-open` behaviour

The module dispatches a Webflow-compatible mouse sequence, polls until the revealed target
has a stable visible layout (with a 1.2-second safety cap), refreshes the overlay once, and
restores the disclosure when leaving the step or ending the tour. The opener **must be
visible**; otherwise the step is omitted from the tour and from its progress count, so a
desktop-only control does not leave a broken mobile step. If every step is omitted, the tour
does not start and seen-state is unchanged.

### Highlighting an element in a shared component

A button inside a shared Webflow component cannot carry a custom attribute headlessly. The
`/brand-dashboard` finale solves this with a page-scoped carrier element whose
`data-tour-target` points into the component:

```
data-tour-target=".navbar_button:has(a[href='/opportunities-brands-view'])"
```

## Replay and reset controls

Presentation-only, so safe on staging and production alike:

| Control | Effect |
| --- | --- |
| `?tour=<tourId>` | Starts that tour after the normal settle delay, bypassing roles and seen-state. Never marks it seen. An unknown id logs a warning and does nothing. |
| `?tour=reset` | Deletes the member JSON `tours` key (preserving all other member JSON) and clears the guest localStorage key, then continues through normal auto-start. A show-once tour that starts successfully is marked seen again. |
| `Alt+Shift+T` | Replays the page's first tour in DOM order. Uses the physical `T` key (`e.code`), ignores repeats, and is ignored while focus is in an input, textarea, or contenteditable element. |
| `data-tour-start="<tourId>"` | Click trigger on any element. Never marks seen. |

Only one tour runs at a time; replay requests while a tour is on screen are ignored. An open
`.driver-popover` is the running-tour signal, so after dismissal removes it, any replay
control can start the tour again without relying on a driver.js destruction callback.

## Seen-state

Persisted per member in **Memberstack member JSON** as
`json.tours["<tourId>"] = <ISO timestamp>` — not a custom field, so no dashboard field setup
is needed. A successful write suppresses that tour for the member across devices.
Logged-out visitors on public pages fall back to `localStorage`.

- The write happens **after** driver.js starts. A failed write leaves the running tour
  unaffected, and the tour may auto-start again on a later visit.
- If the member JSON **read** fails, the tour fails **closed** (does not show) rather than
  nagging members on every hiccup.

## Typography

On the first tour start the module injects a theme once and sets
`--starters-tour-title-font` and `--starters-tour-text-font` on the document root from the
live page: the title uses the first `h1`, `h2`, or `.heading-style-h1` computed font at
weight 500, and the description uses the body's computed font. If computed styles are
unavailable it falls back to `Baskervville, Georgia, serif` and
`"Inter Variable", Tahoma, sans-serif`.

Site-level CSS can override those custom properties, or target `.driver-popover` for other
theme changes such as colours.

## Diagnostics

`window.StartersV3OnboardingTour` exposes `activePlanIds`, `memberRole`, `parseTours`,
`resolveStepElement`, `buildDriverSteps`, `autoStartTarget`, `loadDriver`, `startTour`, and
`replayRequestFromQuery`.

`startTour` returns `null` when another start is in flight, a driver popover is already open,
or responsive filtering removed every step. A started tour fires
`starters:v3-tour-started` on `window` with `{ tourId }` — the hook for PostHog capture.
Malformed or duplicate `data-tour-step` values log a `[v3-onboarding-tour]` warning and are
skipped.

## Notes & gotchas

- **Step selectors, not captured nodes**, are handed to driver.js, so each step resolves
  against the live DOM after Webflow or wf-xano hydration.
- Passing `data-tour-roles` on more than one step is fine — the lists merge. Passing it
  nowhere means the tour auto-starts for every role.
- To reset for testing, load the page with `?tour=reset`. To replay **without** changing
  seen-state, use `?tour=<tourId>`, `Alt+Shift+T`, or a `data-tour-start` trigger.
