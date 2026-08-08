---
title: "Xano Grabber"
source: v3/xano-grabber/xano-grabber.js
---

Source: `v3/xano-grabber/xano-grabber.js`

## What it is

A **live DOM mirror**: it copies a value that is already rendered in one place into any
number of other places on the same page. The onboarding preview's profile photo repeated in
the page hero; a team list mirrored into a strip further down.

The Designer owns all markup, classes, and layout. The script writes exactly two things:

- `textContent` on a non-`IMG` landing,
- `src` on an `IMG` landing, after `removeAttribute('srcset')`.

It makes **no requests**, reads no storage, and needs no wf-xano instance — it works on a
page rendered by wf-xano, Webflow CMS, Memberstack, wf-algolia, or plain HTML. When wf-xano
*is* present it also subscribes to `results` / `error` as a timing belt.

### Why a DOM mirror and not a second bind

wf-xano binds one template per wrapper, and a value can only be bound inside the wrapper
that fetched it. A hero band outside that wrapper has no instance of its own and no way to
reach the response. Adding a second wrapper means a second GET of the same endpoint and a
second render to keep in sync. Mirroring the rendered DOM value costs no request and cannot
disagree with what the member is already looking at.

## Install

One deferred tag in the page's Custom Code, Footer or Head — the script waits for
`DOMContentLoaded` either way. It is inert on any page with no `wf-xano-grab-element`
attribute, so a sitewide install is also safe.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/wf-xano@v0.28.0/wf-xano.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/xano-grabber/xano-grabber.js"></script>
```

Prefer the immutable tag over `@latest`: bumping it is then a deliberate Webflow edit, and a
future release cannot change this page's behaviour on its own.

**Pin wf-xano too.** The contract with the library is narrow but real — the hidden `template`
role, the `wf-xano-item` marker on clones, `data-wf-xano-id` on cards, the `empty` state
block, and `WfXano.push()`. A library change to any of those changes what this script reads.

**Script tag order does not matter.** The file only ever pushes into `window.WfXano`
(`window.WfXano = window.WfXano || []; WfXano.push(arm)`), which both shapes of that global
handle. Do **not** "optimise" this into an `Array.isArray` branch that calls `arm()` directly
— that was a real shipped bug in a sibling script, because wf-xano assigns
`window.WfXano = {api}` at module scope before `boot()` creates any instance.

## Attribute table

| Attribute | Goes on | Value | Meaning |
| --- | --- | --- | --- |
| `wf-xano-grab-element="source"` | any element | fixed | Marks the element to read from. On a wf-xano page this belongs on the **template's** inner element, so every rendered clone inherits it. |
| `wf-xano-grab-element="landing"` | any element | fixed | Marks an element to write into |
| `wf-xano-grab-id` | source **and** landing | a name you choose (`photo`, `headline`, `team`) | The pairing key. Required on both sides. Every landing with a matching id mirrors. |
| `wf-xano-grab-list` | a source | present, no value | List mode: this source is a **container**, and each rendered child is one item |
| `wf-xano-grab-list-container` | a landing | present, no value | Marks the landing as the list destination. Required opposite a `wf-xano-grab-list` source. |
| `wf-xano-grab-element="list-item"` | a child of a list landing | fixed | The item template. The original is hidden and one clone is appended per source item. |
| `wf-xano-grab-item` | a landing (optional) | `#2`, or a record id | Which rendered source this landing wants |

Attributes it **reads but never writes** (wf-xano's own): `wf-xano-element="template"`,
`wf-xano-element="empty"`, `wf-xano-item`, `data-wf-xano-id`.

One attribute it **writes**: `data-wf-xano-grab-clone`, on the list clones it owns. Do not
author it, and do not style off it as if it were yours.

## Core rules

- **Type is inferred from the landing tag.** `IMG` landing → image `src`. Anything else →
  the source's trimmed `textContent`. There is no `wf-xano-grab-type` override in v1.
- **It gates on real content.** An image `src` that is empty or a `data:`/`blob:` URI never
  mirrors; neither does empty text. Until a real value exists, the landing keeps its
  Designer-authored content.
- **It never reverts.** wf-xano's default render removes every card *before* the fetch
  starts, so "no source on the page" is the normal state during any refresh. Once a landing
  holds a real value, only another real value replaces it. A member with no photo simply
  never mirrors.
- **The template is excluded.** Source attributes are authored on the hidden
  `[wf-xano-element="template"]` so every clone inherits them, but the template itself is
  never filled and never removed — it keeps its authored `data:` placeholder for the page's
  whole life and precedes its clones in DOM order. A grabber that took the first match would
  mirror that placeholder forever with no error anywhere. Template descendants are never
  sources.
- **Sources are re-resolved by attribute on every pass**, never cached as node references,
  because a refresh changes their identity.
- **One body-level `MutationObserver`** is the primary trigger. There is no document-level
  "render complete" event in wf-xano, no "instance created" event, and sources and landings
  can live in different Webflow sections with no common ancestor.

### Choosing one record out of a list

Because the source attributes live on the wf-xano template, a list of 10 items renders **10
sources with the same id**. Without `wf-xano-grab-item` the first *visible* one wins, which
is right for a one-item list and useless for "mirror Alex Rivera's card into the hero".

| Value | Resolves to |
| --- | --- |
| `#1`, `#2`, … | 1-based index into the rendered sources, in DOM order. Re-evaluated every pass, so it shifts with sort and filter — the "featured = first card" pattern. |
| anything else | The rendered source whose closest `[data-wf-xano-id]` (self or ancestor) equals the value **exactly** — wf-xano's own per-card record id |

It lives on the **landing**, so two landings can mirror two different records from the same
list. When present it overrides the visible-preferred rule, so it can deliberately pull from
a hidden wrapper. No match is not a page error: the landing keeps its last real value and the
overlay reports `ITEM NOT FOUND: <value>`.

### List semantics

- **Items** are the source container's children carrying `wf-xano-item` when any child has
  it; otherwise children that carry no `wf-xano-element` attribute and are not inline-hidden.
  wf-xano's `loader` / `empty` / `error` state blocks live *inside* the container and are
  never items — without this rule "Loading team…" mirrors as a card.
- **Text slots pair by index.** The clone's leaf text elements pair with the item's leaf text
  elements in DOM order, and **slots the item does not fill are blanked**, so Designer lorem
  cannot leak to production. If the item template has exactly **one** text slot, it receives
  the item's whole trimmed text instead.
- **Images per item** follow the same gate: an item with no img, or an img still holding a
  `data:` placeholder, leaves the clone's authored placeholder in place. The clone's img is
  never hidden — layout is Designer-owned.
- **Clones are rebuilt wholesale** whenever items change. Never keep state inside a clone.
- **Clearing:** a transient clear keeps the existing clones (never-revert), but a **visible
  `wf-xano-element="empty"` block on the source container** is authoritative and clears them.

### Unsupported shapes

Reported, never silently wrong. All four also print a staging-gated console warning, once per
distinct problem.

| Shape | Result |
| --- | --- |
| `IMG` source → non-`IMG` landing (wanting the URL as text) | `MISMATCH` — unsupported in v1 |
| `wf-xano-grab-list` source → landing without `wf-xano-grab-list-container` | `ERROR`. No whole-container text fallback. |
| `wf-xano-grab-list-container` landing → non-list source | `ERROR`. Writing text there would destroy the item template. |
| List landing with no `wf-xano-grab-element="list-item"` child | `ERROR` |

## Example: the onboarding profile photo

The first real install — the photo rendered by
[`onboarding-profile-preview.js`](./starter-onboarding.md) inside the preview card, mirrored
into a second image elsewhere on the completion page. It requires no change to that module.

Source — on the img **inside** `wf-xano-element="template"`, not on a rendered card:

```html
<img class="stp-pp__photo"
     wf-xano-src="Profile_Photo|Profile_Photo_Demo"
     wf-xano-grab-element="source"
     wf-xano-grab-id="profile-photo"
     src="data:image/svg+xml;charset=utf-8,…">
```

Landing — with authored content good enough to ship as-is, since it shows until a real photo
arrives and permanently for a member who has none:

```html
<img class="hero_avatar"
     wf-xano-grab-element="landing"
     wf-xano-grab-id="profile-photo"
     src="<your authored placeholder>">
```

Checklist:

- The landing is an `<img>`. A `<div>` with a background image cannot be a landing in v1 — it
  would be a `MISMATCH`.
- Landing and source use the **same** `wf-xano-grab-id`, spelled identically.
- Any `srcset` on the landing is fine — the script strips it before writing `src`, because a
  surviving `srcset` wins in the browser.
- The landing is **not** inside a `wf-xano-element="delete"` block (wf-xano removes those at
  boot) and not inside the card template.
- Mirroring text as well? Add a second `wf-xano-grab-id` pair. Do not reuse the photo's id.

The onboarding page has one wrapper per form block, so both templates should carry the same
pair of attributes. That produces two candidate sources, and the grabber prefers the one in
the **visible** form block — which is the behaviour you want, since form-block switching is
inline `display` and both stay in the DOM.

## Debug overlay

Add **`?xano-grab`** to the URL on a staging host and a fixed panel appears in the
bottom-right corner with one row per grab-id.

| Column | Reads |
| --- | --- |
| `grab-id` | The pairing key |
| `src` | How many rendered sources were found (`NO` if none), and `(list)` for a list container |
| `land` | How many landings carry this id |
| `state` | `REAL` / `GATED` / `WAITING` / `MISMATCH` / `ITEM NOT FOUND` / `ERROR`, joined with `+` when an id's landings disagree |
| `items in/out` | List mode only: source items in, mirrored clones out |
| `data-wf-xano-id` | Each candidate's record id, in DOM order — where you read the value for `wf-xano-grab-item` |
| `notes` | `ORPHAN SOURCE`, `ORPHAN LANDING(S)`, `DUP SOURCES: N candidates`, `ITEM NOT FOUND: <value>`, `confirmed empty — cleared`, `never-revert: kept N clone(s)`, `ALL SOURCES HIDDEN` |

The header line carries the pass counters: `flush #`, `writes`, `echoes ignored` (the
script's own mutations, proving the loop guard), `source re-resolves` (how many re-renders
were survived), and `template candidates skipped`.

Gating requires **both** the URL param and a staging host (`*.webflow.io`, `localhost`,
`127.0.0.1`, `*.trycloudflare.com`). The overlay prints the page's record ids, so
`window.STARTERS_DEBUG` deliberately does **not** unlock it — it only re-enables the console
warnings.

`window.StartersV3XanoGrabber` answers the rest from the console:

```js
const G = StartersV3XanoGrabber
G.report().ids                 // the same table the overlay renders
G.flush()                      // force a pass and return the report
G.counters                     // flushes / echoes / reresolves / templateSkips / writes
G.overlayActive()              // why the overlay is not showing
G.listItems(sourceContainer)   // which children counted as items
G.itemTexts(item)              // the values, in slot order
G.isRealValue('data:image/…')  // false — this is the gate
```

## Notes & gotchas

- **Status:** built and locally verified against the unit tests and the repo's local demo,
  but not yet installed in Webflow.
- QA with `?xano-grab` on staging: the row for a healthy photo mirror must read
  `src 2 · land 1 · REAL`. `GATED` means the member has no photo (or the source is still the
  placeholder); `MISMATCH` means the landing is not an `IMG`; `WAITING` means no source was
  found at all.
- Three of the console warnings wait out a **3-second grace window** and re-check before
  printing: nothing has rendered at `DOMContentLoaded`, so warning immediately would flag
  every healthy page.
- The module contains no URL at all and makes no request, so the standard pre-tag secret scan
  is trivially clean for it.
