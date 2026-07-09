# WF Starter Embeds Docs — site

Self-hosted docs site (Next.js + [Fumadocs](https://fumadocs.dev)).

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

## Structure

- `source.config.ts` — points Fumadocs at `./content` with globs that exclude the content
  repo's `README.md`/`SUMMARY.md`; sidebar structure comes from the `meta.json` files in
  the content repo.
- `lib/shared.ts` — app name + the GitHub repo that edit-on-GitHub links target (the
  content repo, not this one).
- `app/docs/[[...slug]]/page.tsx` — doc page rendering, copy-markdown + edit-link popover.
