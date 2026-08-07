import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { z } from 'zod';

// Docs content lives in ./content. The globs exclude its README.md and the legacy
// GitBook SUMMARY.md. The sidebar mirrors the Webflow Navigator: one glob entry per
// main group folder — add new main groups (e.g. 'page-embeds/**/*.md') here as they land.
export const docs = defineDocs({
  dir: 'content',
  docs: {
    files: [
      'index.md',
      'adding-a-page.md',
      'algolia-result-modifiers/**/*.md',
      'explore-search/**/*.md',
      'freelancer-cms/**/*.md',
      'global-embeds/**/*.{md,mdx}',
      'navbar-embeds/**/*.md',
      'starters-list-filter/**/*.md',
      'swiper-scroll/**/*.md',
      'utils/**/*.md',
      'account-settings/**/*.md',
      'page-scripts/**/*.md',
      'v3/**/*.md',
      'archives/**/*.md',
    ],
    // `source` is a repo-relative path in the-starters/starters-webflow (file or
    // folder) that the page documents; it renders as a Source link on the page.
    // `sources` lists every Script Path for the Ownership block (multi-script
    // pages); when omitted, Ownership falls back to `source` alone.
    schema: pageSchema.extend({
      source: z.string().optional(),
      sources: z.array(z.string()).optional(),
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    files: [
      'meta.json',
      'algolia-result-modifiers/**/meta.json',
      'explore-search/**/meta.json',
      'freelancer-cms/**/meta.json',
      'global-embeds/**/meta.json',
      'navbar-embeds/**/meta.json',
      'starters-list-filter/**/meta.json',
      'swiper-scroll/**/meta.json',
      'utils/**/meta.json',
      'account-settings/**/meta.json',
      'page-scripts/**/meta.json',
      'v3/**/meta.json',
      'archives/**/meta.json',
    ],
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
});
