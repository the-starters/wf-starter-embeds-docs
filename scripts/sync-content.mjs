// Pulls the canonical docs content (jericolawrence/wf-starter-docs) into ./content.
// On Vercel, CONTENT_REPO_PAT (fine-grained PAT, Contents: read-only) authenticates the
// clone; locally your own git credentials are used. ./content is gitignored — the content
// repo stays the single source of truth.
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contentDir = join(root, 'content');
const branch = process.env.CONTENT_REPO_BRANCH || 'main';

const pat = process.env.CONTENT_REPO_PAT;
const repoUrl = pat
  ? `https://x-access-token:${pat}@github.com/jericolawrence/wf-starter-docs.git`
  : 'https://github.com/jericolawrence/wf-starter-docs.git';

const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit' });

if (existsSync(join(contentDir, '.git'))) {
  console.log(`[sync-content] updating existing clone (${branch})`);
  run(`git fetch --depth=1 origin ${branch} && git reset --hard origin/${branch}`, contentDir);
} else {
  rmSync(contentDir, { recursive: true, force: true });
  console.log(`[sync-content] cloning wf-starter-docs (${branch})`);
  run(`git clone --depth=1 --branch ${branch} "${repoUrl}" "${contentDir}"`);
}
console.log('[sync-content] done');
