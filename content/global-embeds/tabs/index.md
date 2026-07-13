---
title: "Tabs"
source: global-embeds/tabs
---

Source: Webflow, `Global Embeds / Tabs`

## What it is

Attribute-driven tabs for Webflow: a list of tab buttons switches a matching list of panels, with optional prev/next controls, autoplay, and per-step validation for multi-step forms. You style everything with Webflow classes; the script only reads `data-*` hooks. It inits every `[data-tab-component="wrapper"]` on `DOMContentLoaded` and is idempotent, so a wrapper it has already handled is marked `data-tab-component-inited` and skipped on re-run.

## File structure

```
Tabs
├── Tabs - CSS
└── Tabs - JS
```

The CSS prevents the flash of all panels before the JS runs (see [Notes](#notes--gotchas)). GSAP is optional. Load it before the JS to get the fade/slide transition and autoplay; without it, panels switch instantly. ScrollTrigger, if present, is refreshed after each transition.

## Complete markup

One complete example with every structural hook in place. Copy it, then delete the parts you do not need.

```html
<!-- REQUIRED: wrapper holds all options. Options shown here are OPTIONAL. -->
<div data-tab-component="wrapper"
     data-tab-component-id="pricing"
     data-tab-nav="global"
     data-autoplay-duration="6"
     data-pause-on-hover="True">

  <!-- OPTIONAL: text element that mirrors the active panel's data-tab-panel-title -->
  <p data-tab-element="title">Monthly billing</p>

  <!-- REQUIRED: direct children are the tab buttons (static, or a Collection List) -->
  <div data-tab-component="button-list">
    <a href="#" data-tab-item-id="monthly">Monthly</a>   <!-- data-tab-item-id OPTIONAL -->
    <a href="#" data-tab-item-id="yearly">Yearly</a>
  </div>

  <!-- REQUIRED: direct children are the panels, same order and count as the buttons -->
  <!-- data-preview="False" hides all but the first panel before JS runs -->
  <div data-tab-component="panel-list" data-preview="False">
    <!-- data-tab-panel-title is OPTIONAL: its value is pushed into the title element above -->
    <div data-tab-panel-title="Monthly billing">…panel 1…</div>   <!-- panels take NO target attribute: panel 1 pairs with button 1 by position -->
    <div data-tab-panel-title="Yearly billing">…panel 2…</div>

    <!-- OPTIONAL: for per-panel navs, set data-tab-nav="panel" on the wrapper and put a
         nav (or bare prev/next wrappers) inside each panel instead of the global nav below -->
  </div>

  <!-- OPTIONAL: one shared nav outside the panels (used with data-tab-nav="global") -->
  <div data-tab-component="nav">
    <div data-tab="previous" data-button-theme="black"><button>Previous</button></div>
    <div data-tab="next" data-button-theme="black"><button>Next</button></div>
  </div>

  <!-- OPTIONAL: autoplay play/pause toggle (needs data-autoplay-duration + GSAP) -->
  <div data-tab-button="toggle"><button>Pause</button></div>
</div>
```

Hard requirements:

- **Both lists.** `button-list` and `panel-list` are both required, and each needs at least one child after CMS unwrapping. A wrapper missing either is skipped with a `console.warn`.
- **Index-based pairing.** Buttons and panels are matched by position among the direct children of each list, so keep them in the same order and count. A count mismatch warns but still inits. Add `data-tab-component-skip="True"` to a decorative direct child to exclude it from indexing.
- **Prev/next are wrappers.** `data-tab="previous"` (or `data-tab="prev"`) and `data-tab="next"` are wrappers that each contain a real `button`, matching the Webflow button component shape.
- **Active-state hooks.** The active button and panel both get `data-tab-active="true"` plus the `is-active` class. Style off either one; do not set them yourself.

CMS lists: either slot may hold the Collection List directly, optionally inside `.u-display-contents` / `.display-contents` helpers. On init those helpers are flattened and, for each collection item, the first visible child (skipping `w-condition-invisible`) is promoted into the slot while the Webflow wrappers are removed. The promoted element then behaves as a plain tab button or panel.

## xAttribute JSON

Applying the hooks with the **xAttribute** Webflow app (by xAtom)? Select the element in the Designer and paste the matching block, one per element of the markup above.

`wrapper` is the root element, shown with the options from the example (all options are optional; see [API](#api) for the full list):

```json
{
  "data-tab-component": "wrapper",
  "data-tab-component-id": "pricing",
  "data-tab-nav": "global",
  "data-autoplay-duration": "6",
  "data-pause-on-hover": "True"
}
```

`button-list` is the direct parent of the tab buttons:

```json
{ "data-tab-component": "button-list" }
```

`panel-list` is the direct parent of the panels:

```json
{
  "data-tab-component": "panel-list",
  "data-preview": "False"
}
```

A title element mirrors the active panel's title text (optional; put it anywhere inside the wrapper):

```json
{ "data-tab-element": "title" }
```

A panel carries the title text shown while it is active (optional; omit it to restore the title's original text):

```json
{ "data-tab-panel-title": "Monthly billing" }
```

A tab button carries its stable id (optional; defaults to the 1-based index):

```json
{ "data-tab-item-id": "monthly" }
```

`nav` is the container the script searches for prev/next wrappers:

```json
{ "data-tab-component": "nav" }
```

The previous control is a wrapper containing a `button`:

```json
{
  "data-tab": "previous",
  "data-button-theme": "black"
}
```

The next control is a wrapper containing a `button`:

```json
{
  "data-tab": "next",
  "data-button-theme": "black"
}
```

The autoplay toggle is a wrapper containing a `button`:

```json
{ "data-tab-button": "toggle" }
```

## API

Boolean options are Webflow-style: the value `True` (any casing) turns them on.

**Options you set on the wrapper.** These all sit on `[data-tab-component="wrapper"]`.

| Attribute | Values | Default | Description |
| --- | --- | --- | --- |
| `data-tab-nav` | `global` · `panel` | auto | Where prev/next live: one shared nav, or per-panel navs. If omitted, auto-detected (per-panel navs win, then a global nav, else `panel`). |
| `data-loop-controls` | `True` | off | Prev/next wrap around instead of disabling at the first/last tab. |
| `data-tab-lock-links` | `True` | off | Tab links ahead of the furthest step reached via Next stay disabled; going back is always allowed. |
| `data-validate-tabs` | `True` | off | The active panel's Next stays disabled until every `required` field in it passes (see validation notes below). |
| `data-slide-tabs` | `True` | off (fade) | Horizontal slide transition (direction-aware) instead of the crossfade. |
| `data-duration` | number (s) | `0.3` | Duration of the fade/slide transition. |
| `data-autoplay-duration` | number (s) | `0` (off) | Auto-advance to the next tab every N seconds. Requires GSAP; animates a `--progress` CSS variable on the wrapper from 0 to 1 per cycle (usable for progress bars). |
| `data-pause-on-hover` | `True` | off | Autoplay pauses while the pointer is over the wrapper. |
| `data-tab-component-id` | string | index (1-based) | Stable id base for generated element ids and `?tab-id=` deep links. Lowercased, spaces become dashes. |

**Hooks you place on elements.** These mark structural roles in the markup.

| Hook | On | Purpose |
| --- | --- | --- |
| `data-tab-component="wrapper"` | root | One tabs instance; holds all options. |
| `data-tab-component="button-list"` | slot | Direct parent of tab buttons; becomes `role="tablist"`. Scrolls the active tab into view when it overflows. |
| `data-tab-component="panel-list"` | slot | Direct parent of tab panels. `data-preview="False"` makes the CSS hide all but the first panel before JS runs. |
| `data-tab-component="nav"` | nav root | Container the script searches for prev/next wrappers (global, or one per panel). |
| `data-tab="previous"` / `data-tab="prev"` | wrapper | Previous control; must contain a `button`. |
| `data-tab="next"` | wrapper | Next control; must contain a `button`. Stepping forward via Next is what unlocks locked tab links. |
| `data-tab-button="toggle"` | wrapper | Autoplay play/pause toggle; must contain a `button`. Carries `is-pressed` and `aria-pressed="true"` while autoplay is on; both clear when paused via the toggle. |
| `data-tab-item-id` | tab button | Stable per-tab id used in generated ids and deep links (defaults to the 1-based index). |
| `data-tab-element="title"` | any text element inside the wrapper | Its text is replaced with the active panel's `data-tab-panel-title` on every activation. A panel without a title restores this element's original text. |
| `data-tab-panel-title` | panel | Title text pushed into the title element(s) while this panel is active. Omit it to restore the original text; an empty value sets empty text. |
| `data-tab-component-skip="True"` | slot child | Excludes a direct child of either list from tab indexing. |
| `data-validate-ignore` | field or group | Exempts a field (or everything inside a wrapper) from `data-validate-tabs` validation. |

**State the script writes.** Style off these; never set them yourself.

| Attribute / class | On | Meaning |
| --- | --- | --- |
| `data-tab-active` + `is-active` | button and panel | `true` on the active pair. |
| `data-button-theme="disabled"` + `data-tab-nav-disabled="true"` | prev/next wrapper | Control is disabled; the original theme is stashed and restored on re-enable (fallback theme `black`). The inner button also gets `disabled` and `aria-disabled`. |
| `data-tab-link-disabled="true"` | tab button | Locked link (`data-tab-lock-links`); CSS sets `pointer-events: none`. |
| `data-tab-field-invalid="true"` | input | Failed validation; appears after the field was touched (input/change/blur) or when a disabled Next is clicked. Hook your error styling to it. |
| `--progress` | wrapper | Autoplay cycle progress, 0 to 1. |

### Deep links

Visiting the page with `?tab-id=<component-id>-<item-id>` activates that tab without animation, disables autoplay, scrolls the wrapper into view, and removes the query param from the URL. With `data-tab-lock-links` the deep-linked step counts as reached.

### JS API

Each initialized wrapper exposes a controller at `wrapper._tabController` with `makeActive(index, focus, animate)`, `updateNavState(index)`, `updateTabLinkStates(index)`, `getActiveIndex()`, `getFurthestReachedIndex()`, and `unlockTabLinksUpTo(index)`.

## Notes & gotchas

- **Accessibility is wired for you.** `role="tablist"` / `tab` / `tabpanel`, `aria-selected`, `aria-controls` / `aria-labelledby` with generated ids, roving `tabindex`, and Arrow Left/Up/Right/Down to move (and focus) between tabs. Locked links get `aria-disabled="true"` and drop out of the tab order.
- **Autoplay respects context.** It pauses on `prefers-reduced-motion`, while the wrapper is out of the viewport (IntersectionObserver), while focus is inside the wrapper, on hover (only with `data-pause-on-hover`), and via the toggle button. Manually switching tabs while autoplay runs restarts the cycle. The panel fade/slide itself always runs regardless of reduced motion; only autoplay is gated.
- **Validation scope (`data-validate-tabs`).** Fields count as required via native `required` or `aria-required="true"`. Hidden fields (`display:none`, `visibility:hidden`, `[hidden]`, Webflow conditional visibility, checked up to the panel root) and disabled fields are skipped. Radio groups pass when any radio in the group is checked; checkboxes and radios also honor Webflow's visual `w--redirected-checked` state, watched via a MutationObserver. Optional inputs the user has started filling must also pass native format rules (`type`, `pattern`, `min`/`max`, and so on via `checkValidity`). Invalid styling (`data-tab-field-invalid`) applies to `input` elements only; selects and textareas gate the Next button but never receive the attribute.
- **Error UI is polite.** Invalid styling only appears after a field has been interacted with, or for the whole panel at once when the user clicks a Next that is disabled by validation.
- **First tab is always the starting point.** There is no default-tab option; use the `?tab-id=` deep link to land on another tab.
- **Pre-init flash is handled by the CSS.** With `data-preview="False"` on the `panel-list`, the CSS shows only the first panel before the JS runs and hides the rest. Without the CSS in the head, all panels may stack for a moment. In the Webflow Designer (`.wf-design-mode`) the CSS keeps the first panel and button visible for editing.
- **Order matters, ids do not.** Pairing is purely positional among the direct children of the two lists, so keep buttons and panels in matching order and count. A mismatch logs a `console.warn`.
- **Disabled controls still render.** Prev/next are disabled by swapping `data-button-theme` to `disabled` and flagging `data-tab-nav-disabled` (CSS shows `cursor: not-allowed`); clicks on them are ignored in JS. With `data-tab-nav="panel"`, only the active panel's controls are ever enabled.
- **Panel titles are opt-in.** Add `data-tab-element="title"` to a text element and `data-tab-panel-title` to your panels, and the title text tracks the active panel. Each title's starting text is captured at init as its default, so a panel with no `data-tab-panel-title` restores that default rather than leaving a stale title. An empty value is a real value and sets empty text. Markup with neither attribute behaves exactly as before.
- **Multiple tab components on one page are independent.** Init is idempotent per wrapper. Give each a distinct `data-tab-component-id` if you rely on deep links, since the default id is just the init-order index.
