---
title: "Nav Menu"
source: navbar-embeds/nav-menu.js
---

Source: `navbar-embeds/nav-menu.js`

## What it is

A body scroll lock for the mobile menu. Clicking `#menu-btn` toggles `document.body`'s
`overflow` between `hidden` and `auto`, so the page behind the open menu stops scrolling.

It registers through the Webflow ready-queue (`window.Webflow.push(...)`) and bails out when
`#menu-btn` isn't on the page.

## Markup contract

```html
<a id="menu-btn" href="#">Menu</a>
```

## Notes & gotchas

- The toggle reads the body's **computed** overflow, so it stays in sync even if some other
  code has already locked the page.
- Closing the menu by any path that doesn't click `#menu-btn` (for example, tapping a link)
  leaves the lock in place until the next navigation; wire menu links to close via the button
  if that matters on a page.
