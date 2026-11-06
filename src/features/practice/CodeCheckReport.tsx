import { ArrowRight, ChevronDown, RotateCcw } from 'lucide-react';
import { Button } from '../../components/ui';
import { getLanguage } from '../../core/languages';
import type { LineRange, PracticeResult } from '../../types';
import { PaceChart } from './PaceChart';

type CodeCheckReportProps = {
  result: PracticeResult;
  onClose(): void;
  onRestart(): void;
  onJump(line: number): void;
  onRepeat(range: LineRange): void;
  onRecall?(): void;
  onNext?(): void;
};

const lineVerdict = { match: 'matched', edit: 'differs', empty: 'blank' };
const lineTone = { match: 'text-accent', edit: 'text-warning', empty: 'text-muted' };
const summaryStyle = 'flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 text-sm font-semibold focus-visible:-outline-offset-2 [&::-webkit-details-marker]:hidden';
const keycap = 'rounded border border-line bg-canvas px-1 py-0.5 font-mono text-[10px] text-ink';

function deletionLabel(deleted: number) {
  return `${deleted} ${deleted === 1 ? 'character' : 'characters'} deleted`;
}

export function CodeCheckReport({ result, onClose, onRestart, onJump, onRepeat, onRecall, onNext }: CodeCheckReportProps) {
  const { record, complete, repeatRange, repeatLine, repeatReason, review, longestGap, ghostNote } = result;
  const splitByLine = new Map(result.lineSplits?.map((split) => [split.line, split]));
  const focus = review?.find(({ line }) => line === repeatLine);
  const focusSplit = repeatLine === undefined ? undefined : splitByLine.get(repeatLine);
  const focusPause = longestGap?.line === repeatLine ? longestGap : undefined;
  const nextDrill = complete && record.mode === 'guided' ? onNext : undefined;
  const recall = complete && record.mode === 'guided' ? onRecall : undefined;
  const hasPace = record.seconds >= 1 && record.inserted > 0;
  const focusSummaries = {
    difference: `Line ${repeatLine} ${focus?.status === 'edit' ? 'needs a match' : 'is unwritten'}.`,
    extra: `Remove extra line ${repeatLine}.`,
    deletions: `Line ${repeatLine} had the most deletions.`,
    pause: `Line ${repeatLine} had the longest pause.`,
    active: `Most active time was spent on line ${repeatLine}.`,
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2 border-b border-line pb-3">
        <div role="group" aria-label="Quick run actions" className="flex flex-wrap items-center gap-2">
          <Button variant="primary" data-dialog-autofocus onClick={onRestart}>
            <RotateCcw size={15} aria-hidden="true" /> Run again
          </Button>
          {nextDrill && (
            <Button onClick={nextDrill}>Next drill <ArrowRight size={15} aria-hidden="true" /></Button>
          )}
          {repeatRange && (
            <Button variant="ghost" onClick={() => onRepeat(repeatRange)}>
              Retry lines {repeatRange.start}–{repeatRange.end}
            </Button>
          )}
          {recall && <Button variant="ghost" onClick={recall}>Recall without reference</Button>}
        </div>
        <p className="flex flex-wrap gap-x-3 gap-y-2 text-xs leading-5 text-muted">
          <span><kbd className={keycap}>Tab</kbd> switch</span>
          <span><kbd className={keycap}>Enter</kbd> select</span>
          <span><kbd className={keycap}>Esc</kbd> back to code</span>
        </p>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.13em] text-muted">
          {record.range ? `Line sprint / ${record.range.start}–${record.range.end}` : 'Code check'}
          <span aria-hidden="true" className="mx-1.5 text-muted">/</span>{getLanguage(record.language).name}
        </p>
        {ghostNote ? <span className="font-mono text-[11px] font-semibold text-accent">{ghostNote}</span> : null}
      </div>

      <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-canvas sm:grid-cols-[1.35fr_1fr_1fr]">
        <div className="col-span-2 flex flex-row-reverse flex-wrap items-baseline justify-between gap-x-2 gap-y-1 border-b border-line bg-accent/5 px-4 py-3.5 sm:col-span-1 sm:flex-col-reverse sm:items-start sm:justify-end sm:border-b-0">
          <dt className="text-xs text-muted">Typing pace</dt>
          <dd className="flex items-baseline gap-2 font-mono">
            <span className="text-4xl font-semibold leading-none tabular-nums tracking-tight text-accent">{hasPace ? record.wpm : '—'}</span>
            <span className="text-xs font-semibold text-muted">WPM</span>
          </dd>
        </div>
        <div className="flex flex-col-reverse justify-center gap-1 px-4 py-3 sm:border-l sm:border-line">
          <dt className="text-xs text-muted">Lines matched</dt>
          <dd className="font-mono text-xl font-semibold tabular-nums text-ink">{record.matched ?? 0}<span className="text-muted"> / </span>{record.total ?? 0}</dd>
        </div>
        <div className="flex flex-col-reverse justify-center gap-1 border-l border-line px-4 py-3">
          <dt className="text-xs text-muted">Elapsed</dt>
          <dd className="font-mono text-xl font-semibold tabular-nums text-ink">{record.seconds.toFixed(1)} <span className="text-sm text-muted">s</span></dd>
        </div>
      </dl>

      {repeatLine !== undefined ? (
        <section aria-label="Run focus" className="rounded-xl border border-line bg-raised/50 px-3.5 pb-3 pt-2">
          <div className="flex min-h-8 flex-wrap items-center justify-between gap-x-3">
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted">Run focus</h3>
            {focus?.editable ? (
              <Button variant="ghost" className="-mr-1 min-h-8 px-2 text-xs" onClick={() => onJump(repeatLine)}>Go to line {repeatLine}</Button>
            ) : null}
          </div>
          <p className="text-sm font-semibold text-ink">{repeatReason ? focusSummaries[repeatReason] : `Line ${repeatLine}`}</p>
          {focusSplit?.seconds || focusSplit?.deleted || focusPause ? (
            <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums text-muted">
              {focusSplit?.seconds ? <li>{focusSplit.seconds.toFixed(1)} s active</li> : null}
              {focusSplit?.deleted ? <li>{deletionLabel(focusSplit.deleted)}</li> : null}
              {focusPause ? <li>{focusPause.seconds.toFixed(1)} s longest pause</li> : null}
            </ul>
          ) : null}
        </section>
      ) : null}

      {longestGap && !focusPause ? (
        <p className="text-xs text-muted"><span className="font-semibold text-ink">{longestGap.seconds.toFixed(1)} s longest pause</span> on line {longestGap.line}.</p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-line bg-canvas">
        <details className="group">
          <summary className={summaryStyle}>
            Pace replay <ChevronDown size={16} aria-hidden="true" className="text-muted group-open:rotate-180" />
          </summary>
          <div className="space-y-2 px-3.5 pb-3.5">
            <PaceChart key={record.id} points={result.points} ghost={result.ghost} />
            <p className="text-xs text-muted">Pace uses five typed characters per word. {hasPace ? '' : 'A pace score needs at least one second and some typing.'}</p>
          </div>
        </details>
        {review?.length ? (
          <details className="group border-t border-line">
            <summary className={summaryStyle}>
              Line breakdown <ChevronDown size={16} aria-hidden="true" className="text-muted group-open:rotate-180" />
            </summary>
            <div className="px-3.5 pb-3.5">
              <p className="mb-2 text-xs text-muted">
                {splitByLine.size ? 'Active time counts gaps under 1.5 s between edits. ' : ''}Select a line to jump back to it.
              </p>
              <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line">
                {review.map(({ line, status, editable }) => {
                  const split = splitByLine.get(line);
                  const verdict = lineVerdict[status];
                  return (
                    <li key={line} className="flex min-h-10 flex-wrap items-center justify-between gap-x-3 gap-y-0.5 px-2.5 py-1">
                      <div className={`flex items-center gap-2 ${lineTone[status]}`}>
                        {editable ? (
                          <button type="button" onClick={() => onJump(line)} aria-label={`Line ${line}, ${verdict}`}
                            className="min-h-8 shrink-0 rounded-sm font-mono text-xs font-semibold hover:underline">Line {line}</button>
                        ) : <span className="shrink-0 font-mono text-xs font-semibold">Line {line}</span>}
                        <span className="text-xs capitalize">{verdict}</span>
                      </div>
                      {split ? <span className="text-right text-xs tabular-nums text-muted">{split.seconds.toFixed(1)} s active · {deletionLabel(split.deleted)}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>
        ) : null}
      </div>

      <Button variant="ghost" onClick={onClose}>Back to code</Button>
    </div>
  );
}
