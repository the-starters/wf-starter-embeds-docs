# Ownership data

Precomputed **Ownership** (Accountable + Last Editor) for Script Paths documented by this site. See workspace ADR `docs/adr/0001-embed-ownership-on-docs.md`.

| File | Role |
| --- | --- |
| `ownership.json` | Generated artifact — do not hand-edit |
| `author-map.json` | Git author email / name → GitHub login |
| `ownership-overrides.json` | Path → GitHub login when Accountable is not the file-birth author |

```sh
# Needs a local checkout of the-starters/starters-webflow (sibling by default)
npm run ownership:generate
npm run ownership:check
```

Optional: `STARTERS_WEBFLOW_ROOT=/path/to/starters-webflow`.
