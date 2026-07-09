import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';

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
      'freelancer-cms/**/*.md',
      'global-embeds/**/*.md',
      'starters-list-filter/**/*.md',
    ],
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    files: [
      'meta.json',
      'algolia-result-modifiers/**/meta.json',
      'freelancer-cms/**/meta.json',
      'global-embeds/**/meta.json',
      'starters-list-filter/**/meta.json',
    ],
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
});
