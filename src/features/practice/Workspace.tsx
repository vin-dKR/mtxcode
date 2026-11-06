import { useEffect, useId, useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { ArrowLeft, BookOpen, ChevronDown, CodeXml, Keyboard, Maximize2, Minimize2, Play, RotateCcw, Save } from 'lucide-react';
import { Badge, Button, cx } from '../../components/ui';
import { nextCodeCheck, topicNames } from '../../core/catalog';
import { getLanguage, isLanguage } from '../../core/languages';
import type { Language, SaveKey, Selection, WorkspaceProps } from '../../types';
import { CodeCheckTrack, CodePeek } from './CodeCheckTrack';
import { ResultDialog } from './ResultDialog';
import { usePractice } from './usePractice';

const modeLabels = { guided: 'Code check', blind: 'Blind' };
const saveLabels: Record<SaveKey, string> = {
    'Mod-s': 'Ctrl/⌘ S',
    'Mod-Enter': 'Ctrl/⌘ Enter',
    'Alt-s': 'Alt S',
};
const saveShortcuts: Record<SaveKey, string> = {
    'Mod-s': 'Control+S Meta+S',
    'Mod-Enter': 'Control+Enter Meta+Enter',
    'Alt-s': 'Alt+S',
};
const control = 'min-h-9 rounded-lg border border-line bg-raised px-2.5 text-sm font-semibold text-ink';
const micro = 'font-mono text-[10px] font-semibold tracking-[0.13em] uppercase';
type LiveStore = ReturnType<typeof usePractice>['live'];

function EditorStatus({
    live, saveKey, repair, guided, onSubmit, onChecks,
}: { live: LiveStore; saveKey: SaveKey; repair: boolean; guided: boolean; onSubmit(): void; onChecks?: () => void }) {
    const { line, vim, status, pending, ghost } = useSyncExternalStore(live.subscribe, live.getSnapshot);
    return (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line bg-raised/75 px-3 py-2 sm:px-4">
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px] text-muted">
                <Badge className={cx(vim !== 'off' && 'border-accent/35 bg-accent/10 text-accent')}>{vim === 'off' ? 'STANDARD' : vim === 'normal' ? 'VIM NORMAL · i TO INSERT' : vim.toUpperCase()}</Badge>
                {!guided && <span>Ln {line}</span>}
                <span className="hidden sm:inline">Spaces 4</span>
                {!guided && ghost && <span className="text-accent">{ghost}</span>}
            </div>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
                {(!guided || status === 'Write some code first') && <span className="font-mono text-[11px] text-muted">{status}</span>}
                <span className="sr-only" role="status">{pending || status === 'Write some code first' ? status : ''}</span>
                {onChecks && (
                    <Button variant="secondary" onClick={onChecks} disabled={pending} aria-busy={pending}>
                        <Play size={13} aria-hidden="true" /> Run checks
                    </Button>
                )}
                <Button variant="primary" onClick={onSubmit} disabled={pending} aria-busy={pending}
                    aria-keyshortcuts={saveShortcuts[saveKey]}>
                    {repair ? <Play size={13} aria-hidden="true" /> : <Save size={13} aria-hidden="true" />}
                    {repair ? 'Run checks' : guided ? 'Finish run' : 'Save & score'}
                    <kbd aria-hidden="true" className="hidden rounded-md border border-current/20 px-1.5 py-0.5 text-[10px] font-normal sm:inline">
                        {saveLabels[saveKey]}
                    </kbd>
                </Button>
            </div>
        </div>
    );
}

export default function Workspace(props: WorkspaceProps & { onOpen(selection: Selection, language?: Language): void }) {
    const { selection, settings, onBack, onSettings, onVimChange, onOpen } = props;
    const {
        editor, host, heading, live, location, availableLanguages, result, referenceOpen, setReferenceOpen,
        closeResult, switchRun, submit, jumpToLine, canRunChecks, runChecks,
    } = usePractice(props);
    const [focused, setFocused] = useState(false);
    const headingId = useId();
    const isRepair = selection.kind === 'repair';
    const drill = isRepair ? selection.drill : selection.challenge;
    const topic = topicNames.get(drill.topic) ?? (isRepair ? 'Repair Lab' : 'Drills');
    const { mode, language, range } = location;
    const guided = mode === 'guided' && selection.kind === 'practice';
    const source = selection.kind === 'practice' && guided ? selection.challenge.solutions[language] : undefined;
    const referenceLines = useMemo(() => {
        const all = source?.split('\n') ?? [];
        return range ? all.slice(range.start - 1, range.end) : all;
    }, [source, range]);
    const offset = range ? range.start - 1 : 0;
    const next = guided && !range ? nextCodeCheck(drill.id, language) : undefined;
    const editorHeight = guided && !focused ? Math.min(360, Math.max(176, 52 + referenceLines.length * 22)) : undefined;

    useLayoutEffect(() => {
        editor.current?.setInlineReference(guided ? referenceLines : null);
    }, [editor, guided, referenceLines]);

    useEffect(() => {
        if (guided && window.matchMedia('(pointer: fine)').matches) editor.current?.focus();
    }, [editor, guided]);

    useEffect(() => {
        if (!focused) return;
        document.body.dataset.keycraftFocus = 'true';
        return () => { delete document.body.dataset.keycraftFocus; };
    }, [focused]);

    const problem = (
        <details key={mode} hidden={focused} open={mode !== 'guided'} className={cx('group rounded-xl border border-line bg-surface', guided ? 'mt-3' : 'mb-4')}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold sm:px-4 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2.5"><BookOpen size={15} className="text-accent" aria-hidden="true" /> {guided ? 'Drill context' : 'Problem'}</span>
                <ChevronDown size={14} className="text-muted transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="border-t border-line px-3 py-3.5 text-sm leading-relaxed text-muted sm:px-4">
                <p>{drill.prompt}</p>
                {selection.kind === 'practice' && <p className="mt-2 rounded-md bg-raised px-3 py-2 font-mono text-xs leading-relaxed">{selection.challenge.example}</p>}
                {selection.kind === 'practice' && selection.challenge.sourceUrl && (
                    <a href={selection.challenge.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-accent underline underline-offset-2">
                        Original exercise on Notion
                    </a>
                )}
            </div>
        </details>
    );

    return (
        <section aria-labelledby={headingId} className={cx('mx-auto w-full min-w-0 max-w-6xl px-4 pb-12 sm:px-7', focused ? 'pt-4' : 'pt-6 sm:pt-8')}>
            {!focused && (
                <div className="mb-3 flex flex-wrap items-center gap-2.5">
                    <Button variant="ghost" className="-ml-2" onClick={onBack}>
                        <ArrowLeft size={15} aria-hidden="true" /> Back to drills
                    </Button>
                    <span aria-hidden="true" className="text-line">/</span>
                    <span className={cx(micro, 'text-muted')}>{topic}</span>
                    {isRepair
                        ? <Badge className="border-warning/30 bg-warning/10 text-warning">REPAIR</Badge>
                        : <Badge className={selection.challenge.difficulty === 'Hard' ? 'border-warning/30 text-warning' : ''}>{selection.challenge.difficulty.toUpperCase()}</Badge>}
                </div>
            )}

            <header className={cx('mb-4 flex flex-wrap items-end justify-between gap-4', focused && 'justify-end')}>
                <div className={focused ? 'sr-only' : undefined}>
                    <p className={cx(micro, 'mb-1.5 text-accent')}>{range ? `Line sprint · ${range.start}–${range.end}` : isRepair ? 'Repair lab' : guided ? 'Code check' : 'Blind run'}</p>
                    <h1 id={headingId} ref={heading} tabIndex={-1} className="text-2xl leading-[1.07] font-semibold tracking-[-0.045em] outline-none sm:text-[34px]">{drill.title}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {!focused && !isRepair && (
                        <div role="group" aria-label="Practice mode" className="flex gap-0.5 rounded-lg border border-line bg-canvas p-0.5">
                            {(['guided', 'blind'] as const).map((choice) => (
                                <button key={choice} type="button" aria-pressed={mode === choice}
                                    onClick={() => { if (mode !== choice) switchRun({ mode: choice, language, range: null }); }}
                                    className={cx('min-h-8 rounded-md px-2.5 text-sm font-semibold', mode === choice ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-raised hover:text-ink')}>
                                    {modeLabels[choice]}
                                </button>
                            ))}
                        </div>
                    )}
                    {!focused && (
                        <select aria-label="Language" className={control} value={language}
                            onChange={(event) => {
                                const next = event.currentTarget.value;
                                if (isLanguage(next)) switchRun({ mode, range: null, language: next });
                            }}>
                            {availableLanguages.map((id) => <option key={id} value={id}>{getLanguage(id).name}</option>)}
                        </select>
                    )}
                    {range && <Button onClick={() => switchRun({ mode, language, range: null })}>Full drill</Button>}
                    <Button onClick={() => { setFocused(!focused); editor.current?.focus(); }} aria-pressed={focused}>
                        {focused ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}
                        {focused ? 'Exit focus' : 'Focus'}
                    </Button>
                </div>
            </header>

            {!guided && problem}

            <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-[0_18px_45px_-30px_var(--app-shadow)]">
                {guided && <CodeCheckTrack live={live} lines={referenceLines} offset={offset} />}
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-line bg-raised/60 px-3 py-1.5 sm:px-4">
                    <div className="flex items-center gap-2.5 font-mono text-xs text-ink">
                        <span className="grid size-7 place-items-center rounded-md border border-accent/20 bg-accent/10 text-accent"><CodeXml size={16} aria-hidden="true" /></span>
                        solution.{getLanguage(language).extension}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {guided && (
                            <>
                                <Button variant="ghost" className="min-h-8 px-2 text-xs" aria-haspopup="dialog"
                                    onClick={() => setReferenceOpen(true)}>Peek at code</Button>
                                <Button variant="ghost" className="min-h-8 px-2" aria-label="Restart run"
                                    title="Restart run" onClick={() => switchRun(location, true)}><RotateCcw size={14} /></Button>
                            </>
                        )}
                        <select aria-label="Keymap" value={settings.vim ? 'vim' : 'standard'} className={cx(control, 'min-h-8 px-2 text-xs')}
                            onChange={(event) => { onVimChange(event.target.value === 'vim'); editor.current?.focus(); }}>
                            <option value="standard">Standard</option>
                            <option value="vim">Vim</option>
                        </select>
                        <Button variant="ghost" className="min-h-8 px-2" aria-label="Keybindings" title="Keybindings" onClick={onSettings}>
                            <Keyboard size={16} aria-hidden="true" />
                        </Button>
                    </div>
                </div>

                <div ref={host} style={editorHeight ? { height: editorHeight } : undefined}
                    className={cx('min-w-0', focused ? 'h-[clamp(260px,58dvh,680px)]' : 'h-[clamp(290px,48dvh,560px)]')} />
                <EditorStatus live={live} saveKey={settings.saveKey} repair={isRepair} guided={guided} onSubmit={() => { void submit(); }}
                    onChecks={mode === 'blind' && canRunChecks ? () => { void runChecks(); } : undefined} />
            </div>

            {!focused && (
                <p className="mt-3 text-xs leading-relaxed text-muted">
                    {isRepair ? 'Patch the starter, then run the behavior checks. You can run the broken baseline first.'
                        : guided ? 'Start typing to start the clock. Match the code to finish, or end the run early.'
                        : 'Write from memory. Save to see your speed and replay your typing.'}
                    {mode === 'blind' && canRunChecks && ' Run checks to see how your solution handles the test cases.'}
                </p>
            )}
            {guided && problem}
            {guided && <CodePeek lines={referenceLines} open={referenceOpen} onClose={() => { setReferenceOpen(false); window.requestAnimationFrame(() => editor.current?.focus()); }} />}
            <ResultDialog result={result} onClose={() => closeResult()} onJump={jumpToLine}
                onRestart={() => switchRun(location, true)}
                onRepeat={(nextRange) => switchRun({ mode: 'guided', language, range: nextRange }, true)}
                onRecall={() => switchRun({ mode: 'blind', language, range: null }, true)}
                onNext={next ? () => onOpen(next, language) : undefined} />
        </section>
    );
}
