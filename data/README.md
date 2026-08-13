# Ownership data

Precomputed **Ownership** (Accountable + Last Editor) for Script Paths documented by this site.
Accountable is the first git adder of a **file** Script Path (`--follow`); Last Editor is the last
non-merge commit. Directory Script Paths are skipped. CI fails when the committed JSON is stale,
or when frontmatter points at a missing file that is not a reserved stub. Path overrides live in
`ownership-overrides.json`. For how to wire `source` / `sources` on a page, see
[`content/adding-a-page.md`](../content/adding-a-page.md). The short ADR is
[`docs/adr/0001-embed-ownership-on-docs.md`](../docs/adr/0001-embed-ownership-on-docs.md).

| File | Role |
| --- | --- |
| `ownership.json` | Generated artifact — do not hand-edit |
| `author-map.json` | Git author email / name → GitHub login |
| `ownership-overrides.json` | Path → GitHub login when Accountable is not the file-birth author |
| `ownership-reserved-stubs.json` | Script Paths allowed to be missing (deleted CDN folders) |

```sh
# Needs a local checkout of the-starters/starters-webflow (sibling by default)
npm run ownership:generate
npm run ownership:check
```

Optional: `STARTERS_WEBFLOW_ROOT=/path/to/starters-webflow`.
