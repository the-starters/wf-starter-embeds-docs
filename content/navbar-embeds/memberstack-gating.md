---
title: "Memberstack Gating"
source: navbar-embeds/memberstack/free-paid-anon.js
---

Source: `navbar-embeds/memberstack/free-paid-anon.js` + `navbar-embeds/navlinks.css`

## What it is

Shows or hides navbar elements by the visitor's membership state: anonymous, free member, or
paying member. It runs two independent gates and re-applies them on login, logout, and
back/forward-cache restores, so the nav is always correct without a page refresh.

| Gate | Shown to | Hidden from |
| --- | --- | --- |
| `data-gate="free-anon"` | anonymous visitors and free members | paying members |
| `data-hide-if-both` | logged-in members who do **not** own both a free and a paid plan | anonymous visitors, and members who own both plans |

A plan connection counts as **paid** when its Memberstack type is anything other than `"FREE"`.
The `PAID_PLAN_IDS` list at the top of the file is only a fallback for connections that are
missing a type; `FREE_PLAN_IDS` lists the known free plan IDs (current and legacy).

## Anti-flicker reveal (`.ms-nav-ready`)

The navbar's own CSS embed hides `.navbar_link-list` until this script adds `.ms-nav-ready` to
`<html>`:

```css
html:not(.ms-nav-ready) .navbar_link-list { display: none !important; }
```

The class is only added after a real gate pass (or after the logged-out fallback runs), so
gated links never flash in their wrong state while membership resolves. Two safety nets keep
the nav from staying hidden: if Memberstack's member lookup hangs, a 3-second timer applies
the logged-out state and reveals; if Memberstack never appears at all, a 2-second poll gives
up the same way.

## File structure

```
navbar-embeds/memberstack/free-paid-anon.js   (the gating script)
navbar-embeds/navlinks.css                    (Designer previews + reveal styles)
```

Load the script in the page or project footer, **after** the Memberstack script. Run-once
guard: a second load just re-syncs (`window.__starterNavbarGateInited`).

## Markup contract

```html
<!-- hidden from paying members -->
<a href="/pricing" data-gate="free-anon">Upgrade</a>

<!-- hidden from anonymous visitors and from members owning BOTH plans -->
<a href="/account" data-hide-if-both>Manage plan</a>
```

Both hooks toggle `style.display` directly (`"none"` or cleared), so the elements keep
whatever display their Webflow classes give them when shown.

## Re-sync triggers

- `onAuthChange` fires on login/logout (the member object is passed directly; `null` on
  logout).
- A delegated click listener on `[data-ms-action='logout']` applies the logged-out state the
  instant a logout control is clicked, ahead of Memberstack's own event. It covers logout
  controls added after init.
- A `pageshow` handler re-syncs after a back/forward-cache restore, because bfcache brings
  back the old DOM with stale inline display values.

## Designer preview (`navlinks.css`)

The Designer never runs JS, so `navlinks.css` hides `.navbar_link-list` on the canvas and lets
you preview one variant at a time: set `data-preview-nav` to `common`, `free`, `freelancer`,
or `brand` on the wrapper, and the matching link list plus its `data-ms-content` elements are
forced visible.

## Notes & gotchas

- **v1.27.4** (`ms-code-field-link.js`, same folder) is documented on its
  [own page](./ms-code-field-link.md).
- The gates are computed once per pass and both applied together, so a member who owns both a
  free and a paid plan is treated consistently by both gates.
- Update `FREE_PLAN_IDS` / `PAID_PLAN_IDS` when plans are added in Memberstack; the type check
  handles most cases, but a typeless connection falls back to those lists.
