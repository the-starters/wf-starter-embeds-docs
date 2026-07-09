'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Interactive companion to the "Markup contract" code blocks on the Step Flow
 * page. It simulates what step-flow.js does at runtime — showing/hiding the
 * step panels and button groups — while the right-hand pane mirrors the markup
 * so readers can see which element is visible at every click.
 *
 * This is a simulation for the docs, not the real engine; keep its behavior in
 * sync with step-flow.js if the navigation rules ever change.
 */

type Variant = 'linear' | 'multi-sub';

const BRANCHES = {
  'step-2a': { radio: 'Too expensive', content: 'Discount offer — 50% off for 3 months' },
  'step-2b': { radio: 'Missing a feature', content: 'Tell us which feature you are missing' },
} as const;

type BranchId = keyof typeof BRANCHES;

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded bg-fd-secondary px-1.5 py-0.5 font-mono text-[10px] leading-tight text-fd-muted-foreground">
      {children}
    </span>
  );
}

function StepBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Chip>{label}</Chip>
      <div className="rounded-lg border border-dashed border-fd-border bg-fd-background p-3 text-sm">
        {children}
      </div>
    </div>
  );
}

function DemoButton({
  primary,
  onClick,
  children,
}: {
  primary?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        primary
          ? 'bg-fd-primary text-fd-primary-foreground hover:opacity-90'
          : 'border border-fd-border bg-fd-background hover:bg-fd-accent',
      )}
    >
      {children}
    </button>
  );
}

function ButtonGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Chip>{label}</Chip>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

/** One row of the live DOM-state pane. */
function TreeRow({ depth, label, shown }: { depth: number; label: string; shown: boolean | null }) {
  return (
    <div
      className="flex items-center justify-between gap-3 py-0.5"
      style={{ paddingLeft: depth * 14 }}
    >
      <code
        className={cn(
          'font-mono text-[11px] leading-relaxed transition-opacity',
          shown === false && 'opacity-40',
        )}
      >
        {label}
      </code>
      {shown !== null && (
        <span
          className={cn(
            'shrink-0 rounded-full px-1.5 py-px font-mono text-[10px]',
            shown
              ? 'bg-green-500/15 text-green-700 dark:text-green-400'
              : 'bg-fd-secondary text-fd-muted-foreground',
          )}
        >
          {shown ? 'shown' : 'hidden'}
        </span>
      )}
    </div>
  );
}

function DemoFrame({
  title,
  onReset,
  rendered,
  tree,
}: {
  title: string;
  onReset: () => void;
  rendered: ReactNode;
  tree: ReactNode;
}) {
  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-fd-border">
      <div className="flex items-center justify-between border-b border-fd-border bg-fd-secondary/50 px-4 py-2">
        <span className="text-sm font-medium">{title}</span>
        <button
          type="button"
          onClick={onReset}
          className="rounded-md border border-fd-border bg-fd-background px-2 py-1 text-xs text-fd-muted-foreground hover:bg-fd-accent"
        >
          Reset demo
        </button>
      </div>
      <div className="grid gap-px bg-fd-border md:grid-cols-2">
        <div className="space-y-4 bg-fd-card p-4">{rendered}</div>
        <div className="bg-fd-card p-4">
          <p className="mb-2 text-xs font-medium text-fd-muted-foreground">
            What the engine is showing / hiding
          </p>
          {tree}
        </div>
      </div>
    </div>
  );
}

function LinearDemo() {
  const [step, setStep] = useState<'step-1' | 'step-2'>('step-1');

  return (
    <DemoFrame
      title="Live demo — linear flow"
      onReset={() => setStep('step-1')}
      rendered={
        <>
          {step === 'step-1' && (
            <StepBox label='data-form-flow-element="step-1"'>Step 1 content</StepBox>
          )}
          {step === 'step-2' && (
            <StepBox label='data-form-flow-element="step-2"'>Step 2 content</StepBox>
          )}
          {step === 'step-1' ? (
            <ButtonGroup label='data-form-flow-button-group="step-1"'>
              <DemoButton onClick={() => undefined}>Go Back</DemoButton>
              <DemoButton primary onClick={() => setStep('step-2')}>
                Continue
              </DemoButton>
            </ButtonGroup>
          ) : (
            <ButtonGroup label='data-form-flow-button-group="step-2"'>
              <DemoButton primary onClick={() => setStep('step-1')}>
                Done
              </DemoButton>
            </ButtonGroup>
          )}
        </>
      }
      tree={
        <div>
          <TreeRow depth={0} label='data-form-flow="pause-membership"' shown={null} />
          <TreeRow depth={1} label='element="step-1"' shown={step === 'step-1'} />
          <TreeRow depth={1} label='element="step-2"' shown={step === 'step-2'} />
          <TreeRow depth={1} label="data-form-flow-footer" shown={null} />
          <TreeRow depth={2} label='button-group="step-1"' shown={step === 'step-1'} />
          <TreeRow depth={2} label='button-group="step-2"' shown={step === 'step-2'} />
        </div>
      }
    />
  );
}

function MultiSubDemo() {
  const [step, setStep] = useState<'step-1' | BranchId>('step-1');
  const [selected, setSelected] = useState<BranchId | null>(null);
  const [warn, setWarn] = useState(false);

  const reset = () => {
    setStep('step-1');
    setSelected(null);
    setWarn(false);
  };

  const next = () => {
    if (!selected) {
      setWarn(true);
      return;
    }
    setWarn(false);
    setStep(selected);
  };

  return (
    <DemoFrame
      title="Live demo — multi-sub flow (branches)"
      onReset={reset}
      rendered={
        step === 'step-1' ? (
          <>
            <StepBox label='data-form-flow-entry data-form-flow-element="step-1"'>
              <p className="mb-2 text-fd-muted-foreground">Why are you cancelling?</p>
              <div className="space-y-1.5">
                {(Object.keys(BRANCHES) as BranchId[]).map((id) => (
                  <label key={id} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="sf-demo-reason"
                      checked={selected === id}
                      onChange={() => {
                        setSelected(id);
                        setWarn(false);
                      }}
                    />
                    <span>{BRANCHES[id].radio}</span>
                    <Chip>{`value="${id}"`}</Chip>
                  </label>
                ))}
              </div>
            </StepBox>
            <ButtonGroup label='data-form-flow-button-group="step-1"'>
              <DemoButton primary onClick={next}>
                Continue
              </DemoButton>
            </ButtonGroup>
            {warn && (
              <p className="font-mono text-xs text-amber-600 dark:text-amber-400">
                console.warn: no branch radio selected
              </p>
            )}
          </>
        ) : (
          <>
            <StepBox label={`data-form-flow-subflow data-form-flow-element="${step}"`}>
              {BRANCHES[step].content}
            </StepBox>
            <ButtonGroup label={`data-form-flow-button-group="${step}"`}>
              <DemoButton onClick={() => setStep('step-1')}>Go Back</DemoButton>
              <DemoButton primary onClick={reset}>
                Keep my membership
              </DemoButton>
            </ButtonGroup>
          </>
        )
      }
      tree={
        <div>
          <TreeRow depth={0} label='data-form-flow="cancel-membership" type="multi-sub"' shown={null} />
          <TreeRow depth={1} label='entry element="step-1" (radio gate)' shown={step === 'step-1'} />
          <TreeRow depth={2} label='button-group="step-1"' shown={step === 'step-1'} />
          <TreeRow depth={1} label='subflow element="step-2a"' shown={step === 'step-2a'} />
          <TreeRow depth={2} label='button-group="step-2a"' shown={step === 'step-2a'} />
          <TreeRow depth={1} label='subflow element="step-2b"' shown={step === 'step-2b'} />
          <TreeRow depth={2} label='button-group="step-2b"' shown={step === 'step-2b'} />
        </div>
      }
    />
  );
}

export function StepFlowDemo({ variant }: { variant: Variant }) {
  return variant === 'linear' ? <LinearDemo /> : <MultiSubDemo />;
}
