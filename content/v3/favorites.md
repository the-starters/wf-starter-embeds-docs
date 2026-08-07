---
title: "Favorites"
source: v3/all-starters-favorites.js
sources:
  - v3/all-starters-favorites.js
  - v3/saved-starters-roles.js
---

Source: `v3/all-starters-favorites.js`, `v3/saved-starters-roles.js`

## What it is

Two page-glue modules for `/all-starters`. The first turns the Algolia browse cards into
favouritable Starter cards for paid Brands; the second fixes how roles render in the saved
list those favourites feed.

Neither creates UI. The Designer owns every control, grid, and empty state, and wf-xano
v0.18+ ships the actual favourites toggle/hydration engine (endpoints live in Xano
`api:opp30 brand/favorites/*`).

Install both in `/all-starters` Page Settings → Custom Code → Footer:

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/all-starters-favorites.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/v3/saved-starters-roles.js"></script>
```

Site-level Head Code must already load Memberstack, the shared `window.memberReady` helper
(or `$memberstackDom`), wf-xano v0.18 or newer, and wf-algolia, and must own the Xano
base/auth configuration. The favorites module preserves an existing
`window.WfXanoConfig.favoritesSource` and otherwise defaults it to `opp30:brand/favorites`;
it waits up to about ten seconds for `window.WfXano.favorites` and `window.WfAlgolia.setFilter`
rather than injecting either library.

## `all-starters-favorites.js`

For members on a paid-Brand plan (`pln_new-paid-plan-463h04ph` or
`pln_dorxata-test-brand-plan-777r02pa`), it:

- **decorates** the favourite wrapper in every Algolia expert card inside the marked section
  with the canonical wf-xano favourite attributes, injecting a ♡ visual when a Designer
  template variant ships the wrapper empty;
- **binds** the Designer-built "Show all / Favourites" radio filter, applying it to the
  existing wf-algolia grid as an `objectID` filter — the same pattern as the
  applied-opportunities filter in `opportunities-3.0.js`. There is no second results grid;
- **keeps the filter live**: while the Favourites view is active, un-hearting a card
  re-applies the filter via the `wf-xano:favorite` event;
- **pre-warms hydration** at script-eval time (member lookup plus favourites-ids fetch), so
  favourites usually paint before the browse loader reveals the first render instead of
  popping in 1–3 seconds later on a cold load.

Each control is decorated **hidden** and is revealed by wf-xano's own paint once favourites
hydrate, so a slow or auth-failed ids fetch no longer flashes a bookmark and then hides it.

`/all-starters` itself stays outside the guard's `PAGE_ROLES` — it is a
[role-bounce page](./route-guard.md) — so this module is the entitlement check on the page,
alongside the Memberstack gate as presentation and Xano's own plan #4/#5 precondition
server-side.

### The section marker

| Attribute | On | Value | Purpose |
| --- | --- | --- | --- |
| `data-starters-list` | the favourites `.section_all-starters-body` | **presence only, no value** | Identifies the section that owns hearts. Boot, decoration, pre-warm, and positioning CSS all key off this and nothing else. |
| `data-ts-favorites-view` | a radio input **or** its Webflow radio-field wrapper | `all` (checked by default), `favorites` | The optional Show all / Favourites control. Must live **inside** the marked section. |
| `data-wf-algolia-hit-objectid` | each Algolia card | the objectID | Already emitted by wf-algolia; the module reads it to build the filter |
| `.expert-card_favorite-wrapper` | inside the card template | — | Where the favourite control is decorated |

> **This module used to key off `data-ms-content="premium-brands"`.** Renaming that
> Memberstack gate to `paid-plans` in the Designer silently killed the whole feature. As of
> v1.59.115 the marker is the dedicated, presence-only `data-starters-list` attribute, and
> the gate value on the marked section is **presentation only** and may change freely.

Any other `.section_all-starters-body` **without** the marker gets its
`.expert-card_favorite-wrapper` hard-hidden. Favourite wrappers outside those list sections
entirely — the membership modal's static Expert Card lists — are left untouched.

With no radios present, hearts still work and the view-filter path never fires. With the
radios present, a Favourites view holding zero favourites filters on an impossible
`objectID` sentinel so the grid's own Designer-owned empty state shows.

### Restoring hearts after a gate rename

1. On `/all-starters`, select the list section that should own hearts.
2. Add custom attribute **Name** `data-starters-list`, leave **Value** empty.
3. Publish the site.
4. Hard-refresh as a paid Brand and confirm a heart click fills and persists across reload.

### What it does not do

It does not create DOM UI, load wf-xano or wf-algolia, re-declare `xanoBase`/`authBase`, own
the page reveal (the page's inline `ms-loaded` snippet does that, independent of this CDN
file, so a CDN outage can never blank the page), or gate by hostname. It injects only
favourite-control positioning and state styles plus the heart glyph fallback, and exposes no
public JavaScript API.

## `saved-starters-roles.js`

Xano returns a Starter's roles as **one delimited string**, but the Designer card wants one
styled `<p>` per role, matching the Algolia browse cards. This module splits the bound value
and emits a chip per role in the wf-xano `saved-starters` list.

| Attribute | On | Purpose |
| --- | --- | --- |
| `wf-xano-bind="<roles column>"` **and** `data-ts-roles` | the roles `<p>` in the saved-list card template | The value source. Nothing else on the page may use `data-ts-roles`. |
| `data-ts-roles-chip` | written by the module | Marks each emitted chip |

Chips are emitted as **siblings** of that `<p>`, cloned from it so they inherit its Webflow
classes.

### Why it is non-destructive

The sibling
[`algolia-result-modifiers/roles.js`](../algolia-result-modifiers/roles.md) replaces the
bound `<p>` with its clones, which is safe there because wf-algolia always re-renders cards
from scratch. **wf-xano does not**: a wrapper marked `wf-xano-reconcile="keyed"` reuses the
existing card node and re-binds its fields in place. If the bound `<p>` has been replaced by
chips, that re-bind has nothing to write to, and a reused card keeps the previous Starter's
roles forever.

So instead: the bound `<p>` stays in the DOM, hidden, as the value source; the chips are
owned by this script and rebuilt from scratch each pass; and chips get `wf-xano-bind` (and
the other bind attributes) **stripped**, so wf-xano can never bind into one. That is correct
in replace mode too — the whole card is removed there, chips included — so it needs no mode
detection.

Renders trigger off the instance's own `on('results')` event, which also replays the last
result to a late subscriber, so first paint, pagination, and the
`wf-xano-refresh-on="favorite"` re-render are all covered without a `MutationObserver`. Cards
are matched inside `[wf-xano-item]` only, which excludes the still-hidden template —
injecting chips into the template would clone them into every card.

## Notes & gotchas

- **De-hyphenation is scoped to the roles element only.** The saved card also renders
  `availability: "11-20"`, and de-hyphenating that would print "11 20". Never widen that
  selector.
- Slugs listed in `ROLE_NAMES` are emitted in final display case ("cro-expert" → "CRO
  Expert") rather than de-hyphenated, because a plain de-hyphenate under
  `text-transform: capitalize` renders "Cro Expert". That map is shared verbatim with three
  sibling scripts and must stay in sync with all of them.
- The paid-Brand plan IDs here must stay aligned with `PLAN_ROLES` in
  [`route-guard.js`](./route-guard.md) and `MS_PLAN_ROLES` in `opportunities-3.0.js`;
  `v3/ACCESS-MATRIX.md` is the source of truth.
- The favorites module is production-enabled and has **no hostname or reveal-class kill
  switch**.
