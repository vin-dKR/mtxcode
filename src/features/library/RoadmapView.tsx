import { ArrowLeft, ArrowUpRight, Bookmark, Braces, Check, ChevronDown, CircleAlert, Route, Search, Waypoints } from 'lucide-react';
import { Button, cx } from '../../components/ui';
import { drillCatalog, topicCatalog, type Drill } from '../../core/catalog';
import { languages } from '../../core/languages';
import type { Language, RunRecord, Selection } from '../../types';
import type { RoadmapState } from './roadmapState';

export { initialRoadmapState, type RoadmapState } from './roadmapState';

interface RoadmapProps {
  records: RunRecord[];
  favorites: string[];
  state: RoadmapState;
  onStateChange(state: RoadmapState): void;
  onToggleFavorite(id: string): void;
  onOpen(selection: Selection, language?: Language): void;
  onBack(): void;
}

const tracks = [
  { id: 'language', title: 'Language review', description: 'Practice language fundamentals, runtime patterns, and repairs.', icon: Braces },
  { id: 'algorithm', title: 'Interview & competitive', description: 'Build fluency with problem-solving patterns across languages.', icon: Waypoints },
] as const;

type DrillStatus = 'complete' | 'review' | 'new';

const topicSteps = tracks.map((track) => {
  const drills = drillCatalog.filter((drill) => track.id === 'algorithm' ? drill.track === 'algorithm' : drill.track !== 'algorithm');
  const topics = topicCatalog.flatMap((topic) => {
    const topicDrills = drills.filter((drill) => drill.topic === topic.id);
    return topicDrills.length ? [{ ...topic, drills: topicDrills.sort((a, b) =>
      (a.sourceOrder ?? Number.MAX_SAFE_INTEGER) - (b.sourceOrder ?? Number.MAX_SAFE_INTEGER)) }] : [];
  });
  return { ...track, drills, steps: topics.map((topic, index) => ({ ...topic, number: String(index + 1).padStart(2, '0') })) };
});

function assessRuns(records: RunRecord[], language: Language | '') {
  const latest = new Map<string, { createdAt: number; complete: boolean }>();
  for (const run of records) {
    if (language && run.language !== language) continue;
    const guided = run.mode === 'guided' && !run.range;
    const checked = run.mode === 'repair' || run.mode === 'blind';
    const score = guided ? run.matched : checked ? run.passed : undefined;
    const total = guided ? run.total : run.checks;
    if (typeof score !== 'number' || typeof total !== 'number' || !Number.isFinite(score) || !Number.isFinite(total) || total <= 0) continue;
    const previous = latest.get(run.drillId);
    if (!previous || run.createdAt > previous.createdAt) {
      latest.set(run.drillId, { createdAt: run.createdAt, complete: score === total });
    }
  }
  return (id: string): DrillStatus => {
    const assessment = latest.get(id);
    if (!assessment) return 'new';
    return assessment.complete ? 'complete' : 'review';
  };
}

function ProgressBar({ label, value, total }: { label: string; value: number; total: number }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={Math.max(1, total)}
      aria-valuetext={`${value} of ${total} complete`} className="h-1 overflow-hidden rounded-full bg-line">
      <div className="h-full rounded-full bg-accent" style={{ width: `${total ? value / total * 100 : 0}%` }} />
    </div>
  );
}

function DrillRow({ drill, status, saved, onOpen, onToggle }: {
  drill: Drill;
  status: DrillStatus;
  saved: boolean;
  onOpen(): void;
  onToggle(): void;
}) {
  const detailId = `roadmap-detail-${drill.id}`;
  return (
    <li className="flex min-w-0 items-start gap-1 border-t border-line/70 px-2 py-1 sm:gap-2 sm:px-3">
      <button type="button" aria-label={`Open ${drill.title}`} aria-describedby={detailId} onClick={onOpen}
        className="group/drill grid min-w-0 flex-1 grid-cols-[1.15rem_minmax(0,1fr)_auto] items-start gap-2 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-raised sm:grid-cols-[1.25rem_minmax(0,1fr)_auto] sm:gap-2.5">
        <span className={cx('mt-0.5 grid size-4 place-items-center rounded-full', status === 'complete' && 'bg-success/10 text-success',
          status === 'review' && 'text-warning', status === 'new' && 'border border-line')}>
          {status === 'complete' ? <Check size={11} aria-hidden="true" /> : status === 'review' ? <CircleAlert size={15} aria-hidden="true" /> : null}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold leading-snug text-ink group-hover/drill:text-accent">{drill.title}</span>
          <span id={detailId} className="mt-0.5 block font-mono text-[10px] leading-4 tracking-wide text-muted">
            {drill.level} <span aria-hidden="true">·</span> {drill.languages}
            {status === 'review' ? <span className="text-warning"> <span aria-hidden="true">·</span> Needs review</span> : null}
            {status === 'complete' ? <span className="text-success"> <span aria-hidden="true">·</span> Complete</span> : null}
          </span>
        </span>
        <ArrowUpRight size={15} className="mt-0.5 text-muted group-hover/drill:text-accent" aria-hidden="true" />
      </button>
      <Button variant="ghost" aria-label={saved ? `Remove ${drill.title} from saved drills` : `Save ${drill.title}`} aria-pressed={saved}
        onClick={onToggle} className={cx('mt-1 min-h-9 shrink-0 px-2', saved && 'text-accent')}>
        <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} aria-hidden="true" />
      </Button>
    </li>
  );
}

const selectClass = 'h-10 w-full min-w-0 rounded-lg border border-line bg-surface px-2.5 text-sm text-ink sm:px-3';

export default function RoadmapView({ records, favorites, state, onStateChange, onToggleFavorite, onOpen, onBack }: RoadmapProps) {
  const { track, query, language, statusFilter, expanded } = state;
  const updateState = (changes: Partial<RoadmapState>) => onStateChange({ ...state, ...changes });
  const favoriteIds = new Set(favorites);
  const roadmapStatus = assessRuns(records, '');
  const statusFor = language ? assessRuns(records, language) : roadmapStatus;
  const totalComplete = drillCatalog.filter((drill) => roadmapStatus(drill.id) === 'complete').length;
  const active = topicSteps[track === 'language' ? 0 : 1];
  const searchWords = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const hasDrillFilter = Boolean(searchWords.length || statusFilter !== 'all');
  const steps = active.steps.flatMap((step) => {
    const languageDrills = step.drills.filter((drill) => !language || drill.languageIds.includes(language));
    const matches = languageDrills.filter((drill) => {
      if (statusFilter === 'saved' && !favoriteIds.has(drill.id)) return false;
      if ((statusFilter === 'review' || statusFilter === 'complete') && statusFor(drill.id) !== statusFilter) return false;
      const searchable = `${drill.title} ${drill.detail} ${step.label} ${drill.level} ${drill.languages}`.toLowerCase();
      return searchWords.every((word) => searchable.includes(word));
    });
    return matches.length ? [{
      ...step, matches, total: languageDrills.length, complete: languageDrills.filter((drill) => statusFor(drill.id) === 'complete').length,
    }] : [];
  });
  const matchCount = steps.reduce((sum, step) => sum + step.matches.length, 0);
  const nextStep = steps.find((step) => step.complete < step.total) ?? steps[0];
  const resetFilters = () => updateState({ query: '', language: '', statusFilter: 'all' });

  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl px-4 pb-14 pt-4 sm:px-7 sm:pt-7">
      <section aria-labelledby="roadmap-title" className="relative isolate grid items-end gap-4 overflow-hidden rounded-3xl border border-line bg-surface p-4 sm:p-8 md:grid-cols-[minmax(0,1fr)_15rem] md:gap-7">
        <div className="circuit-grid pointer-events-none absolute inset-0 -z-10 opacity-40" />
        <Button variant="ghost" onClick={onBack} className="absolute right-2.5 top-2.5 min-h-7 px-2 text-xs sm:right-5 sm:top-5">
          <ArrowLeft size={14} aria-hidden="true" /> Back to playground
        </Button>
        <div className="min-w-0">
          <p className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] font-bold tracking-[.16em] text-accent">
            <Route size={15} aria-hidden="true" /> TOPIC MAP
          </p>
          <h1 id="roadmap-title" className="text-[clamp(2.35rem,6vw,4.65rem)] font-extrabold leading-[.95] tracking-[-.05em]">Practice roadmap</h1>
          <p className="mt-2.5 max-w-[52ch] text-sm leading-relaxed text-muted sm:mt-3 sm:text-base">Follow the suggested order or jump to any drill. Your latest scored runs show where to practice next.</p>
        </div>
        <div className="rounded-xl border border-line bg-canvas/90 p-3 sm:p-4">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-semibold tracking-[.12em] text-muted">DRILLS COMPLETE</span>
            <span className="font-mono text-sm font-bold tabular-nums text-ink">{totalComplete}<span className="font-normal text-muted"> / {drillCatalog.length}</span></span>
          </div>
          <ProgressBar label="Roadmap progress" value={totalComplete} total={drillCatalog.length} />
        </div>
      </section>

      <div aria-label="Practice tracks" role="group" className="mt-3 grid grid-cols-2 gap-2.5">
        {topicSteps.map(({ id, title, description, icon: Icon, drills, steps }) => {
          const complete = drills.filter((drill) => roadmapStatus(drill.id) === 'complete').length;
          const selected = id === track;
          return (
            <button key={id} type="button" onClick={() => updateState({ track: id })} aria-pressed={selected} aria-controls="roadmap-results"
              className={cx('group grid min-w-0 content-start gap-x-3 gap-y-2 rounded-2xl border p-3 text-left transition-colors sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-y-3 sm:p-4',
                selected ? 'border-accent/55 bg-accent/8' : 'border-line bg-surface hover:border-accent/35')}>
              <span className={cx('grid size-8 place-items-center rounded-lg border text-accent sm:size-9',
                selected ? 'border-accent/35 bg-accent/15' : 'border-line bg-canvas group-hover:border-accent/35')}>
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="min-w-0 self-center">
                <span className="block text-sm font-bold tracking-tight text-ink sm:text-base">{title}</span>
                <span className="mt-0.5 hidden text-xs leading-4.5 text-muted sm:block">{description}</span>
              </span>
              <span className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 font-mono text-[10px] tabular-nums text-muted sm:col-start-2">
                <span>{steps.length} {steps.length === 1 ? 'step' : 'steps'}</span>
                <span className={cx(selected && 'text-accent')}>{complete}/{drills.length} complete</span>
              </span>
            </button>
          );
        })}
      </div>

      <section id="roadmap-results" aria-labelledby="roadmap-track-heading" className="mt-6 sm:mt-9">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <h2 id="roadmap-track-heading" className="text-2xl font-bold tracking-tight">{active.title}</h2>
          <p role="status" className="font-mono text-[11px] tabular-nums text-muted">{matchCount} {matchCount === 1 ? 'drill' : 'drills'} across {steps.length} {steps.length === 1 ? 'step' : 'steps'}</p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(8.5rem,.29fr)_minmax(8.5rem,.29fr)]">
          <label className="flex h-10 min-w-0 items-center gap-2.5 rounded-lg border border-line bg-surface px-3 text-muted focus-within:border-accent">
            <Search size={16} className="shrink-0" aria-hidden="true" />
            <input type="search" aria-label="Search roadmap drills" value={query} onChange={(event) => updateState({ query: event.currentTarget.value })}
              placeholder="Search drills or topics" className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus-visible:outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:contents">
            <select aria-label="Practice language" className={selectClass} value={language} onChange={(event) => updateState({ language: event.currentTarget.value as Language | '' })}>
              <option value="">All languages</option>
              {languages.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
            </select>
            <select aria-label="Practice status" className={selectClass} value={statusFilter} onChange={(event) => updateState({ statusFilter: event.currentTarget.value as RoadmapState['statusFilter'] })}>
              <option value="all">All statuses</option>
              <option value="review">Needs review</option>
              <option value="saved">Saved drills</option>
              <option value="complete">Completed</option>
            </select>
          </div>
        </div>

        {steps.length ? (
          <ol className="mt-4 grid gap-2.5 sm:gap-3.5">
            {steps.map((step) => {
              const panelId = `roadmap-${track}-${step.id}`;
              const expandKey = `${panelId}/${hasDrillFilter ? 'filtered' : 'all'}`;
              const isOpen = expanded[expandKey] ?? (hasDrillFilter || step.id === nextStep?.id);
              return (
                <li key={step.id} className="group/stage relative grid grid-cols-[1.9rem_minmax(0,1fr)] gap-2 sm:grid-cols-[2.65rem_minmax(0,1fr)] sm:gap-3">
                  <div className="absolute bottom-[-.875rem] left-[.9rem] top-11 w-px bg-line group-last/stage:hidden sm:left-[1.3rem] sm:top-12" aria-hidden="true" />
                  <span className="relative mt-2 grid size-[1.9rem] place-items-center rounded-lg border border-line bg-raised font-mono text-[10px] font-semibold tabular-nums text-accent sm:mt-2.5 sm:size-[2.65rem] sm:rounded-xl sm:text-xs">
                    <span className="sr-only">Step </span>{step.number}
                  </span>
                  <div className="min-w-0 rounded-2xl border border-line bg-surface">
                    <h3>
                      <button type="button" aria-expanded={isOpen} aria-controls={panelId}
                        onClick={() => updateState({ expanded: { ...expanded, [expandKey]: !isOpen } })}
                        className="group/step grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-2 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-raised sm:grid-cols-[minmax(0,1fr)_6.25rem_auto] sm:items-center sm:gap-x-4 sm:px-4 sm:py-3.5">
                        <span className="min-w-0">
                          <span className="block text-sm font-bold tracking-tight text-ink group-hover/step:text-accent sm:text-base">{step.label}</span>
                          <span className="mt-0.5 block text-xs font-normal leading-4.5 text-muted">{step.description}</span>
                        </span>
                        <span className="col-start-1 row-start-2 block min-w-0 sm:col-start-2 sm:row-start-1">
                          <span className="mb-1.5 block font-mono text-[10px] font-normal tabular-nums text-muted">{step.complete}/{step.total} complete</span>
                          <span className="hidden sm:block" aria-hidden="true">
                            <span className="block h-1 overflow-hidden rounded-full bg-line">
                              <span className="block h-full rounded-full bg-accent" style={{ width: `${step.complete / step.total * 100}%` }} />
                            </span>
                          </span>
                        </span>
                        <ChevronDown size={16} aria-hidden="true" className={cx('col-start-2 row-start-1 mt-0.5 text-muted transition-transform sm:col-start-3', isOpen && 'rotate-180 text-accent')} />
                      </button>
                    </h3>
                    <ul id={panelId} hidden={!isOpen}>
                      {isOpen ? step.matches.map((drill) => (
                        <DrillRow key={drill.id} drill={drill} status={statusFor(drill.id)} saved={favoriteIds.has(drill.id)}
                          onOpen={() => onOpen(drill.selection, language || undefined)} onToggle={() => onToggleFavorite(drill.id)} />
                      )) : null}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="mt-4 grid min-h-36 place-content-center justify-items-center gap-2 rounded-2xl border border-dashed border-line p-4 text-center text-sm text-muted">
            <Search size={19} className="text-accent" aria-hidden="true" />
            <p>{!searchWords.length && !language && statusFilter === 'saved' ? 'Save a drill in this track to see it here.' :
              !searchWords.length && !language && statusFilter === 'review' ? 'Drills with incomplete scored runs appear here.' : 'No drills match these filters.'}</p>
            <Button variant="ghost" onClick={resetFilters}>Clear filters</Button>
          </div>
        )}
      </section>
    </main>
  );
}
