# WF Starter Docs — site

Self-hosted docs site (Next.js + [Fumadocs](https://fumadocs.dev)) for
[jericolawrence/wf-starter-docs](https://github.com/jericolawrence/wf-starter-docs).
Replaces the old GitBook hosting.

**Content does not live here.** `scripts/sync-content.mjs` clones the content repo into
`./content` (gitignored) on every `npm install` / Vercel build. To change docs content,
edit **wf-starter-docs** — pushes to its `main` trigger a redeploy here via a Vercel
deploy hook.

## Local development

```bash
npm install   # syncs ./content (uses your git credentials) + runs fumadocs-mdx
npm run dev   # http://localhost:3000 → redirects to /docs
```

`npm run sync-content` re-pulls the latest content without reinstalling.
Set `CONTENT_REPO_BRANCH=<branch>` to preview an unmerged content branch.

## Vercel setup (one-time)

1. **PAT** — create a fine-grained GitHub personal access token scoped to
   `jericolawrence/wf-starter-docs` with **Contents: Read-only** (the content repo is
   private, so the build needs it to clone).
2. **Import** — vercel.com/new → import `jericolawrence/wf-starter-docs-site`
   (Next.js auto-detected, no overrides needed).
3. **Env var** — add `CONTENT_REPO_PAT` = the PAT (Production + Preview) *before* the
   first build. Optional: `CONTENT_REPO_BRANCH` if the content migration PR isn't merged
   to `main` yet — builds fail on pre-migration content (no frontmatter).
4. **Deploy hook** — Project Settings → Git → Deploy Hooks → create one (e.g.
   `content-update`, branch `main`) and copy its URL.
5. **Content repo secret** — in `wf-starter-docs` → Settings → Secrets and variables →
   Actions → add `VERCEL_DEPLOY_HOOK_URL` = the hook URL. Its
   `trigger-docs-deploy.yml` workflow curls it on every push to `main`.

## Structure

- `source.config.ts` — points Fumadocs at `./content` with globs that exclude the content
  repo's `README.md`/`SUMMARY.md`; sidebar structure comes from the `meta.json` files in
  the content repo.
- `lib/shared.ts` — app name + the GitHub repo that edit-on-GitHub links target (the
  content repo, not this one).
- `app/docs/[[...slug]]/page.tsx` — doc page rendering, copy-markdown + edit-link popover.
