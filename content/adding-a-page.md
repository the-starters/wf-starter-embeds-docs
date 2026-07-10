---
title: "Documenting your own embed"
description: "How to document your own embed in these docs."
---

## Where your page goes

All docs pages live in the `content/` folder of the
[the-starters/wf-starter-embeds-docs](https://github.com/the-starters/wf-starter-embeds-docs)
repo. The sidebar mirrors its folder structure, which in turn mirrors the Webflow Navigator:

```
content/
├── meta.json                    ← main group order
├── index.md                     ← the Introduction page
├── global-embeds/               ← main group (= embed-wrapper in Webflow)
│   ├── meta.json                ← sidebar order inside the group
│   ├── index.md                 ← the group's Intro page
│   ├── accordions/
│   │   └── index.md             ← single-page component
│   └── step-flow/
│       ├── meta.json
│       ├── index.md             ← the component's main walkthrough
│       └── panel-nav-flow.md    ← companion script page
```

- **Embed with one walkthrough.** Create `<component>/index.md` (or a single `<name>.md` file).
- **Embed with companion scripts.** A folder with `index.md` (the main walkthrough), one `.md`
  per extra script, and a `meta.json` listing them.

## Add your page in 4 steps

1. **Create the file** under the right group folder. Frontmatter needs at least a title; use the
   embed's name as it appears in Webflow:

   ```md
   ---
   title: "My Component"
   ---
   ```

2. **Register it in the sidebar.** Add the file/folder name to the `pages` array of the parent
   folder's `meta.json`. The array order is the sidebar order; keep it matching the Webflow
   Navigator.

3. **Write the page following the standard shape** (template below) so every component page scans
   the same way.

4. **Push to `main`.** Vercel redeploys the docs site automatically; your page is live in about
   a minute.

## Page template

````md
---
title: "My Component"
---

Source: Webflow — `Global Embeds / My Component`

## What it is

A one-paragraph summary of the behaviour: what the script does, how it inits, whether it is
idempotent.

## File structure

```
My Component
├── My Component - CSS
└── My Component - JS
```

Note any dependencies here (GSAP, jQuery, WF-Algolia, load order).

## Markup contract

```html
<div data-my-component>
  <!-- the HTML structure / data-* attributes the script expects -->
</div>
```

## xAttribute JSON

```json
{
  "data-my-component": ""
}
```

## API

| Attribute | On | Values | Purpose |
| --- | --- | --- | --- |
| `data-my-component` | wrapper | — | … |

## Notes & gotchas

- Accessibility, idempotency, mobile/touch behaviour, integration caveats.
````

Conventions to keep:

- **`Source:` line.** The embed's path in the Webflow **Navigator**
  (e.g. `Global Embeds / Form Embeds / Checkbox Toggle`). Use a GitHub repo path only when the
  script is actually loaded through a jsDelivr CDN URL.
- **File names.** As they appear in Webflow: `My Component - CSS`, `My Component - JS`.
- **`xAttribute JSON` section.** One fenced ` ```json ` block per element that takes attributes
  (keys and values as strings), so hooks can be pasted straight into the xAttribute Webflow app
  instead of typed one by one. See the [Accordions page](global-embeds/accordions) for the shape.

## Adding a whole new main group

A new **top-level** folder (like `global-embeds/`) needs two extra one-line changes, both in the
same repo:

1. Add the group to `content/meta.json`'s `pages` array.
2. Add `your-group/**/*.md` to `docs.files` and `your-group/**/meta.json` to `meta.files` in
   `source.config.ts` (repo root).
