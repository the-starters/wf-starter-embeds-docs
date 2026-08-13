import ownershipData from '@/data/ownership.json';

export type OwnershipPerson = {
  login: string | null;
  displayName: string;
};

export type OwnershipEntry = {
  accountable: OwnershipPerson;
  lastEditor: OwnershipPerson;
  accountableOverridden: boolean;
};

export type OwnershipRow = {
  path: string;
  entry: OwnershipEntry;
};

type OwnershipFile = {
  generatedAt: string;
  scriptsRepo: string;
  scriptsSha: string;
  scripts: Record<string, OwnershipEntry>;
};

const data = ownershipData as OwnershipFile;

/**
 * Script paths a docs page owns for Ownership display: union of `source` and
 * `sources` (when present). Either alone is enough; both sit alongside each other.
 */
function scriptPathsForPage(page: {
  data: { source?: string; sources?: string[] };
}): string[] {
  const paths: string[] = [];
  const seen = new Set<string>();
  const push = (p?: string) => {
    if (!p || seen.has(p)) return;
    // Directory Script Paths never get Ownership rows (Accountable is file-birth).
    if (!data.scripts[p]) return;
    seen.add(p);
    paths.push(p);
  };
  push(page.data.source);
  for (const s of page.data.sources || []) push(s);
  return paths;
}

export function ownershipRowsForPage(page: {
  data: { source?: string; sources?: string[] };
}): OwnershipRow[] {
  const rows: OwnershipRow[] = [];
  for (const scriptPath of scriptPathsForPage(page)) {
    const entry = data.scripts[scriptPath];
    if (entry) rows.push({ path: scriptPath, entry });
  }
  return rows;
}

export function githubProfileUrl(login: string): string {
  return `https://github.com/${login}`;
}
