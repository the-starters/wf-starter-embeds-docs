---
title: "Hide Empty Sections"
source: utils/section-custom-toc/hide-empty-sections.js
---

Source: `utils/section-custom-toc/hide-empty-sections.js`

## What it is

Keyed hiding for sections that have nothing in them, and for every element that points at
them. Mark a section with a key, mark its nav link, tab button, or anchor chip with the same
key, and while the section is empty (or hidden by something else) both disappear. Content
landing later — a CMS render, a fetch, Webflow conditional visibility flipping — brings both
back on its own.

```html
<script defer src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/utils/section-custom-toc/hide-empty-sections.js"></script>
```

It ships beside the [Section Custom TOC](./index.md) because that is where it earns its keep: a
TOC link for an empty REVIEWS panel is worse than no link at all. Nothing couples the two
scripts, though, and either works without the other.

## Markup contract

Two attribute families, paired by a key:

```html
<!-- the section: marked, with an explicit emptiness test -->
<section data-hide-when-empty-section="reviews" data-empty-watch=".review-card">…</section>

<!-- everything that must disappear with it — as many elements as you like -->
<a data-hide-when-empty-element="link" data-hide-when-empty-id="reviews" href="#reviews">Reviews</a>
```

While no visible `.review-card` exists inside the section, the link hides **and** the section
hides itself. The self-hide is implicit in marking the section; there is no separate opt-in.

## API

| Attribute | On | Values | Purpose |
| --- | --- | --- | --- |
| `data-hide-when-empty-section` | the section | a key | Marks the section as participating, and makes it self-hide when empty. |
| `data-hide-when-empty-id` | any element | the same key | Makes the element follow that section. **This alone decides participation.** |
| `data-hide-when-empty-element` | the same element | any value, e.g. `link` | A human-readable role tag. Never read — an element carrying only `-id` still participates. |
| `data-empty-watch` | the section | a CSS selector | **Recommended.** Overrides the emptiness test: empty iff the section has zero *visible* matches for the selector. |
| `data-empty-container` | a wrapper inside the section | present | Marks a content container whose direct children are the items. `[data-highlights]` counts too. |
| `data-empty-ignore` | any child | present | Never counts as content. |

Written by JS: `data-starters-section-hidden` on a hidden section and
`data-starters-element-hidden` on a hidden element. Each holds the inline `display` the script
replaced, so its presence means "this script hid it" and un-hiding restores exactly the previous
value.

Several elements may share one key — a desktop nav link and its mobile twin both follow the same
section. If several sections carry the same key, the **first in document order wins** and the
rest are ignored entirely, including their self-hide.

## How "empty" is decided

First rule that applies wins:

1. **`data-empty-watch` is present** → empty iff zero visible, non-template matches of that
   selector inside the section. The explicit override, and the intended way to define what
   counts as a review, a highlight, or a service item.
2. **The section contains content containers** (`[data-empty-container]` or `[data-highlights]`)
   → empty iff none of them has a meaningful direct child. Meaningful = a visible element child
   that isn't a template or control (`.js-template`, `[data-btn-view-all]`, `[data-empty-ignore]`,
   `.w-dyn-empty`, `.w-condition-invisible`).
3. **The section contains a Webflow Collection List** (`.w-dyn-list`) → one visible, non-template
   item settles it as **not** empty. Zero items settles nothing and falls through to rule 4,
   because the section may still carry real prose beside the list.
4. **Otherwise the section is its own content container** → empty when it has no visible,
   non-template direct children with substance (text, an `img`/`svg`/`video`/`iframe`/form
   control, or a background image), or when it has such children but no visible text and no
   media anywhere.

**Known limit of rules 3 + 4:** a section built as "heading + separately-filled list" is *not*
detected as empty by default — the zero-item list decides nothing and the heading text counts as
substance. That is deliberate, and it is exactly what `data-empty-watch` is for. Put it on such
sections; REVIEWS is the expected case.

## Notes & gotchas

- **The bias is always toward staying visible.** Any error, any ambiguous or misconfigured
  attribute, leaves the element on screen. Hiding a button for a section that actually has
  content is a much worse failure than leaving one visible.
- **A key with no marked section stays visible and warns**, once per key per page load. A missing
  key is almost always a forgotten section attribute, not an instruction to hide.
- **Don't mark a section whose inline `display` another script already owns.** The self-hide
  writes `style.display`, and two owners of one inline property fight. Leave such a section
  unmarked *and* leave its nav element untagged.
- **Re-evaluation is automatic.** One debounced (200ms) `MutationObserver` watches `childList` +
  `subtree` only — never attributes — so the script's own writes can't retrigger it and the loop
  provably converges. It is never disconnected, because profile content can land very late, and
  `load` fires one extra pass for content that arrives with late assets.
- **Only `style.display` is written, and only when the value actually changes.** Un-hiding gives
  back the exact inline value that was replaced, and only if the property still holds this
  script's `none`; if another script changed it meanwhile, that script wins.
- **`display: contents` wrappers are handled.** Webflow's `display-contents` class sits on
  `.w-dyn-list` / `.w-dyn-items` / `.w-dyn-item` site-wide; such an element generates no box of
  its own, so it counts as visible whenever anything inside it renders — otherwise every
  Collection List would read as empty.
- **Keys resolve against `data-hide-when-empty-section` only**, never against element ids or link
  hrefs, so an unmarked section is invisible to this script even though it exists in the DOM.
- **Console silence by design**, with exactly two exceptions: a page with no
  `data-hide-when-empty-id` elements warns once that the script is idle, and an unmatched key
  warns once. Unlike the rest of the group these warnings are not staging-gated.
- `window.__startersEmptyNavRefresh()` forces a debounced re-evaluation if another script wants
  to poke it after rendering. Run-once guard: `window.__startersEmptyNavInit`.
