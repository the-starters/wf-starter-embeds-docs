---
title: "Tabs"
---

Source: Webflow — `Global Embeds / Tabs`

## What it is

Attribute-driven tabs for Webflow — panels, tab links, optional prev/next controls, autoplay,
and per-step form validation for multi-step forms. The script inits every
`[data-tab-component="wrapper"]` on the page on `DOMContentLoaded` (idempotent — a wrapper is
tagged `data-tab-component-inited` and skipped on re-run), wires full ARIA tabs semantics
(`tablist` / `tab` / `tabpanel`, `aria-selected`, `aria-controls`, roving tabindex, arrow-key
navigation), and switches panels with a GSAP fade — or a horizontal slide — when GSAP is on the
page, falling back to instant show/hide when it is not.

Both slots are CMS-aware: `.u-display-contents` / `.display-contents` helpers are flattened and a
nested Webflow Collection List is unwrapped on init, so CMS items behave as plain tab buttons and
panels. The companion CSS handles the pre-init state (only the first panel visible before JS runs)
plus Designer preview rules and disabled-control cursors.

## Markup contract

```html
<div data-tab-component="wrapper"
     data-tab-nav="global"
     data-tab-component-id="pricing">

  <div data-tab-component="button-list">
    <!-- direct children are the tab buttons (static or a Collection List) -->
    <a href="#" data-tab-item-id="monthly">Monthly</a>
    <a href="#" data-tab-item-id="yearly">Yearly</a>
  </div>

  <div data-tab-component="panel-list" data-preview="False">
    <!-- direct children are the tab panels, same order/count as the buttons -->
    <div>…panel 1… <!-- with data-tab-nav="panel": put a nav (or bare prev/next) in here --></div>
    <div>…panel 2…</div>
  </div>

  <!-- data-tab-nav="global": one shared nav outside the panels -->
  <div data-tab-component="nav">
    <div data-tab="previous" data-button-theme="black"><button>Previous</button></div>
    <div data-tab="next" data-button-theme="black"><button>Next</button></div>
  </div>

  <!-- optional autoplay play/pause toggle -->
  <div data-tab-button="toggle"><button>Pause</button></div>
</div>
```

Requirements and behavior of the slots:

- `button-list` and `panel-list` are both required, and each needs at least one child after CMS
  unwrapping — otherwise the wrapper is skipped with a `console.warn`. A button/panel count
  mismatch also warns (but the component still inits).
- Buttons and panels are matched **by index** among direct children. A child carrying
  `data-tab-component-skip="True"` is excluded from indexing (use for decorative slot items).
- For CMS lists: the slot may contain the Collection List directly (optionally wrapped in
  display-contents helpers). On init each collection item's first visible child (skipping
  `w-condition-invisible`) is promoted into the slot and the Webflow wrappers are removed.
- Prev/next controls are **wrappers** (`data-tab="previous"` / `data-tab="prev"` /
  `data-tab="next"`) containing a real `button` — the Webflow button component shape. With
  `data-tab-nav="panel"` the script looks for a `data-tab-component="nav"` inside each panel, or
  falls back to prev/next wrappers placed directly in the panel.
- The active state is `data-tab-active="true"` plus the `is-active` class on both the button and
  the panel — style off either.

## API

Options — all sit on the `[data-tab-component="wrapper"]` element. Boolean attributes are
Webflow-style: the value `True` (any casing) turns them on.

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-tab-nav` | `global` · `panel` | auto | Where prev/next live: one shared nav, or per-panel navs. If omitted, auto-detected: per-panel navs win, then a global nav, else `panel`. |
| `data-loop-controls` | `True` | off | Prev/next wrap around instead of disabling at the first/last tab. |
| `data-tab-lock-links` | `True` | off | Tab links ahead of the furthest step reached via Next stay disabled; going back is always allowed. |
| `data-validate-tabs` | `True` | off | The active panel's Next stays disabled until every `required` field in it passes (see validation notes below). |
| `data-slide-tabs` | `True` | off (fade) | Horizontal slide transition (direction-aware) instead of the crossfade. |
| `data-duration` | number (s) | `0.3` | Duration of the fade/slide transition. |
| `data-autoplay-duration` | number (s) | `0` (off) | Auto-advance to the next tab every N seconds. Requires GSAP; animates a `--progress` CSS variable on the wrapper from 0 to 1 per cycle (usable for progress bars). |
| `data-pause-on-hover` | `True` | off | Autoplay pauses while the pointer is over the wrapper. |
| `data-tab-component-id` | string | index (1-based) | Stable id base for generated element ids and `?tab-id=` deep links. Lowercased, spaces become dashes. |

| Hook | On | Purpose |
| --- | --- | --- |
| `data-tab-component="wrapper"` | root | One tabs instance; holds all options. |
| `data-tab-component="button-list"` | slot | Direct parent of tab buttons; becomes `role="tablist"`. Scrolls the active tab into view when it overflows. |
| `data-tab-component="panel-list"` | slot | Direct parent of tab panels. `data-preview="False"` makes the CSS hide all but the first panel before JS runs. |
| `data-tab-component="nav"` | nav root | Container the script searches for prev/next wrappers (global, or one per panel). |
| `data-tab="previous"` / `data-tab="prev"` | wrapper | Previous control; must contain a `button`. |
| `data-tab="next"` | wrapper | Next control; must contain a `button`. Stepping forward via Next is what unlocks locked tab links. |
| `data-tab-button="toggle"` | wrapper | Autoplay play/pause toggle; must contain a `button`. Carries `is-pressed` and `aria-pressed="true"` while autoplay is on; both are cleared when paused via the toggle. |
| `data-tab-item-id` | tab button | Stable per-tab id used in generated ids and deep links (defaults to the 1-based index). |
| `data-tab-component-skip="True"` | slot child | Excludes a direct child of either list from tab indexing. |
| `data-validate-ignore` | field or group | Exempts a field (or everything inside a wrapper) from `data-validate-tabs` validation. |

State the script writes (style off these; do not set them yourself):

| Attribute / class | On | Meaning |
| --- | --- | --- |
| `data-tab-active` + `is-active` | button and panel | `true` on the active pair. |
| `data-button-theme="disabled"` + `data-tab-nav-disabled="true"` | prev/next wrapper | Control is disabled; the original theme is stashed and restored on re-enable (fallback theme `black`). The inner button also gets `disabled` and `aria-disabled`. |
| `data-tab-link-disabled="true"` | tab button | Locked link (`data-tab-lock-links`); CSS sets `pointer-events: none`. |
| `data-tab-field-invalid="true"` | input | Failed validation — appears after the field was touched (input/change/blur) or when a disabled Next is clicked. Hook your error styling to it. |
| `--progress` | wrapper | Autoplay cycle progress, 0 to 1. |

Deep linking: visiting the page with `?tab-id=<component-id>-<item-id>` activates that tab
without animation, disables autoplay, scrolls the wrapper into view, and removes the query param
from the URL. With `data-tab-lock-links` the deep-linked step counts as reached.

For custom code, each initialized wrapper exposes a controller at `wrapper._tabController` with
`makeActive(index, focus, animate)`, `updateNavState(index)`, `updateTabLinkStates(index)`,
`getActiveIndex()`, `getFurthestReachedIndex()`, and `unlockTabLinksUpTo(index)`.

## File structure

```
Tabs
├── Tabs - CSS
└── Tabs - JS
```

The CSS is what prevents the flash of all panels before the JS runs. GSAP is optional — load
it before the JS for the fade/slide transitions or autoplay; without it panels switch
instantly. ScrollTrigger, if present, is refreshed after each transition.

## Notes & gotchas

- **Accessibility** is wired for you: `role="tablist"` / `tab` / `tabpanel`, `aria-selected`,
  `aria-controls` / `aria-labelledby` with generated ids, roving `tabindex`, and Arrow
  Left/Up/Right/Down moving (and focusing) between tabs. Locked links get `aria-disabled="true"`
  and are removed from the tab order.
- **Autoplay respects context**: it pauses on `prefers-reduced-motion`, while the wrapper is out
  of the viewport (IntersectionObserver), while focus is inside the wrapper, on hover (only with
  `data-pause-on-hover`), and via the toggle button. Manually switching tabs while autoplay runs
  restarts the cycle. The panel fade/slide itself, however, always runs regardless of reduced
  motion — only autoplay is gated.
- **Validation scope** (`data-validate-tabs`): fields count as required via native `required` or
  `aria-required="true"`. Hidden fields (`display:none`, `visibility:hidden`, `[hidden]`, Webflow
  conditional visibility — checked up to the panel root) and disabled fields are skipped. Radio
  groups pass when any radio in the group is checked; checkboxes and radios also honor Webflow's
  visual `w--redirected-checked` state, watched via a MutationObserver. Optional inputs the user
  has started filling must also pass native format rules (`type`, `pattern`, `min`/`max`, etc. via
  `checkValidity`). Invalid styling (`data-tab-field-invalid`) currently applies to `input`
  elements only — selects and textareas gate the Next button but never get the attribute.
- **Error UI is polite**: invalid styling only appears after a field has been interacted with, or
  for the whole panel at once when the user clicks a Next that is disabled by validation.
- **First tab is always the starting point** — there is no "default tab" option; use the
  `?tab-id=` deep link to land on another tab.
- **Pre-init flash**: put `data-preview="False"` on the `panel-list` so the CSS shows only the
  first panel before the JS runs (and hides the rest). Without the CSS in the head you may see all
  panels stacked for a moment. In the Webflow Designer (`.wf-design-mode`) the CSS keeps the first
  panel/button visible for editing.
- **Order matters, ids don't**: pairing is purely positional among direct children of the two
  lists. Keep buttons and panels in the same order and count; a mismatch logs a `console.warn`.
- **Disabled controls still render**: prev/next are disabled by swapping `data-button-theme` to
  `disabled` and flagging `data-tab-nav-disabled` (CSS shows `cursor: not-allowed`); clicks on
  them are ignored in JS. With `data-tab-nav="panel"`, only the active panel's controls are ever
  enabled.
- Idempotent per wrapper, and multiple tab components on one page are independent. Give each a
  distinct `data-tab-component-id` if you rely on deep links, since the default id is just the
  init order index.
