---
title: "MS Code Field Link"
source: navbar-embeds/memberstack/ms-code-field-link.js
---

Source: `navbar-embeds/memberstack/ms-code-field-link.js`

## What it is

Turns `[ms-code-field-link]` elements into external links whose URL comes from a Memberstack
member custom field. The attribute value names the field; the script reads the logged-in
member from the `_ms-mem` localStorage entry, validates the field value as a URL (prepending
`https://` when the protocol is missing), and sets `href`, `target="_blank"`, and
`rel="noopener noreferrer"`. An empty or invalid field value hides the element instead.

## Markup contract

```html
<!-- href comes from the member's "portfolio-url" custom field -->
<a href="#" ms-code-field-link="portfolio-url">Portfolio</a>
```

## Fallback links only (v1.27.4)

The script only rewrites links that don't already point somewhere real: an element whose
`href` is set and isn't `#` is left alone. Before **v1.27.4** it rewrote every
`[ms-code-field-link]` element, which broke static links: the v3 navbar's Dashboard link
(`/brand-dashboard`) was being rewritten to a stale member-field URL, or hidden outright when
the field was empty. Author the placeholder `href="#"` (or no href) when you want the
member-field behavior, and a real path when you don't.

## Notes & gotchas

- Logged-out visitors (no `_ms-mem` id in localStorage) are ignored entirely; static hrefs
  keep working, and placeholder links keep their `#`.
- The field value is validated with `new URL()`; anything that doesn't parse hides the
  element, so a malformed value can't produce a broken link.
- Runs once on `DOMContentLoaded`; it doesn't re-run on login or logout. The nav reflects the
  field on the next page load.
