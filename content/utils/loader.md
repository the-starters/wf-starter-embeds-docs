---
title: "Loader"
---

Source: `utils/loader.js`

## What it is

A tiny environment-switching script loader. `loadEnvScript()` picks a staging or live bundle
URL based on the current host (any `*.webflow.io` host counts as staging, everything else
as live), creates a `<script>` element for it, and appends it to `<body>`. Load/error outcomes are
logged to the console with the script's name.

This is the pattern used to point staging pages at in-progress bundles while production keeps
loading the released ones, without editing the page's custom code per environment.

## File structure

```
utils/loader.js
```

The file defines **one global function** (`loadEnvScript`) and runs nothing on its own; it
must be loaded *before* any custom-code block that calls it.

## Usage

```html
<script src="https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/utils/loader.js"></script>
<script>
  loadEnvScript({
    name: "opportunities",
    staging: "https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@main/opportunities-3.0.js",
    live: "https://cdn.jsdelivr.net/gh/the-starters/starters-webflow@latest/opportunities-3.0.js",
    type: "text/javascript",
  });
</script>
```

## API

`loadEnvScript(options)` takes an options object:

| Key | Default | Purpose |
| --- | --- | --- |
| `staging` | — | Script URL used when the host contains `webflow.io`. |
| `live` | — | Script URL used everywhere else. |
| `name` | `"script"` | Label used in the console log lines. |
| `type` | `"module"` | `type` attribute for the injected `<script>` tag. |

## Notes & gotchas

- The default `type` is `"module"`. Module scripts are deferred and scoped. For classic
  scripts that define globals, pass `type: "text/javascript"` explicitly.
- Do **not** load `loader.js` itself with `defer` if the caller block runs earlier; the
  function must exist by the time it's called. Inline callers in the footer are fine when the
  loader tag (without `defer`) sits above them.
- Scripts injected this way load **async** relative to the rest of the page, so anything they
  define arrives late. Gate dependents on the injected script's behaviour (events, polling),
  not on load order. [WF Validate](wf-validate.md)'s document-capture gating was designed to
  win regardless of this ordering.
- There is no error fallback beyond the console log: a typoed staging URL fails silently for
  users.
