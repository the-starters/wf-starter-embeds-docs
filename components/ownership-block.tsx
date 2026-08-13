import {
  githubProfileUrl,
  type OwnershipPerson,
  type OwnershipRow,
} from '@/lib/ownership';
import { sourceRepoUrl } from '@/lib/shared';

function PersonLink({ person }: { person: OwnershipPerson }) {
  if (person.login) {
    return (
      <a
        href={githubProfileUrl(person.login)}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-fd-foreground hover:underline"
      >
        @{person.login}
      </a>
    );
  }
  return <span className="font-medium text-fd-foreground">{person.displayName}</span>;
}

export function OwnershipBlock({ rows }: { rows: OwnershipRow[] }) {
  if (rows.length === 0) return null;

  return (
    <details className="group mb-6 rounded-lg border border-fd-border bg-fd-secondary/30 open:bg-fd-secondary/40">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-fd-foreground [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="text-fd-muted-foreground transition-transform group-open:rotate-90">
            ▸
          </span>
          Ownership
          <span className="font-normal text-fd-muted-foreground">
            ({rows.length} script{rows.length === 1 ? '' : 's'})
          </span>
        </span>
      </summary>
      <div className="border-t border-fd-border px-4 py-3">
        <p className="mb-3 text-xs text-fd-muted-foreground">
          Accountable is the first adder of the Script Path (rename follow). Last
          editor is the last non-merge commit. An override badge means Accountable
          was set in the ownership overrides map, not from git history.
        </p>
        <ul className="flex flex-col gap-3 text-sm">
          {rows.map(({ path, entry }) => (
            <li key={path} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-4">
              <a
                href={`${sourceRepoUrl}/${path}`}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-fd-muted-foreground hover:text-fd-foreground sm:min-w-[14rem] sm:shrink-0"
                title={path}
              >
                {path}
              </a>
              <p className="text-fd-muted-foreground">
                Accountable: <PersonLink person={entry.accountable} />
                {entry.accountableOverridden ? (
                  <span className="ms-1 text-xs">(override)</span>
                ) : null}
                <span className="mx-2 text-fd-border">·</span>
                Last editor: <PersonLink person={entry.lastEditor} />
              </p>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
