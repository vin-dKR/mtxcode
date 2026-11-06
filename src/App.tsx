import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Activity, Keyboard, Map, Palette, Search, Terminal, Waypoints } from 'lucide-react';
import { Button, cx } from './components/ui';
import LandingView from './features/landing/LandingView';
import Finder from './features/library/Finder';
import { initialRoadmapState } from './features/library/roadmapState';
import { openSelection } from './core/catalog';
import { isLanguage } from './core/languages';
import { favoritesKey, historyKey, initialFavorites, initialHistory, initialSettings, settingsKey, validRange } from './core/storage';
import { useStoredState } from './hooks/useStoredState';
import type { Language, LineRange, RunRecord, Selection } from './types';

const Workspace = lazy(() => import('./features/practice/Workspace'));
const HistoryView = lazy(() => import('./features/history/HistoryView'));
const RoadmapView = lazy(() => import('./features/library/RoadmapView'));
const SettingsDialog = lazy(() => import('./features/settings/SettingsDialog'));
const navButton = 'max-[390px]:gap-1 max-[390px]:px-2 max-[390px]:text-xs';

type Route = { page: 'home' | 'library' | 'history' } | { page: 'practice'; selection: Selection; language?: Language; range?: LineRange };
type Modal = 'finder' | 'appearance' | 'keybindings' | null;

function readRoute(): Route {
  const search = new URLSearchParams(window.location.search);
  const drillId = search.get('drill');
  if (drillId) {
    const selection = openSelection(drillId, search.get('mode') === 'blind' ? 'blind' : undefined);
    const language = search.get('lang');
    const range = { start: Number(search.get('start')), end: Number(search.get('end')) };
    if (selection) return {
      page: 'practice',
      selection,
      language: isLanguage(language) ? language : undefined,
      range: selection.kind === 'practice' && selection.mode === 'guided' && validRange(range) ? range : undefined,
    };
  }
  const view = search.get('view');
  return { page: view === 'progress' ? 'history' : view === 'roadmap' ? 'library' : 'home' };
}

function routeUrl(route: Route) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  if (route.page === 'history') url.searchParams.set('view', 'progress');
  if (route.page === 'library') url.searchParams.set('view', 'roadmap');
  if (route.page === 'practice') {
    const { selection, language, range } = route;
    url.searchParams.set('drill', selection.kind === 'practice' ? selection.challenge.id : selection.drill.id);
    if (selection.kind === 'practice' && selection.mode === 'blind') url.searchParams.set('mode', 'blind');
    if (language) url.searchParams.set('lang', language);
    if (range) {
      url.searchParams.set('start', String(range.start));
      url.searchParams.set('end', String(range.end));
    }
  }
  return url;
}

function Loading({ children }: { children: string }) {
  return <div role="status" className="mx-auto mt-12 flex max-w-md items-center justify-center gap-3 rounded-xl border border-line bg-surface px-4 py-6 text-sm text-muted">
    <span className="size-4 animate-spin rounded-full border-2 border-line border-t-accent motion-reduce:animate-none" /> {children}
  </div>;
}

export default function App() {
  const [route, setRoute] = useState(readRoute);
  const [modal, setModal] = useState<Modal>(null);
  const [roadmapState, setRoadmapState] = useState(initialRoadmapState);
  const [settings, setSettings] = useStoredState(settingsKey, initialSettings);
  const [records, setRecords] = useStoredState(historyKey, initialHistory);
  const [favorites, setFavorites] = useStoredState(favoritesKey, initialFavorites);

  useEffect(() => { document.documentElement.dataset.theme = settings.theme; }, [settings.theme]);
  useEffect(() => {
    const onPopState = () => { setRoute(readRoute()); setModal(null); };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  useEffect(() => {
    if (modal) return;
    const onShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k'
          && !document.querySelector('dialog[open]')) {
        event.preventDefault();
        event.stopPropagation();
        setModal('finder');
      }
    };
    document.addEventListener('keydown', onShortcut, true);
    return () => document.removeEventListener('keydown', onShortcut, true);
  }, [modal]);

  const navigate = useCallback((next: Route) => {
    const url = routeUrl(next);
    if (url.href !== window.location.href) window.history.pushState(null, '', url);
    setModal(null);
    setRoute(next);
    window.scrollTo(0, 0);
  }, []);
  const goHome = useCallback(() => navigate({ page: 'home' }), [navigate]);
  const goLibrary = useCallback(() => navigate({ page: 'library' }), [navigate]);
  const openDrill = useCallback((selection: Selection, language?: Language) => navigate({ page: 'practice', selection, language }), [navigate]);
  const reopenDrill = useCallback((id: string, mode: RunRecord['mode'], language: Language, range?: LineRange) => {
    const selection = openSelection(id, mode);
    if (selection) navigate({ page: 'practice', selection, language, range: mode === 'sprint' && validRange(range) ? range : undefined });
  }, [navigate]);
  const onRecord = useCallback((record: RunRecord) => {
    setRecords((current) => [record, ...current.filter(({ id }) => id !== record.id)].slice(0, 200));
  }, [setRecords]);
  const onToggleFavorite = useCallback((id: string) => {
    setFavorites((current) => current.includes(id) ? current.filter((favorite) => favorite !== id) : [...current, id]);
  }, [setFavorites]);
  const onVimChange = useCallback((vim: boolean) => setSettings((current) => ({ ...current, vim })), [setSettings]);
  const showKeybindings = useCallback(() => setModal('keybindings'), []);
  const closeModal = useCallback(() => setModal(null), []);

  return (
    <>
      <header data-app-masthead className="relative z-10 border-b border-line bg-canvas/90">
        <div className="mx-auto flex min-h-15 max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-1 px-4 py-2 sm:px-7">
          <button type="button" onClick={goHome} className="inline-flex items-center gap-2 rounded-lg text-lg font-extrabold tracking-tight" aria-label="Keycraft home">
            <span className="grid size-8 place-items-center rounded-lg border border-accent/25 bg-accent/10 text-accent"><Terminal size={17} /></span>
            keycraft
          </button>
          <nav aria-label="Main navigation" className="order-3 flex w-full justify-center gap-1 sm:order-0 sm:w-auto">
            <Button variant="ghost" className={cx(navButton, route.page === 'home' && 'bg-raised text-accent')} onClick={goHome} aria-current={route.page === 'home' ? 'page' : undefined}>
              <Waypoints size={15} /> Playground
            </Button>
            <Button variant="ghost" className={cx(navButton, (route.page === 'library' || route.page === 'practice') && 'bg-raised text-accent')} onClick={goLibrary} aria-current={route.page === 'library' ? 'page' : undefined}>
              <Map size={15} /> Drill library
            </Button>
            <Button variant="ghost" className={cx(navButton, route.page === 'history' && 'bg-raised text-accent')} onClick={() => navigate({ page: 'history' })} aria-current={route.page === 'history' ? 'page' : undefined}>
              <Activity size={15} /> Progress
            </Button>
          </nav>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Button variant="secondary" onClick={() => setModal('finder')} aria-label="Find a drill" className="px-2 sm:px-3">
              <Search size={15} /><span className="hidden lg:inline">Find a drill</span><kbd className="hidden rounded border border-line px-1 font-mono text-[10px] text-muted lg:inline">Ctrl/⌘ K</kbd>
            </Button>
            <Button variant="ghost" onClick={() => setModal('appearance')} aria-label="Themes and appearance" className="px-2"><Palette size={17} /></Button>
            <Button variant="ghost" onClick={showKeybindings} aria-label="Keybindings" className="px-2"><Keyboard size={18} /></Button>
          </div>
        </div>
      </header>
      <Suspense fallback={<Loading>{route.page === 'practice' ? 'Loading the editor…' : route.page === 'library' ? 'Loading the roadmap…' : 'Loading progress…'}</Loading>}>
        {route.page === 'practice' ? (
          <Workspace key={`${route.selection.kind === 'repair' ? route.selection.drill.id : `${route.selection.challenge.id}:${route.selection.mode}`}:${route.language ?? ''}:${route.range?.start ?? ''}-${route.range?.end ?? ''}`}
            selection={route.selection} initialLanguage={route.language} initialRange={route.range} settings={settings} onVimChange={onVimChange} onBack={goLibrary} onRecord={onRecord} onSettings={showKeybindings} onOpen={openDrill} />
        ) : route.page === 'history' ? (
          <HistoryView records={records} onOpen={reopenDrill} onPractice={goLibrary} />
        ) : route.page === 'library' ? (
          <RoadmapView records={records} favorites={favorites} onToggleFavorite={onToggleFavorite} onOpen={openDrill} onBack={goHome}
            state={roadmapState} onStateChange={setRoadmapState} />
        ) : (
          <LandingView settings={settings} onVimChange={onVimChange} onRecord={onRecord} onSettings={showKeybindings} onLibrary={goLibrary} onOpen={openDrill} />
        )}
      </Suspense>
      {modal === 'finder' ? <Finder onClose={closeModal} onOpen={openDrill} /> : null}
      {modal === 'appearance' || modal === 'keybindings' ? (
        <Suspense fallback={<div role="status" className="fixed bottom-4 right-4 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-muted shadow-lg">Loading settings…</div>}>
          <SettingsDialog key={modal} open onClose={closeModal} settings={settings} onChange={setSettings} initialTab={modal} />
        </Suspense>
      ) : null}
    </>
  );
}
