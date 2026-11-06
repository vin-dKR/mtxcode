import { useSyncExternalStore } from 'react';
import { Activity } from 'lucide-react';
import { cx, Dialog } from '../../components/ui';
import type { usePractice } from './usePractice';

type LiveStore = ReturnType<typeof usePractice>['live'];

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

export function CodeCheckTrack({ live, lines, offset = 0 }: { live: LiveStore; lines: readonly string[]; offset?: number }) {
  const { phase, seconds, wpm, matched, total, line, lines: verdicts, ghost } = useSyncExternalStore(live.subscribe, live.getSnapshot);
  const ready = phase === 'ready';
  const finished = phase === 'finished';
  const caption = ready ? 'Ready' : finished ? 'Run saved' : 'In motion';
  const pace = seconds > 0 || finished ? wpm : '—';
  const lineCount = total || lines.filter((text) => text.trim()).length;

  return (
    <div className="border-b border-line bg-canvas/60">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3.5 sm:px-6">
        <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[.12em]',
          ready ? 'border-line text-muted' : 'border-accent/30 bg-accent/10 text-accent')}>
          <Activity size={12} aria-hidden="true" /> {caption}
        </span>
        {ghost ? <span className="font-mono text-[10px] text-accent">{ghost}</span> : null}
      </div>
      <dl className="grid grid-cols-3 px-4 py-3 sm:px-6">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[.12em] text-muted">Pace</dt>
          <dd className="mt-0.5 font-mono text-[clamp(1.35rem,4vw,1.9rem)] font-semibold leading-none tabular-nums text-accent">
            {pace}<span className="ml-1 text-[10px] font-normal text-muted">WPM</span>
          </dd>
        </div>
        <div className="border-l border-line pl-3 sm:pl-5">
          <dt className="font-mono text-[10px] uppercase tracking-[.12em] text-muted">Clock</dt>
          <dd className="mt-0.5 font-mono text-[clamp(1.35rem,4vw,1.9rem)] font-semibold leading-none tabular-nums">{clock(seconds)}</dd>
        </div>
        <div className="border-l border-line pl-3 sm:pl-5">
          <dt className="font-mono text-[10px] uppercase tracking-[.12em] text-muted">Matched</dt>
          <dd className="mt-0.5 font-mono text-[clamp(1.35rem,4vw,1.9rem)] font-semibold leading-none tabular-nums">
            {matched}<span className="ml-1 text-xs font-normal text-muted">/ {lineCount}</span>
          </dd>
        </div>
      </dl>
      <div className="flex items-center gap-3 border-t border-line px-4 py-2.5 sm:px-6">
        <div aria-hidden="true" className={cx('flex min-w-0 flex-1', lines.length > 28 ? 'gap-0.5' : 'gap-1')}>
          {lines.map((text, index) => (
            <span key={index} title={`Line ${offset + index + 1}`}
              className={cx('h-1.5 min-w-0 flex-1 rounded-full transition-colors motion-reduce:transition-none',
                verdicts[index] === 'match' ? 'bg-success' : verdicts[index] === 'edit' && index + 1 < line ? 'bg-warning' : 'bg-line',
                !text.trim() && 'opacity-35', index + 1 === line && !finished && 'outline outline-1 outline-offset-1 outline-accent/70')} />
          ))}
        </div>
        <span className="shrink-0 font-mono text-[10px] text-muted">LN {line + offset}</span>
      </div>
    </div>
  );
}

export function CodePeek({ lines, open, onClose }: { lines: readonly string[]; open: boolean; onClose(): void }) {
  return (
    <Dialog open={open} onClose={onClose} title="Reference code">
      <pre className="max-h-[55dvh] overflow-auto rounded-lg border border-line bg-canvas p-4 text-xs leading-relaxed"><code>{lines.join('\n')}</code></pre>
    </Dialog>
  );
}
