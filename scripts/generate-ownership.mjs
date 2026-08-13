#!/usr/bin/env node
/**
 * Generate data/ownership.json from starters-webflow git history.
 *
 * Usage:
 *   node scripts/generate-ownership.mjs
 *   node scripts/generate-ownership.mjs --check   # exit 1 if committed JSON is stale
 *
 * Env:
 *   STARTERS_WEBFLOW_ROOT — path to the CDN repo (default: ../starters-webflow)
 */
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(__dirname, '..');
const checkMode = process.argv.includes('--check');

const scriptsRoot = path.resolve(
  process.env.STARTERS_WEBFLOW_ROOT || path.join(docsRoot, '..', 'starters-webflow'),
);
const contentDir = path.join(docsRoot, 'content');
const outPath = path.join(docsRoot, 'data', 'ownership.json');
const authorMapPath = path.join(docsRoot, 'data', 'author-map.json');
const overridesPath = path.join(docsRoot, 'data', 'ownership-overrides.json');

function die(message) {
  console.error(message);
  process.exit(1);
}

if (!existsSync(path.join(scriptsRoot, '.git'))) {
  die(
    `starters-webflow git repo not found at ${scriptsRoot}. Set STARTERS_WEBFLOW_ROOT.`,
  );
}

const authorMap = JSON.parse(readFileSync(authorMapPath, 'utf8'));
const overrides = JSON.parse(readFileSync(overridesPath, 'utf8'));
const reservedStubsPath = path.join(docsRoot, 'data', 'ownership-reserved-stubs.json');
/** @type {string[]} */
const reservedStubs = existsSync(reservedStubsPath)
  ? JSON.parse(readFileSync(reservedStubsPath, 'utf8'))
  : [];
const reservedStubSet = new Set(reservedStubs);

function git(args, cwd = scriptsRoot) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function walkMarkdown(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkMarkdown(full, files);
    else if (/\.mdx?$/.test(name)) files.push(full);
  }
  return files;
}

/** @returns {{ source?: string, sources?: string[] }} */
function parseFrontmatter(file) {
  const text = readFileSync(file, 'utf8');
  if (!text.startsWith('---')) return {};
  const end = text.indexOf('\n---', 3);
  if (end === -1) return {};
  const block = text.slice(3, end).trim();
  /** @type {{ source?: string, sources?: string[] }} */
  const out = {};
  const sources = [];
  let inSources = false;

  for (const rawLine of block.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (inSources) {
      const item = line.match(/^\s*-\s+(.+?)\s*$/);
      if (item) {
        sources.push(item[1].replace(/^["']|["']$/g, ''));
        continue;
      }
      if (/^\S/.test(line)) inSources = false;
      else continue;
    }
    const sourceMatch = line.match(/^source:\s*(.+?)\s*$/);
    if (sourceMatch) {
      out.source = sourceMatch[1].replace(/^["']|["']$/g, '');
      continue;
    }
    if (/^sources:\s*\[/.test(line)) {
      const inline = line.match(/^sources:\s*\[(.*)\]\s*$/);
      if (inline) {
        const inner = inline[1].trim();
        if (inner) {
          for (const part of inner.split(',')) {
            const p = part.trim().replace(/^["']|["']$/g, '');
            if (p) sources.push(p);
          }
        }
      }
      continue;
    }
    if (/^sources:\s*$/.test(line)) {
      inSources = true;
    }
  }
  if (sources.length) out.sources = sources;
  return out;
}

function collectScriptPaths() {
  /** @type {Set<string>} */
  const paths = new Set();
  for (const file of walkMarkdown(contentDir)) {
    const fm = parseFrontmatter(file);
    if (fm.source) paths.add(fm.source);
    for (const s of fm.sources || []) paths.add(s);
  }
  return [...paths].sort();
}

/**
 * @param {string} authorLine "Name <email>"
 * @returns {{ login: string | null, displayName: string, email: string | null }}
 */
function resolveIdentity(authorLine) {
  const match = authorLine.match(/^(.*?)\s*<([^>]+)>\s*$/);
  const displayName = (match ? match[1] : authorLine).trim();
  const email = match ? match[2].trim().toLowerCase() : null;
  let login = null;
  if (email && authorMap.emails?.[email]) login = authorMap.emails[email];
  else if (authorMap.names?.[displayName]) login = authorMap.names[displayName];
  else if (email && email.endsWith('@users.noreply.github.com')) {
    const local = email.split('@')[0];
    const plus = local.includes('+') ? local.split('+')[1] : local;
    if (plus) login = plus;
  }
  return { login, displayName, email };
}

function personPayload(identity) {
  if (identity.login) {
    return { login: identity.login, displayName: identity.displayName };
  }
  return { login: null, displayName: identity.displayName };
}

function pathExistsInScripts(scriptPath) {
  return existsSync(path.join(scriptsRoot, scriptPath));
}

function isDirectoryScriptPath(scriptPath) {
  const full = path.join(scriptsRoot, scriptPath);
  return existsSync(full) && statSync(full).isDirectory();
}

function displayNameForLogin(login) {
  return (
    Object.keys(authorMap.names || {}).find((n) => authorMap.names[n] === login) ||
    login
  );
}

/**
 * @param {string} scriptPath
 * @returns {{ accountable: object, lastEditor: object, accountableOverridden: boolean } | null}
 */
function ownershipForPath(scriptPath) {
  const overrideLogin = overrides[scriptPath];
  const exists = pathExistsInScripts(scriptPath);

  if (!exists) {
    if (!overrideLogin) {
      console.warn(`skip missing path in starters-webflow: ${scriptPath}`);
      return null;
    }
    // Ownership Override still applies when the path is gone or renamed away.
    return {
      accountable: {
        login: overrideLogin,
        displayName: displayNameForLogin(overrideLogin),
      },
      lastEditor: {
        login: overrideLogin,
        displayName: displayNameForLogin(overrideLogin),
      },
      accountableOverridden: true,
    };
  }

  let birthLine = '';
  try {
    birthLine = git([
      'log',
      '--diff-filter=A',
      '--follow',
      '--reverse',
      '--format=%an <%ae>',
      '--',
      scriptPath,
    ])
      .split('\n')
      .filter(Boolean)[0];
  } catch {
    birthLine = '';
  }
  if (!birthLine) {
    try {
      birthLine = git([
        'log',
        '--reverse',
        '--format=%an <%ae>',
        '--',
        scriptPath,
      ])
        .split('\n')
        .filter(Boolean)[0];
    } catch {
      birthLine = '';
    }
  }

  let lastLine = '';
  try {
    lastLine = git([
      'log',
      '-1',
      '--no-merges',
      '--format=%an <%ae>',
      '--',
      scriptPath,
    ]);
  } catch {
    lastLine = '';
  }

  if (!birthLine && !lastLine) {
    if (!overrideLogin) {
      console.warn(`no git history for ${scriptPath}`);
      return null;
    }
    return {
      accountable: {
        login: overrideLogin,
        displayName: displayNameForLogin(overrideLogin),
      },
      lastEditor: {
        login: overrideLogin,
        displayName: displayNameForLogin(overrideLogin),
      },
      accountableOverridden: true,
    };
  }

  const birth = resolveIdentity(birthLine || lastLine);
  const last = resolveIdentity(lastLine || birthLine);
  const accountableOverridden = Boolean(overrideLogin);
  const accountable = accountableOverridden
    ? {
        login: overrideLogin,
        displayName: displayNameForLogin(overrideLogin),
      }
    : personPayload(birth);

  return {
    accountable,
    lastEditor: personPayload(last),
    accountableOverridden,
  };
}

const scriptPaths = collectScriptPaths();
/** @type {Record<string, object>} */
const scripts = {};
/** @type {string[]} */
const missing = [];
for (const scriptPath of scriptPaths) {
  if (reservedStubSet.has(scriptPath)) {
    continue;
  }
  if (isDirectoryScriptPath(scriptPath)) {
    continue;
  }
  if (!pathExistsInScripts(scriptPath) && !overrides[scriptPath]) {
    missing.push(scriptPath);
    continue;
  }
  const entry = ownershipForPath(scriptPath);
  if (entry) scripts[scriptPath] = entry;
}

if (missing.length) {
  die(
    `Script Path(s) in frontmatter are missing from starters-webflow (add an Ownership Override, a reserved stub, or fix the path):\n  ${missing.join('\n  ')}`,
  );
}

const payload = {
  generatedAt: new Date().toISOString(),
  scriptsRepo: 'the-starters/starters-webflow',
  scriptsSha: git(['rev-parse', 'HEAD']),
  scripts: scripts,
};

const serialized = `${JSON.stringify(payload, null, 2)}\n`;

if (checkMode) {
  if (!existsSync(outPath)) {
    die(`Missing ${outPath}. Run: npm run ownership:generate`);
  }
  const existing = readFileSync(outPath, 'utf8');
  // Compare ownership rows only — ignore generatedAt and tip SHA so an
  // unrelated starters-webflow commit does not fail docs CI until a Script
  // Path's Accountable/Last Editor actually changes.
  const existingJson = JSON.parse(existing);
  const normalize = (obj) => JSON.stringify(obj.scripts || {});
  if (normalize(existingJson) !== normalize(payload)) {
    die(
      'data/ownership.json is stale. Run `npm run ownership:generate` and commit the result.',
    );
  }
  console.log('ownership.json is up to date.');
  process.exit(0);
}

mkdirSync(path.dirname(outPath), { recursive: true });
writeFileSync(outPath, serialized);
console.log(
  `Wrote ${outPath} (${Object.keys(scripts).length} script paths, sha ${payload.scriptsSha.slice(0, 7)})`,
);
