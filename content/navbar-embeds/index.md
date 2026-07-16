---
title: "Intro"
source: navbar-embeds
---

Source: `navbar-embeds/`

The custom code behind the site's **navbar v2 component**: Memberstack-gated link lists, the
Explore mega-menu, mobile dropdown transitions, the transparent navbar variants, and the mobile
menu scroll lock. The `navbar-embeds/` folder in the repo is the source of truth for all of it
(added in **v1.25.0**); the code itself runs from the Webflow site's navbar embeds and page
custom code.

Everything here is standalone in the same way as the [Explore Search](../explore-search/index.md)
group: each file bails out quietly when its markup is absent, none of them share globals, and you
only load what a page needs. The JS files are raw JavaScript with no `<script>` wrapper.

## What's in this group

| Page | Files | Purpose |
| --- | --- | --- |
| [Memberstack Gating](./memberstack-gating.md) | `memberstack/free-paid-anon.js`, `navlinks.css` | Shows or hides nav links by membership state (anonymous, free, paid) with an anti-flicker reveal. |
| [MS Code Field Link](./ms-code-field-link.md) | `memberstack/ms-code-field-link.js` | Turns `[ms-code-field-link]` elements into external links read from a Memberstack custom field. |
| [Explore Menu](./explore-menu.md) | `navbar-explore/` (2 JS, 2 CSS, `view-all.js`) | The three-level Explore mega-menu: desktop flyout columns and the mobile full-screen stacked version. |
| [Dropdown Transitions](./dropdown-transitions.md) | `navbar-dropdown.css`, `account-dropdown.css` | Animated open/close height transitions for the mobile navbar and profile dropdowns. |
| [Transparent Nav](./transparent-nav.md) | `transparent-nav-bg.js`, `transparent-nav-bg.css` | Fades in the navbar background on scroll for the transparent variants. |
| [Nav Menu](./nav-menu.md) | `nav-menu.js` | Locks body scroll while the mobile menu is open. |

## Designer previews

Several of these files carry `.wf-design-mode` rules so gated or JS-driven elements stay
visible and styleable inside the Webflow Designer, where none of the JS runs. `navlinks.css`
goes further: setting `data-preview-nav="common|free|freelancer|brand"` on a wrapper previews
one gating variant at a time on the canvas.
