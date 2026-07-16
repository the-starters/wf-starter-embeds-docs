---
title: "Explore Menu"
source: navbar-embeds/navbar-explore
---

Source: `navbar-embeds/navbar-explore/` (2 JS + 2 CSS + `view-all.js`)

## What it is

The navbar's **Explore mega-menu**: a three-level category tree (L1 categories, L2
subcategories, L3 freelancer lists) whose rows are rendered by the WF-Algolia integration.
Desktop and mobile are two separate scripts that split cleanly at the 991/992px breakpoint;
each one bails out of every handler on the other side of the line, so both can load on every
page.

```
navbar-explore/navbar-explore.js          desktop (>= 992px): flyout columns
navbar-explore/navbar-explore-mobile.js   mobile (<= 991px): stacked columns + back button
navbar-explore/explore-menu.css           base styles, chevron rotation, Designer preview
navbar-explore/explore-menu-mobile.css    mobile full-screen layout (--explore-mtop offset)
navbar-explore/view-all.js                "View all" buttons -> /subcategories/<slug>
```

## Markup contract

Both scripts key off the same `data-block` hooks:

```html
<div data-block="explore-field">Explore</div>       <!-- the navbar toggle -->
<div data-block="explore-list">                      <!-- the panel -->
  <div class="explore_list">
    <div data-block="explore-item">                  <!-- L1 row -->
      <div data-block="explore-sub-list">            <!-- L2 column (.explore_sub_list) -->
        <div data-block="explore-sub-item" class="explore_sub_item" wf-algolia-value="…">
          <div data-block="explore-freelancers" class="explore_fr">…</div>  <!-- L3 column -->
          <a data-navbar-explore="view-all-button">View all</a>
        </div>
      </div>
    </div>
  </div>
</div>
```

## Desktop (`navbar-explore.js`)

Clicking the toggle opens the panel; clicking an L1 row opens its L2 column as a **fixed
flyout** positioned beside the panel, aligned to the trigger row and clamped to the viewport.
L2 rows open their L3 column the same way, anchored to the L2 column. Opening a column closes
its siblings (and all deeper levels), and when a sibling was still fading out, the incoming
column waits one animation cycle (`.is-switching`) so the two don't overlap. Open flyouts are
repositioned on resize, and clicking outside the toggle and panel closes everything and resets
the open columns and `.is-active` highlights.

Two implementation constraints worth knowing before restyling:

- The open/close slide animates `margin-top`, **not** `transform`: a transform on the L2
  column would become the containing block for the nested `position: fixed` L3 column and
  clip it.
- There is **one delegated click listener** on the panel instead of per-row bindings, because
  WF-Algolia clones rows; duplicate handlers on a cloned row would cancel each other out and
  close a column on the same click that opened it. The handler resolves the deepest level
  first, so an L3 click doesn't also run L1 logic.

## Mobile (`navbar-explore-mobile.js` + `explore-menu-mobile.css`)

At 991px and below the panel becomes full-screen (pinned below the navbar by the fixed
`--explore-mtop` offset: `5.5rem`, `4.8125rem` on phone portrait) and columns **stack** instead
of flying out: tapping a row pushes its column onto a stack (`.is-open-m`), and a fixed back
button, cloned from the design's `.explore_back-button` arrow, pops the top column. Each host
row is lifted with a temporary `z-index` while its column is open. Link taps are left alone so
navigation still works, and resizing back up to desktop while open resets everything and hands
control to the desktop script.

## View all (`view-all.js`)

A capture-phase click handler on `[data-navbar-explore="view-all-button"]` reads the closest
`.explore_sub_item`'s `wf-algolia-value` (a `Parent > Child` facet path), takes the leaf,
slugifies it (`&` becomes `and`, non-alphanumerics collapse to `-`), and navigates to
`/subcategories/<slug>`.

## Notes & gotchas

- The Designer never runs JS, so `explore-menu.css` includes canvas-only rules: setting
  `data-show-menu="true"` forces the panel and columns visible, floating each column beside
  its parent row so all three levels can be styled.
- The desktop script syncs a `--explore-top` CSS variable to the panel's viewport position on
  open and resize; the CSS uses it to size the columns' max height.
- The toggle chevron rotation is CSS (`.explore_toggle.is-active .explore_toggle_icon`); JS
  only toggles the class.
