import { Button, Dialog } from '../../components/ui';
import type { PracticeResult } from '../../types';
import { CodeCheckReport } from './CodeCheckReport';
import { PaceChart } from './PaceChart';

type ResultDialogProps = {
  result: PracticeResult | null;
  onClose(): void;
  onRestart(): void;
  onJump(line: number): void;
  onRepeat(range: { start: number; end: number }): void;
  onRecall?(): void;
  onNext?(): void;
};

export function ResultDialog({ result, ...actions }: ResultDialogProps) {
  const record = result?.record;
  const { onClose, onRestart } = actions;
  const codeCheck = record?.mode === 'guided' || record?.mode === 'sprint';
  const title = codeCheck ? 'Run report' : record?.mode === 'repair' ? 'Repair results' : result?.checks ? 'Solution checks' : 'Session stats';

  return (
    <Dialog open={Boolean(result)} onClose={onClose} title={title} description={record?.title} className="sm:max-w-[700px]">
      {result && codeCheck ? <CodeCheckReport result={result} {...actions} /> : result && record ? (
        <div className="space-y-5">
          <div>
            <p className="mb-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.13em] text-accent">
              {record.mode} <span aria-hidden="true" className="mx-1 text-muted">/</span> {record.language}
            </p>
            <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-canvas sm:grid-cols-4">
              {[
                [record.wpm, 'WPM'],
                [`${record.seconds.toFixed(1)} s`, 'Elapsed'],
                [record.inserted, 'Inserted chars'],
                [record.deleted, 'Deleted chars'],
              ].map(([value, label], index) => (
                <div key={label} className={`flex flex-col-reverse gap-1 border-line px-3.5 py-3 sm:px-4 ${index % 2 ? 'border-l' : ''} ${index > 1 ? 'border-t sm:border-l sm:border-t-0' : ''}`}>
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="font-mono text-[clamp(1.125rem,4.4vw,1.625rem)] font-semibold tracking-tight text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 text-sm text-muted">
              {record.checks !== undefined
                ? `${record.passed ?? 0} of ${record.checks} checks passed. Elapsed time ends at submission.`
                : record.total !== undefined
                  ? `${record.matched ?? 0} of ${record.total} reference lines matched. The comparison ignores outer whitespace.`
                  : 'WPM uses five typed characters per word and excludes pasted text.'}
            </p>
          </div>

          {result.checks?.length ? (
            <section aria-label="Behavior checks">
              <h3 className="mb-2 text-sm font-semibold text-ink">Behavior checks</h3>
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-canvas">
                {result.checks.map((check, index) => (
                  <li key={`${check.name}-${index}`} className="flex items-start gap-3 px-3.5 py-2.5">
                    <span className={`mt-0.5 w-8 shrink-0 font-mono text-[11px] font-semibold uppercase ${check.passed ? 'text-accent' : 'text-warning'}`}>
                      {check.passed ? 'Pass' : 'Fail'}
                    </span>
                    <div className="min-w-0 break-words text-sm">
                      <p className="text-ink">{check.name}</p>
                      {check.message ? <p className="mt-0.5 text-xs text-muted">{check.message}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section aria-label="Pace replay">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="text-sm font-semibold text-ink">Pace replay</h3>
              {result.ghostNote ? <span className="font-mono text-[11px] uppercase tracking-wider text-accent">{result.ghostNote}</span> : null}
            </div>
            <PaceChart key={record.id} points={result.points} ghost={result.ghost} />
          </section>

          {result.longestGap && result.longestGap.seconds >= 1.5 ? (
            <p className="rounded-lg border border-line bg-raised px-3.5 py-2.5 text-sm text-muted">
              <span className="font-medium text-ink">Longest pause</span>
              <span aria-hidden="true" className="mx-2">·</span>
              {result.longestGap.seconds.toFixed(1)} s between edits around line {result.longestGap.line}.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={onRestart}>New attempt</Button>
            <Button variant="primary" onClick={onClose}>Back to code</Button>
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}
