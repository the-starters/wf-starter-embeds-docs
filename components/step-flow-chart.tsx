'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Interactive flow map for the Step Flow page. One SVG shows the full pattern —
 * hub (reset-panel), a linear flow, and a multi-sub branching flow — with an
 * edge per engine action (panel-nav / next / back / branch / reset). The
 * controls under the chart walk a highlighted token through the graph using
 * the same buttons the real markup would have.
 *
 * Docs simulation only; keep the transitions in sync with step-flow.js.
 */

type NodeId = 'hub' | 'p1' | 'p2' | 'c1' | 'c2a' | 'c2b';
type BranchId = 'c2a' | 'c2b';

const COLORS = {
  next: 'var(--color-fd-primary)',
  branch: '#8b5cf6',
  back: 'var(--color-fd-muted-foreground)',
  reset: '#f59e0b',
  nav: '#10b981',
} as const;

type EdgeKind = keyof typeof COLORS;

interface Node {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  attr: string;
}

const NODES: Record<NodeId, Node> = {
  hub: { x: 20, y: 190, w: 160, h: 90, title: 'Hub', attr: 'element="reset-panel"' },
  p1: { x: 280, y: 75, w: 140, h: 60, title: 'Step 1', attr: 'element="step-1"' },
  p2: { x: 560, y: 75, w: 140, h: 60, title: 'Step 2', attr: 'element="step-2"' },
  c1: { x: 280, y: 255, w: 150, h: 100, title: 'Step 1 — radio gate', attr: 'entry element="step-1"' },
  c2a: { x: 600, y: 245, w: 220, h: 70, title: 'Discount offer', attr: 'subflow element="step-2a"' },
  c2b: { x: 600, y: 350, w: 220, h: 70, title: 'Feature request', attr: 'subflow element="step-2b"' },
};

interface Edge {
  id: string;
  from: NodeId[];
  kind: EdgeKind;
  d: string;
  label: string;
  labelX: number;
  labelY: number;
}

const EDGES: Edge[] = [
  { id: 'open-pause', from: ['hub'], kind: 'nav', d: 'M180,215 C230,215 230,105 280,105', label: 'panel-nav', labelX: 196, labelY: 156 },
  { id: 'open-cancel', from: ['hub'], kind: 'nav', d: 'M180,255 C230,255 230,290 280,290', label: 'panel-nav', labelX: 196, labelY: 284 },
  { id: 'p-next', from: ['p1'], kind: 'next', d: 'M420,105 L560,105', label: 'next', labelX: 476, labelY: 97 },
  { id: 'p-reset', from: ['p2'], kind: 'reset', d: 'M630,75 C630,8 100,20 100,190', label: 'reset', labelX: 348, labelY: 28 },
  { id: 'br-2a', from: ['c1'], kind: 'branch', d: 'M430,285 C510,285 520,270 600,270', label: 'branch', labelX: 492, labelY: 264 },
  { id: 'br-2b', from: ['c1'], kind: 'branch', d: 'M430,330 C510,330 520,380 600,380', label: 'branch', labelX: 478, labelY: 336 },
  { id: 'back-2a', from: ['c2a'], kind: 'back', d: 'M600,300 C520,300 510,315 430,315', label: 'back', labelX: 500, labelY: 326 },
  { id: 'back-2b', from: ['c2b'], kind: 'back', d: 'M600,405 C520,405 510,350 430,348', label: 'back', labelX: 505, labelY: 400 },
  { id: 'c-reset', from: ['c2a', 'c2b'], kind: 'reset', d: 'M240,430 C160,430 100,370 100,280', label: 'reset', labelX: 128, labelY: 416 },
];

const BRANCH_RADIOS: Record<BranchId, string> = {
  c2a: 'Too expensive',
  c2b: 'Missing a feature',
};

function ChartNode({ id, node, current }: { id: NodeId; node: Node; current: boolean }) {
  return (
    <g>
      <rect
        x={node.x}
        y={node.y}
        width={node.w}
        height={node.h}
        rx={10}
        fill={current ? 'var(--color-fd-accent)' : 'var(--color-fd-card)'}
        stroke={current ? 'var(--color-fd-primary)' : 'var(--color-fd-border)'}
        strokeWidth={current ? 2.5 : 1}
      />
      <text
        x={node.x + node.w / 2}
        y={node.y + node.h / 2 - 4}
        textAnchor="middle"
        fontSize={12.5}
        fontWeight={600}
        fill="var(--color-fd-foreground)"
      >
        {node.title}
      </text>
      <text
        x={node.x + node.w / 2}
        y={node.y + node.h / 2 + 14}
        textAnchor="middle"
        fontSize={9.5}
        fontFamily="var(--font-mono, monospace)"
        fill="var(--color-fd-muted-foreground)"
      >
        {node.attr}
      </text>
      {id === 'hub' && (
        <text
          x={node.x + node.w / 2}
          y={node.y + node.h / 2 + 30}
          textAnchor="middle"
          fontSize={9.5}
          fill="var(--color-fd-muted-foreground)"
        >
          shown on load
        </text>
      )}
    </g>
  );
}

function ControlButton({
  primary,
  disabled,
  onClick,
  children,
}: {
  primary?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        primary
          ? 'bg-fd-primary text-fd-primary-foreground hover:opacity-90'
          : 'border border-fd-border bg-fd-background hover:bg-fd-accent',
        disabled && 'cursor-not-allowed opacity-40 hover:bg-fd-background hover:opacity-40',
      )}
    >
      {children}
    </button>
  );
}

export function StepFlowChart() {
  const [current, setCurrent] = useState<NodeId>('hub');
  const [lastEdge, setLastEdge] = useState<string | null>(null);
  const [trail, setTrail] = useState<NodeId[]>([]);
  const [radio, setRadio] = useState<BranchId | null>(null);
  const [warn, setWarn] = useState(false);

  const go = (to: NodeId, edge: string, opts?: { push?: boolean; clear?: boolean }) => {
    setTrail((t) => (opts?.clear ? [] : opts?.push ? [...t, current] : t.slice(0, -1)));
    setCurrent(to);
    setLastEdge(edge);
    setWarn(false);
    if (opts?.clear) setRadio(null);
  };

  const resetDemo = () => {
    setCurrent('hub');
    setLastEdge(null);
    setTrail([]);
    setRadio(null);
    setWarn(false);
  };

  const controls: Record<NodeId, React.ReactNode> = {
    hub: (
      <>
        <ControlButton onClick={() => go('p1', 'open-pause', { clear: true })}>
          Pause membership
        </ControlButton>
        <ControlButton onClick={() => go('c1', 'open-cancel', { clear: true })}>
          Cancel membership
        </ControlButton>
      </>
    ),
    p1: (
      <>
        <ControlButton disabled>Go Back</ControlButton>
        <ControlButton primary onClick={() => go('p2', 'p-next', { push: true })}>
          Continue
        </ControlButton>
      </>
    ),
    p2: (
      <>
        <ControlButton onClick={() => go('p1', 'p-next')}>Go Back</ControlButton>
        <ControlButton primary onClick={() => go('hub', 'p-reset', { clear: true })}>
          Done
        </ControlButton>
      </>
    ),
    c1: (
      <>
        {(Object.keys(BRANCH_RADIOS) as BranchId[]).map((id) => (
          <label key={id} className="flex cursor-pointer items-center gap-1.5 text-sm">
            <input
              type="radio"
              name="sfc-reason"
              checked={radio === id}
              onChange={() => {
                setRadio(id);
                setWarn(false);
              }}
            />
            {BRANCH_RADIOS[id]}
          </label>
        ))}
        <ControlButton
          primary
          onClick={() => {
            if (!radio) {
              setWarn(true);
              return;
            }
            go(radio, radio === 'c2a' ? 'br-2a' : 'br-2b', { push: true });
          }}
        >
          Continue
        </ControlButton>
      </>
    ),
    c2a: (
      <>
        <ControlButton onClick={() => go('c1', 'back-2a')}>Go Back</ControlButton>
        <ControlButton primary onClick={() => go('hub', 'c-reset', { clear: true })}>
          Keep my membership
        </ControlButton>
      </>
    ),
    c2b: (
      <>
        <ControlButton onClick={() => go('c1', 'back-2b')}>Go Back</ControlButton>
        <ControlButton primary onClick={() => go('hub', 'c-reset', { clear: true })}>
          Keep my membership
        </ControlButton>
      </>
    ),
  };

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-fd-border">
      <div className="flex items-center justify-between border-b border-fd-border bg-fd-secondary/50 px-4 py-2">
        <span className="text-sm font-medium">Flow map — hub, linear wizard, branching flow</span>
        <button
          type="button"
          onClick={resetDemo}
          className="rounded-md border border-fd-border bg-fd-background px-2 py-1 text-xs text-fd-muted-foreground hover:bg-fd-accent"
        >
          Reset demo
        </button>
      </div>

      <div className="overflow-x-auto bg-fd-card p-2">
        <svg viewBox="0 0 880 460" className="mx-auto block h-auto w-full min-w-[640px] max-w-[880px]">
          <defs>
            {(Object.keys(COLORS) as EdgeKind[]).map((kind) => (
              <marker
                key={kind}
                id={`sfc-arrow-${kind}`}
                viewBox="0 0 10 10"
                refX="9"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M0,0 L10,5 L0,10 z" fill={COLORS[kind]} />
              </marker>
            ))}
          </defs>

          {/* flow containers */}
          <g>
            <rect x={240} y={30} width={620} height={130} rx={12} fill="var(--color-fd-secondary)" fillOpacity={0.35} stroke="var(--color-fd-border)" strokeDasharray="4 4" />
            <text x={256} y={52} fontSize={10} fontFamily="var(--font-mono, monospace)" fill="var(--color-fd-muted-foreground)">
              data-form-flow="pause-membership" (linear)
            </text>
            <rect x={240} y={200} width={620} height={240} rx={12} fill="var(--color-fd-secondary)" fillOpacity={0.35} stroke="var(--color-fd-border)" strokeDasharray="4 4" />
            <text x={256} y={222} fontSize={10} fontFamily="var(--font-mono, monospace)" fill="var(--color-fd-muted-foreground)">
              data-form-flow="cancel-membership" type="multi-sub"
            </text>
          </g>

          {/* edges */}
          {EDGES.map((e) => {
            const active = e.from.includes(current);
            const traversed = lastEdge === e.id;
            return (
              <g key={e.id} opacity={traversed ? 1 : active ? 0.9 : 0.3}>
                <path
                  d={e.d}
                  fill="none"
                  stroke={COLORS[e.kind]}
                  strokeWidth={traversed ? 3 : 1.75}
                  strokeDasharray={e.kind === 'back' || e.kind === 'reset' ? '6 4' : undefined}
                  markerEnd={`url(#sfc-arrow-${e.kind})`}
                />
                <text
                  x={e.labelX}
                  y={e.labelY}
                  fontSize={10}
                  fontFamily="var(--font-mono, monospace)"
                  fontWeight={traversed ? 700 : 400}
                  fill={COLORS[e.kind]}
                >
                  {e.label}
                </text>
              </g>
            );
          })}

          {/* nodes */}
          {(Object.keys(NODES) as NodeId[]).map((id) => (
            <ChartNode key={id} id={id} node={NODES[id]} current={current === id} />
          ))}
        </svg>
      </div>

      <div className="border-t border-fd-border bg-fd-card px-4 py-3">
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fd-muted-foreground">
          <span>You are on:</span>
          {[...trail, current].map((id, i, arr) => (
            <span key={`${id}-${i}`} className="flex items-center gap-2">
              <code
                className={cn(
                  'rounded bg-fd-secondary px-1.5 py-0.5 font-mono text-[11px]',
                  i === arr.length - 1 && 'bg-fd-primary/10 font-semibold text-fd-primary',
                )}
              >
                {NODES[id].title}
              </code>
              {i < arr.length - 1 && <span aria-hidden>▸</span>}
            </span>
          ))}
          {trail.length > 0 && <span className="ml-1">(history that “back” pops)</span>}
        </div>
        <div className="flex flex-wrap items-center gap-3">{controls[current]}</div>
        {warn && (
          <p className="mt-2 font-mono text-xs text-amber-600 dark:text-amber-400">
            console.warn: no branch radio selected
          </p>
        )}
        {current === 'p1' && (
          <p className="mt-2 text-xs text-fd-muted-foreground">
            Go Back is a no-op here — the history stack is empty on step-1.
          </p>
        )}
      </div>
    </div>
  );
}
