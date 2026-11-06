import { Activity, ArrowRight, CalendarDays, Clock3, Gauge, History, Layers3, TrendingUp } from 'lucide-react';
import { useId, useState } from 'react';
import { Badge, Button } from '../../components/ui';
import { getLanguage, isLanguage, languages } from '../../core/languages';
import type { LineRange, RunRecord } from '../../types';

type HistoryViewProps = {
  records: RunRecord[];
  onOpen(drillId: string, mode: RunRecord['mode'], language: RunRecord['language'], range?: LineRange): void;
  onPractice(): void;
};

const modeLabels: Record<RunRecord['mode'], string> = {
  guided: 'Guided',
  blind: 'Blind',
  repair: 'Repair',
  sprint: 'Sprint',
};
const fullDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
const shortDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });
const numberFormat = new Intl.NumberFormat();
const selectClass = 'min-h-9 rounded-lg border border-line bg-raised px-2.5 text-sm text-ink';

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes >= 60) return `${Math.floor(minutes / 60)} h ${minutes % 60} m`;
  return `${minutes} m ${Math.floor(seconds % 60)} s`;
}

function dateKey(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function ActivityChart({ records }: { records: RunRecord[] }) {
  const today = new Date();
  const dailyRuns = new Map<number, number>();
  for (const record of records) {
    const day = dateKey(new Date(record.createdAt));
    dailyRuns.set(day, (dailyRuns.get(day) ?? 0) + 1);
  }
  const days = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (13 - index));
    return { date, count: dailyRuns.get(date.getTime()) ?? 0 };
  });
  const peak = Math.max(1, ...days.map(day => day.count));
  const activeDays = days.filter(day => day.count > 0).length;

  return (
    <section aria-label="Practice activity" className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="mb-5 flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-ink"><CalendarDays size={17} className="text-accent" aria-hidden="true" /> Practice activity</h2>
          <p className="mt-1 text-sm text-muted">Runs per day over the last two weeks.</p>
        </div>
        <Badge className="shrink-0">{activeDays} active {activeDays === 1 ? 'day' : 'days'}</Badge>
      </div>
      <ul className="mt-auto flex h-[108px] items-stretch gap-1.5 border-b border-line sm:gap-2" aria-label="Daily run totals">
        {days.map(({ date, count }) => (
          <li
            key={date.getTime()}
            className="flex min-w-0 flex-1 items-end"
            title={`${shortDate.format(date)} · ${count} ${count === 1 ? 'run' : 'runs'}`}
          >
            <span className="sr-only">{fullDate.format(date)}, {count} {count === 1 ? 'run' : 'runs'}</span>
            <span
              aria-hidden="true"
              className={`block w-full rounded-t-sm ${count ? 'bg-accent/70' : 'bg-line'}`}
              style={{ height: count ? `${Math.max(5, (count / peak) * 100)}%` : '2px' }}
            />
          </li>
        ))}
      </ul>
      <div aria-hidden="true" className="mt-2 flex justify-between font-mono text-[11px] text-muted">
        <span>{shortDate.format(days[0].date)}</span><span>Today</span>
      </div>
    </section>
  );
}

function SpeedChart({ records }: { records: RunRecord[] }) {
  const gradientId = useId();
  const runs = records.slice(0, 12).reverse();
  const scale = Math.max(20, Math.ceil(Math.max(...runs.map(run => run.wpm)) / 20) * 20);
  const left = 38;
  const right = 365;
  const top = 13;
  const bottom = 101;
  const x = (index: number) => runs.length === 1 ? (left + right) / 2 : left + index * (right - left) / (runs.length - 1);
  const y = (wpm: number) => bottom - wpm * (bottom - top) / scale;
  const path = runs.map((run, index) => `${index ? 'L' : 'M'} ${x(index).toFixed(1)} ${y(run.wpm).toFixed(1)}`).join(' ');

  return (
    <section aria-label="Recent speed" className="flex min-w-0 flex-col rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-ink"><TrendingUp size={17} className="text-accent" aria-hidden="true" /> Recent speed</h2>
          <p className="mt-1 text-sm text-muted">WPM for your {runs.length === 1 ? 'latest run' : `last ${runs.length} runs`}.</p>
        </div>
        <Badge className="shrink-0">{runs.at(-1)?.wpm} WPM latest</Badge>
      </div>
      <div className="mt-auto">
        <svg viewBox="0 0 375 131" aria-hidden="true" className="h-[132px] w-full overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity=".26" className="text-accent" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" className="text-accent" />
            </linearGradient>
          </defs>
          {[scale, scale / 2, 0].map(value => (
            <g key={value}>
              <line x1={left} x2={right} y1={y(value)} y2={y(value)} stroke="currentColor" className="text-line" />
              <text x={left - 7} y={y(value) + 4} textAnchor="end" fill="currentColor" className="font-mono text-[12px] text-muted">{value}</text>
            </g>
          ))}
          {runs.length > 1 ? <path d={`${path} L ${right} ${bottom} L ${left} ${bottom} Z`} fill={`url(#${gradientId})`} /> : null}
          <path d={path} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" className="text-accent" />
          {runs.map((run, index) => (
            <circle key={run.id} cx={x(index)} cy={y(run.wpm)} r={index === runs.length - 1 ? 4.5 : 3} fill="currentColor" className="text-accent">
              <title>{run.title} · {run.wpm} WPM</title>
            </circle>
          ))}
          <text x={left} y={123} fill="currentColor" className="font-mono text-[11px] text-muted">{shortDate.format(runs[0].createdAt)}</text>
          {runs.length > 1 ? (
            <text x={right} y={123} textAnchor="end" fill="currentColor" className="font-mono text-[11px] text-muted">Latest run</text>
          ) : null}
        </svg>
        <ol className="sr-only" aria-label="Recorded speeds, oldest first">
          {runs.map(run => <li key={run.id}>{run.title}, {fullDate.format(run.createdAt)}, {run.wpm} WPM</li>)}
        </ol>
      </div>
    </section>
  );
}

function outcome(record: RunRecord) {
  if (record.checks !== undefined) return `${record.passed ?? 0}/${record.checks} checks`;
  if (record.total !== undefined) return `${record.matched ?? 0}/${record.total} lines`;
  return '—';
}

export default function HistoryView({ records, onOpen, onPractice }: HistoryViewProps) {
  const [mode, setMode] = useState<RunRecord['mode'] | 'all'>('all');
  const [language, setLanguage] = useState<RunRecord['language'] | 'all'>('all');
  const ordered = records.slice().sort((first, second) => second.createdAt - first.createdAt);
  const visible = ordered.filter(record => (mode === 'all' || mode === record.mode) && (language === 'all' || language === record.language));

  const metrics = [
    { label: 'Recorded runs', value: numberFormat.format(records.length), icon: Activity },
    { label: 'Best speed', value: `${numberFormat.format(records.reduce((best, record) => Math.max(best, record.wpm), 0))} WPM`, icon: Gauge },
    { label: 'Practice time', value: formatDuration(records.reduce((time, record) => time + record.seconds, 0)), icon: Clock3 },
    { label: 'Drills tried', value: numberFormat.format(new Set(records.map(record => record.drillId)).size), icon: Layers3 },
  ];

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-4 pb-12 pt-9 sm:px-7 sm:pt-14">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        <div>
          <p className="mb-2.5 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <History size={14} aria-hidden="true" /> Practice dashboard
          </p>
          <h1 className="text-[clamp(2.4rem,6vw,4rem)] font-bold leading-[1.04] tracking-[-0.06em] text-ink">Session history</h1>
          <p className="mt-2.5 text-sm text-muted sm:text-[1rem]">Review your runs and see how often you practice.</p>
        </div>
        {records.length ? <Button onClick={onPractice} variant="secondary">Browse drills <ArrowRight size={15} aria-hidden="true" /></Button> : null}
      </div>

      {records.length ? (
        <div className="space-y-5">
          <dl className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3.5" aria-label="All saved runs">
            {metrics.map(({ label, value, icon: Icon }) => (
              <div key={label} className="min-w-0 rounded-xl border border-line bg-surface p-3.5 sm:p-4">
                <dt className="flex items-center gap-1.5 text-xs text-muted sm:gap-2 sm:text-sm"><Icon size={15} className="shrink-0 text-accent" aria-hidden="true" /> {label}</dt>
                <dd className="mt-2 break-words font-mono text-[clamp(1.125rem,3vw,1.5rem)] font-semibold tracking-tight text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="grid gap-3.5 lg:grid-cols-2">
            <ActivityChart records={ordered} />
            <SpeedChart records={ordered} />
          </div>

          <section aria-label="Recent sessions" className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4 sm:px-5">
              <div>
                <h2 className="font-semibold text-ink">Recent sessions</h2>
                <p className="mt-0.5 text-sm text-muted" role="status">{visible.length} of {records.length} runs</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label>
                  <span className="sr-only">Filter by mode</span>
                  <select className={selectClass} value={mode} onChange={event => setMode(event.currentTarget.value as typeof mode)}>
                    <option value="all">All modes</option>
                    {Object.entries(modeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                  </select>
                </label>
                <label>
                  <span className="sr-only">Filter by language</span>
                  <select className={selectClass} value={language} onChange={event => {
                    const next = event.currentTarget.value;
                    if (next === 'all' || isLanguage(next)) setLanguage(next);
                  }}>
                    <option value="all">All languages</option>
                    {languages.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {visible.length ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-raised font-mono text-[11px] uppercase tracking-wider text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium sm:px-5">Drill</th>
                    <th scope="col" className="hidden px-3 py-2.5 font-medium md:table-cell">Mode</th>
                    <th scope="col" className="hidden px-3 py-2.5 font-medium sm:table-cell">Date</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">WPM</th>
                    <th scope="col" className="hidden px-3 py-2.5 text-right font-medium md:table-cell">Time</th>
                    <th scope="col" className="hidden px-5 py-2.5 text-right font-medium lg:table-cell">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.map(record => (
                    <tr key={record.id}>
                      <th scope="row" className="px-4 py-3 font-normal sm:px-5">
                        <button
                          type="button"
                          className="inline-flex max-w-full items-center gap-1.5 text-left font-medium text-ink hover:text-accent"
                          title={`Practice ${record.title} again`}
                          onClick={() => onOpen(record.drillId, record.mode, record.language, record.range)}
                        >
                          {record.title}<ArrowRight size={14} className="shrink-0 text-accent" aria-hidden="true" />
                        </button>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {getLanguage(record.language).name}<span className="md:hidden"> · {modeLabels[record.mode]}</span>
                          {record.range ? <span> · Lines {record.range.start}–{record.range.end}</span> : null}
                          <span className="sm:hidden"> · {shortDate.format(record.createdAt)}</span>
                        </p>
                      </th>
                      <td className="hidden px-3 py-3 md:table-cell"><Badge>{modeLabels[record.mode]}</Badge></td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-muted sm:table-cell">{fullDate.format(record.createdAt)}</td>
                      <td className="px-3 py-3 text-right font-mono tabular-nums text-ink">{record.wpm}</td>
                      <td className="hidden whitespace-nowrap px-3 py-3 text-right font-mono tabular-nums text-muted md:table-cell">{formatDuration(record.seconds)}</td>
                      <td className="hidden whitespace-nowrap px-5 py-3 text-right text-muted lg:table-cell">{outcome(record)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
                <p className="text-sm text-muted">No runs match these filters.</p>
                <Button variant="secondary" onClick={() => { setMode('all'); setLanguage('all'); }}>Clear filters</Button>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="grid min-h-[300px] place-content-center justify-items-center rounded-2xl border border-dashed border-line bg-surface px-5 py-10 text-center">
          <span className="mb-4 grid size-12 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent"><Activity size={23} aria-hidden="true" /></span>
          <h2 className="text-lg font-semibold text-ink">No sessions yet</h2>
          <p className="mb-5 mt-1.5 max-w-[38ch] text-sm text-muted">Submit a practice run to see your speed, practice time, and drill results here.</p>
          <Button onClick={onPractice} variant="primary">Browse drills <ArrowRight size={15} aria-hidden="true" /></Button>
        </div>
      )}
    </main>
  );
}
