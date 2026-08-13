# 0001. Embed Ownership on docs pages

Status: accepted

Accountable is the first git adder of a **file** Script Path (`--follow` / rename). Last Editor is the last non-merge committer. An Ownership Override (path → GitHub login) wins when Accountable is not the file-birth author, including when the path is gone.

Directory Script Paths produce no Ownership rows. A page whose `source` is only a folder hides the block. Missing file paths fail the ownership check unless they are on the reserved-stub allowlist (Tabs Radio Filter; Algolia Subcategories until that modifier ships) or have an override.

CI regenerates nothing in place: it fails the PR when `data/ownership.json` script rows are stale, and also runs `types:check`. Comparison ignores tip SHA so an unrelated CDN commit does not fail docs CI.
