import { lazy, Suspense } from 'react';
import { ArrowUpRight, ChevronDown, Map, ScanLine } from 'lucide-react';
import { Badge, Button } from '../../components/ui';
import { dailyCircuit, openSelection } from '../../core/catalog';
import type { Language, RunRecord, Selection, Settings } from '../../types';

const Playground = lazy(() => import('./Playground'));

interface LandingViewProps {
  settings: Settings;
  onVimChange(vim: boolean): void;
  onRecord(record: RunRecord): void;
  onSettings(): void;
  onLibrary(): void;
  onOpen(selection: Selection, language?: Language): void;
}

export default function LandingView({ settings, onVimChange, onRecord, onSettings, onLibrary, onOpen }: LandingViewProps) {
  const circuit = dailyCircuit();
  const featured = openSelection(circuit.practice);
  if (!featured || featured.kind !== 'practice') return null;
  const challenge = featured.challenge;
  return (
    <main id="main-content" className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 sm:px-7 sm:pt-9">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1.5 inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-accent"><ScanLine size={13} aria-hidden="true" /> Daily code check</p>
          <h1 className="text-[clamp(1.8rem,5vw,3.1rem)] font-bold leading-[1.02] tracking-[-.06em]">{challenge.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="hidden sm:inline-flex">{circuit.topic}</Badge>
          <Button variant="ghost" onClick={onLibrary} className="px-2 text-xs"><Map size={14} /> Drill library</Button>
        </div>
      </header>
      <Suspense fallback={<div role="status" className="grid min-h-[330px] place-content-center rounded-2xl border border-line bg-surface text-sm text-muted">Loading the code check…</div>}>
        <Playground key={challenge.id} selection={featured} settings={settings} onVimChange={onVimChange} onRecord={onRecord} onSettings={onSettings}
          onBack={onLibrary} onOpen={onOpen} onRecall={() => onOpen({ ...featured, mode: 'blind' })} />
      </Suspense>
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-xs text-muted">Type to start the clock. Match the code to finish, or end the run early.</p>
        <Button variant="ghost" onClick={() => onOpen({ ...featured, mode: 'blind' })} className="min-h-8 px-2 text-xs">Try from memory <ArrowUpRight size={13} /></Button>
      </div>
      <details className="group mt-2 rounded-xl border border-line bg-surface/70">
        <summary className="flex min-h-9 list-none items-center justify-between gap-3 px-3 text-xs font-semibold text-muted [&::-webkit-details-marker]:hidden">
          Drill context <ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="border-t border-line px-3 py-3 text-sm leading-relaxed text-muted">
          <p>{challenge.prompt}</p>
          <p className="mt-2 font-mono text-xs">{challenge.example}</p>
        </div>
      </details>
    </main>
  );
}
