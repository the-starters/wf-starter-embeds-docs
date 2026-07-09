import { docs } from 'collections/server';
import type * as PageTree from 'fumadocs-core/page-tree';
import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';

// The content repo (GitBook heritage) keeps every component as a folder with an
// index.md, which Fumadocs renders as a collapsible group even for single pages.
// Reshape the sidebar: a folder whose only page is its index becomes a flat link,
// and a folder with more pages lists its index as the first child instead of
// making the group header itself the link (e.g. Step Flow → Step Flow, Panel Nav Flow).
function reshapeSidebar(nodes: PageTree.Node[]): PageTree.Node[] {
  return nodes.map((node) => {
    if (node.type !== 'folder') return node;

    const children = reshapeSidebar(node.children);
    if (!node.index) return { ...node, children };
    if (children.length === 0) return { ...node.index, name: node.name };

    return { ...node, index: undefined, children: [node.index, ...children] };
  });
}

const sidebarTransformer = {
  root(root: PageTree.Root): PageTree.Root {
    return { ...root, children: reshapeSidebar(root.children) };
  },
};

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
  pageTree: {
    transformers: [sidebarTransformer],
  },
});

export function getPageImage(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `${docsImageRoute}/${segments.join('/')}`,
  };
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join('/')}`,
  };
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
