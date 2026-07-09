import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';

// Content is the wf-starter-docs repo, cloned into ./content by scripts/sync-content.mjs.
// The globs exclude its GitHub-facing README.md and the legacy GitBook SUMMARY.md.
export const docs = defineDocs({
  dir: 'content',
  docs: {
    files: ['index.md', 'conventions/**/*.md', 'components/**/*.md'],
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    files: ['meta.json', 'conventions/**/meta.json', 'components/**/meta.json'],
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
});
