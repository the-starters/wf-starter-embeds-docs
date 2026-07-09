# WF Starter Embeds Docs — site

Self-hosted docs site (Next.js + [Fumadocs](https://fumadocs.dev)).

**Content lives in [`content/`](content/).** Every markdown page, `meta.json` sidebar file,
and the [Documenting your own embed](content/adding-a-page.md) walkthrough are in that folder — pushes to
`main` redeploy the site on Vercel automatically.

## Local development

```bash
npm install   # runs fumadocs-mdx
npm run dev   # http://localhost:3000 → redirects to /docs
```

## Structure

- `content/` — the docs content; folders are sidebar groups, ordered by `meta.json` files.
- `source.config.ts` — points Fumadocs at `./content` with globs that exclude
  `content/README.md` and the legacy GitBook `SUMMARY.md`.
- `lib/shared.ts` — app name + the GitHub location that edit-on-GitHub links target.
- `app/docs/[[...slug]]/page.tsx` — doc page rendering, copy-markdown + edit-link popover.
