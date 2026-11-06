import { useLayoutEffect, useRef, useState } from 'react';
import { mountEditor, setVimMappings } from '../../core/editor';
import { defaultLanguage, repairLanguages, repairStarterLanguages, solutionLanguages } from '../../core/languages';
import { compareLines, type SessionStats } from '../../core/scoring';
import type { Language, LineRange, PracticeResult, RunRecord, WorkspaceProps } from '../../types';
import { loadDraft, minimumPauseSeconds, recordEdit, recordPoint, resetScoring, runKey, saveBest, type Run, type RunMode } from './runs';

type Selection = WorkspaceProps['selection'];
type Location = { mode: RunMode; language: Language; range: LineRange | null };
type ActiveRun = Location & {
    key: string;
    run: Run;
    reference?: string;
    referenceLines: string[];
};
type Editor = ReturnType<typeof mountEditor>;
type LineStatus = ReturnType<typeof compareLines>['lines'][number];
type Completion = { active: ActiveRun; revision: number; stats: SessionStats };
type LiveSnapshot = {
    vim: string;
    line: number;
    status: string;
    phase: 'ready' | 'running' | 'finished';
    pending: boolean;
    ghost: string;
    matched: number;
    total: number;
    seconds: number;
    wpm: number;
    lines: LineStatus[];
};
type Checks = NonNullable<PracticeResult['checks']>;

let lastLanguage: Language = defaultLanguage;

function initialLocation(selection: Selection, available: Language[], initialLanguage?: Language, initialRange?: LineRange): Location {
    const requested = initialLanguage ?? lastLanguage;
    const language = available.includes(requested) ? requested : available[0];
    if (language === undefined) throw new Error('The selected drill has no available languages.');
    if (selection.kind === 'repair') return { mode: 'repair', language, range: null };
    const lines = selection.challenge.solutions[language]?.split('\n').length ?? 0;
    const range = selection.mode === 'guided' && initialRange &&
        Number.isInteger(initialRange.start) && Number.isInteger(initialRange.end) &&
        initialRange.start >= 1 && initialRange.start <= initialRange.end && initialRange.end <= lines
        ? initialRange : null;
    return { mode: selection.mode, language, range };
}

function makeActiveRun(selection: Selection, location: Location, restart = false): ActiveRun {
    const { mode, language, range } = location;
    const drill = selection.kind === 'repair' ? selection.drill : selection.challenge;
    const key = runKey(drill.id, language, mode, range);
    const starter = selection.kind === 'repair' ? selection.drill.starter[language] ?? '' : '';
    const run = loadDraft(key, starter, mode === 'guided' && !range, restart);
    const source = selection.kind === 'practice' && mode === 'guided' ? selection.challenge.solutions[language] : undefined;
    const sourceLines = source?.split('\n') ?? [];
    const referenceLines = range ? sourceLines.slice(range.start - 1, range.end) : sourceLines;
    const reference = source === undefined ? undefined : referenceLines.join('\n');
    return { ...location, key, run, reference, referenceLines };
}

function makeLiveStore() {
    const listeners = new Set<() => void>();
    const empty: LiveSnapshot = {
        vim: 'off', line: 1, status: 'Ready', phase: 'ready', pending: false, ghost: '',
        matched: 0, total: 0, seconds: 0, wpm: 0, lines: [],
    };
    let snapshot = empty;
    let comparedRun: Run | undefined;
    let comparedRevision = -1;
    let comparison: ReturnType<typeof compareLines> | undefined;

    return {
        subscribe(listener: () => void) {
            listeners.add(listener);
            return () => { listeners.delete(listener); };
        },
        getSnapshot: () => snapshot,
        refresh(active: ActiveRun | null, vim: string, pending: boolean, message: string) {
            if (!active) return;
            const { run, mode, reference } = active;
            const stats = run.lastEdit === null || mode === 'blind'
                ? null : run.session.snapshot(run.text);
            if (comparedRun !== run || comparedRevision !== run.revision) {
                comparedRun = run;
                comparedRevision = run.revision;
                comparison = reference === undefined ? undefined : compareLines(run.text, reference);
            }
            let ghostChars = 0;
            if (stats && run.ghost) {
                for (const point of run.ghost.points) {
                    if (point.seconds > stats.seconds) break;
                    ghostChars = point.chars;
                }
            }
            const delta = (stats?.inserted ?? 0) - ghostChars;
            const ghost = run.ghost
                ? run.lastEdit === null ? 'Ghost ready' : `${delta >= 0 ? '+' : '−'}${Math.abs(delta)} chars vs ghost`
                : '';
            const status = message || (
                pending ? 'Checking…' :
                run.scored ? 'Scored' :
                run.lastEdit === null ? mode === 'repair' ? 'Edit or run baseline' : 'Ready' :
                mode === 'blind' ? 'Writing' :
                stats && stats.seconds >= 1 ? `${stats.wpm} WPM` : 'Timing…'
            );
            const next: LiveSnapshot = {
                vim, line: run.line, status, pending, ghost,
                phase: run.scored ? 'finished' : run.lastEdit === null ? 'ready' : 'running',
                matched: comparison?.matched ?? 0,
                total: comparison?.total ?? 0,
                seconds: Math.floor(stats?.seconds ?? 0),
                wpm: stats?.wpm ?? 0,
                lines: comparison?.lines ?? empty.lines,
            };
            if (Object.keys(next).every((key) => next[key as keyof LiveSnapshot] === snapshot[key as keyof LiveSnapshot])) return;
            snapshot = next;
            listeners.forEach((listener) => listener());
        },
    };
}

function matchesReference(text: string, referenceLines: string[]) {
    const lines = text.split('\n');
    return lines.length === referenceLines.length && referenceLines.some((line) => line.trim()) &&
        referenceLines.every((line, index) => line.trim() === lines[index].trim());
}

function makeResult(
    active: ActiveRun,
    drill: { id: string; title: string },
    stats: SessionStats,
    checks?: Checks,
    previous?: RunRecord,
): PracticeResult {
    const { run, mode, language, range, reference, referenceLines } = active;
    const comparison = reference === undefined ? undefined : compareLines(run.text, reference);
    const offset = range ? range.start - 1 : 0;
    const lineSplits = comparison && run.lineSplits.size
        ? Array.from(run.lineSplits, ([line, split]) => ({ line: line + offset, ...split })).sort((a, b) => a.line - b.line)
        : undefined;
    const longestGap = run.longestGap.seconds >= minimumPauseSeconds
        ? { seconds: run.longestGap.seconds, line: run.longestGap.line + offset }
        : undefined;
    const firstDifference = comparison ? referenceLines.findIndex((line, index) => (
        line.trim() ? comparison.lines[index] !== 'match' :
            index >= comparison.lines.length || comparison.lines[index] === 'edit'
    )) + 1 : 0;
    const extraLine = comparison && comparison.lines.length > referenceLines.length ? referenceLines.length + 1 : 0;
    const mostActive = lineSplits?.filter(({ line }) => line <= referenceLines.length + offset)
        .sort((a, b) => b.deleted - a.deleted || b.seconds - a.seconds)[0];
    const repeat: { line: number; reason: NonNullable<PracticeResult['repeatReason']> } | undefined =
        firstDifference ? { line: firstDifference + offset, reason: 'difference' } :
        extraLine ? { line: extraLine + offset, reason: 'extra' } :
        mostActive?.deleted ? { line: mostActive.line, reason: 'deletions' } :
        longestGap && longestGap.line <= referenceLines.length + offset ? { line: longestGap.line, reason: 'pause' } :
        mostActive?.seconds ? { line: mostActive.line, reason: 'active' } : undefined;
    const target = repeat ? repeat.line - offset : 1;
    const start = Math.max(1, Math.min(target - 1, referenceLines.length - 3));
    const repeatRange = comparison && referenceLines.length
        ? range ?? { start, end: Math.min(start + 3, referenceLines.length) }
        : undefined;
    const record: RunRecord = {
        id: previous?.id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        drillId: drill.id,
        title: drill.title,
        language,
        mode: range ? 'sprint' : mode,
        createdAt: previous?.createdAt ?? Date.now(),
        ...(range && { range }),
        seconds: stats.seconds,
        wpm: stats.wpm,
        inserted: stats.inserted,
        deleted: stats.deleted,
        ...(comparison && { matched: comparison.matched, total: comparison.total }),
        ...(checks && { passed: checks.filter((check) => check.passed).length, checks: checks.length }),
    };
    return {
        record,
        points: run.lastEdit === null ? [] : run.points.slice(),
        ghost: run.ghost?.points,
        ghostNote: run.ghostNote || (run.ghost ? 'Your personal best' : undefined),
        complete: comparison ? matchesReference(run.text, referenceLines) : undefined,
        review: comparison && Array.from(
            { length: Math.max(comparison.lines.length, referenceLines.length) },
            (_, index) => ({
                line: index + 1 + offset,
                status: comparison.lines[index] ?? 'empty',
                editable: index < comparison.lines.length,
            }),
        ),
        lineSplits,
        longestGap,
        checks,
        repeatRange,
        repeatLine: repeat?.line,
        repeatReason: repeat?.reason,
    };
}

export function usePractice({ selection, settings, initialLanguage, initialRange, onRecord }: WorkspaceProps) {
    const [live] = useState(makeLiveStore);
    const availableLanguages = selection.kind === 'repair'
        ? repairStarterLanguages(selection.drill.starter) : solutionLanguages(selection.challenge.solutions);
    const [location, setLocation] = useState(() => initialLocation(selection, availableLanguages, initialLanguage, initialRange));
    const checkDefinitions = selection.kind === 'repair' ? selection.drill.checks : selection.challenge.checks;
    const canRunChecks = Boolean(checkDefinitions?.length && repairLanguages.includes(location.language) &&
        (location.mode === 'repair' || location.mode === 'blind'));
    const [result, setResult] = useState<PracticeResult | null>(null);
    const [referenceOpen, setReferenceOpen] = useState(false);
    const host = useRef<HTMLDivElement>(null);
    const editor = useRef<Editor | null>(null);
    const current = useRef<ActiveRun | null>(null);
    const mounted = useRef(false);
    const opening = useRef(false);
    const pending = useRef<object | null>(null);
    const completion = useRef<Completion | null>(null);
    const resultOpen = useRef(false);
    const vimMode = useRef('off');
    const message = useRef('');
    const latest = useRef({ selection, settings, location });
    const finish = useRef<() => void>(() => {});
    const heading = useRef<HTMLHeadingElement>(null);
    const returnFrame = useRef<number | undefined>(undefined);

    function refresh() {
        live.refresh(current.current, vimMode.current, Boolean(pending.current), message.current);
    }

    useLayoutEffect(() => {
        latest.current = { selection, settings, location };
        finish.current = () => { void submit(); };
    });

    useLayoutEffect(() => {
        const { settings: initial, selection: picked, location: first } = latest.current;
        if (!host.current) return;
        mounted.current = true;
        lastLanguage = first.language;
        setVimMappings(initial.mappings);
        current.current = makeActiveRun(picked, first);
        opening.current = true;
        const instance = mountEditor(host.current, {
            language: first.language,
            vim: initial.vim,
            saveKey: initial.saveKey,
            onChange(text, change) {
                const active = current.current;
                if (!active || opening.current) return;
                const { run, reference, referenceLines } = active;
                const previousText = run.text;
                completion.current = null;
                if (run.scored) resetScoring(active.key, run, active.mode === 'guided' && !active.range);
                run.text = text;
                run.revision += 1;
                const now = performance.now();
                recordEdit(run, change, now, reference !== undefined);
                if (run.lastSample === null || now - run.lastSample >= 200) {
                    const { seconds, inserted } = run.session.snapshot(run.text);
                    recordPoint(run, seconds, inserted);
                    run.lastSample = now;
                }
                message.current = '';
                if (reference !== undefined && !run.pasted && !run.finishedReference &&
                    matchesReference(text, referenceLines) && !matchesReference(previousText, referenceLines)) {
                    const candidate = { active, revision: run.revision, stats: run.session.snapshot(text, reference) };
                    completion.current = candidate;
                    // The dialog may move focus. Finish after CodeMirror commits the edit.
                    queueMicrotask(() => {
                        if (mounted.current && current.current === active && completion.current === candidate &&
                            run.revision === candidate.revision && !resultOpen.current) scorePractice(active, candidate.stats);
                    });
                }
            },
            onLineChange(line) {
                if (!current.current || opening.current) return;
                current.current.run.line = line;
                refresh();
            },
            onVimMode(mode) {
                vimMode.current = mode;
                if (!opening.current) refresh();
            },
            onSave() { finish.current(); },
        });
        editor.current = instance;
        instance.setValue(current.current.run.text);
        if (current.current.run.line !== 1) instance.goToLine(current.current.run.line);
        opening.current = false;
        refresh();
        heading.current?.focus({ preventScroll: true });
        const updateTimer = window.setInterval(refresh, 150);
        return () => {
            mounted.current = false;
            pending.current = null;
            completion.current = null;
            window.clearInterval(updateTimer);
            if (returnFrame.current !== undefined) window.cancelAnimationFrame(returnFrame.current);
            instance.destroy();
            editor.current = null;
            current.current = null;
        };
    }, []);

    useLayoutEffect(() => { editor.current?.setVim(settings.vim); }, [settings.vim]);
    useLayoutEffect(() => { editor.current?.setSaveKey(settings.saveKey); }, [settings.saveKey]);
    useLayoutEffect(() => { setVimMappings(settings.mappings); }, [settings.mappings]);

    function focusAfterClose(line?: number) {
        if (returnFrame.current !== undefined) window.cancelAnimationFrame(returnFrame.current);
        returnFrame.current = window.requestAnimationFrame(() => {
            returnFrame.current = undefined;
            if (line !== undefined) editor.current?.goToLine(line);
            else editor.current?.focus();
        });
    }

    function closeResult(line?: number) {
        resultOpen.current = false;
        setResult(null);
        focusAfterClose(line);
    }

    function switchRun(next: Location, restart = false) {
        if (!editor.current || !availableLanguages.includes(next.language)) return;
        lastLanguage = next.language;
        setLocation(next);
        setReferenceOpen(false);
        pending.current = null;
        completion.current = null;
        message.current = '';
        resultOpen.current = false;
        setResult(null);
        const active = makeActiveRun(selection, next, restart);
        current.current = active;
        opening.current = true;
        editor.current.setLanguage(next.language);
        editor.current.setValue(active.run.text);
        opening.current = false;
        refresh();
        focusAfterClose(active.run.line);
    }

    function publish(active: ActiveRun, stats: SessionStats, checks?: Checks) {
        const drill = selection.kind === 'repair' ? selection.drill : selection.challenge;
        const { run, mode } = active;
        const previous = run.recorded?.revision === run.revision ? run.recorded : undefined;
        const snapshot = makeResult(active, drill, stats, checks ?? previous?.checks, previous?.record);
        if (!previous || (mode === 'blind' && (checks || previous.scored !== run.scored))) {
            run.recorded = { revision: run.revision, scored: run.scored, record: snapshot.record, checks: snapshot.checks };
            onRecord(snapshot.record);
        }
        resultOpen.current = true;
        refresh();
        setResult(snapshot);
    }

    function requireEdits(run: Run): boolean {
        if (run.lastEdit !== null) return true;
        message.current = 'Write some code first';
        refresh();
        editor.current?.focus();
        return false;
    }

    async function runChecks() {
        const active = current.current;
        if (!active || !canRunChecks || !checkDefinitions || resultOpen.current || pending.current) return;
        const { run, mode, language } = active;
        if (mode === 'blind' && !requireEdits(run)) return;

        const token = {};
        const { text, revision } = run;
        const stats = run.session.snapshot(text);
        recordPoint(run, stats.seconds, stats.inserted);
        pending.current = token;
        refresh();
        let checks: Checks;
        try {
            const { checkRepair } = await import('../../core/checker');
            checks = await checkRepair(text, language, checkDefinitions);
        } catch {
            checks = [{ name: 'Check runner', passed: false, message: 'The browser could not run this attempt.' }];
        }
        if (!mounted.current || pending.current !== token) return;
        pending.current = null;
        refresh();
        if (current.current !== active || run.revision !== revision) return;
        if (mode === 'repair' && checks.length && checks.every((check) => check.passed)) {
            run.session.finish(text, undefined, stats);
            run.scored = true;
        }
        publish(active, stats, checks);
    }

    function submit() {
        if (selection.kind === 'repair') return runChecks();
        const active = current.current;
        if (!active || resultOpen.current || pending.current) return;
        const { run } = active;
        if (!requireEdits(run)) return;
        const candidate = completion.current;
        scorePractice(active, candidate?.active === active && candidate.revision === run.revision ? candidate.stats : undefined);
    }

    function scorePractice(active: ActiveRun, atSubmit?: SessionStats) {
        const { run, reference, referenceLines, range, key } = active;
        completion.current = null;
        const firstScore = !run.scored;
        const stats = run.session.finish(run.text, reference, atSubmit);
        const complete = reference !== undefined && matchesReference(run.text, referenceLines);
        run.scored = true;
        run.finishedReference ||= complete;
        recordPoint(run, stats.seconds, stats.inserted);
        if (firstScore && complete && !range && run.ghostEligible && !run.pasted && stats.seconds > 0) {
            run.ghostNote = saveBest(key, run, stats.seconds);
        }
        publish(active, stats);
    }

    return {
        editor, host, heading, live, location, availableLanguages, result, referenceOpen, setReferenceOpen, closeResult, switchRun, submit,
        canRunChecks, runChecks,
        jumpToLine(line: number) { closeResult(line - (location.range ? location.range.start - 1 : 0)); },
    };
}
