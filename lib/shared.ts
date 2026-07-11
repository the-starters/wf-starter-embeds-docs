export const appName = 'WF Starter Embeds Docs';
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

// Edit links point at the content/ folder of this repo.
export const gitConfig = {
  user: 'the-starters',
  repo: 'wf-starter-embeds-docs',
  branch: 'main',
  contentDir: 'content',
};

// Source links (the `source` frontmatter field) point at the scripts repo the
// pages document. GitHub redirects tree/ to blob/ for file paths, so one base
// URL covers both folders and single files.
export const sourceRepoUrl = 'https://github.com/the-starters/starters-webflow/tree/main';
