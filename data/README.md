# Ownership data

Precomputed **Ownership** (Accountable + Last Editor) for Script Paths documented by this site.
Accountable is the first git adder of the Script Path (`--follow`); Last Editor is the last
non-merge commit. CI fails when the committed JSON is stale. Path overrides live in
`ownership-overrides.json`. For how to wire `source` / `sources` on a page, see
[`content/adding-a-page.md`](../content/adding-a-page.md).

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
