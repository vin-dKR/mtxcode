import type { EditorChange } from '../../core/editor';
import { createSession } from '../../core/scoring';
import { compactTrace, type PacePoint } from '../../core/trace';
import type { Language, LineRange, PracticeResult, RunRecord } from '../../types';

export type RunMode = 'guided' | 'blind' | 'repair';
type Ghost = { seconds: number; points: PacePoint[] };
type RecordedAttempt = {
    revision: number;
    scored: boolean;
    record: RunRecord;
    checks?: PracticeResult['checks'];
};

const ghostKey = 'keycraft-v5-ghosts';
export const minimumPauseSeconds = 1.5;
const drafts = new Map<string, Run>();
let ghosts: Record<string, Ghost> | undefined;

function isGhost(value: unknown): value is Ghost {
    if (!value || typeof value !== 'object') return false;
    const { seconds, points } = value as Partial<Ghost>;
    return typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0 &&
        Array.isArray(points) && points.length > 0 && points.length <= 80 &&
        points.every((point, index) => point &&
            Number.isFinite(point.seconds) && point.seconds >= 0 &&
            Number.isFinite(point.chars) && point.chars >= 0 &&
            (index === 0 || point.seconds >= points[index - 1].seconds));
}

function writeGhosts(value: Record<string, Ghost>) {
    try {
        localStorage.setItem(ghostKey, JSON.stringify({ version: 1, ghosts: value }));
    } catch { /* The session can still track a best attempt in memory. */ }
}

function readGhosts(): Record<string, Ghost> {
    if (ghosts) return ghosts;
    try {
        const saved = JSON.parse(localStorage.getItem(ghostKey) ?? 'null');
        const legacy = !saved;
        const data = legacy
            ? JSON.parse(localStorage.getItem('keycraft-ghosts') ?? 'null')
            : saved.version === 1 ? saved.ghosts : null;
        ghosts = data && typeof data === 'object' && !Array.isArray(data)
            ? Object.fromEntries(Object.entries(data).filter((entry): entry is [string, Ghost] => isGhost(entry[1])))
            : {};
        if (legacy && Object.keys(ghosts).length) writeGhosts(ghosts);
    } catch {
        ghosts = {};
    }
    return ghosts;
}

function createRun(text: string, ghost?: Ghost) {
    return {
        text,
        line: 1,
        session: createSession(),
        scored: false,
        revision: 0,
        recorded: undefined as RecordedAttempt | undefined,
        lastEdit: null as number | null,
        lastTypingLine: null as number | null,
        lastSample: null as number | null,
        longestGap: { seconds: 0, line: 1 },
        lineSplits: new Map<number, { seconds: number; deleted: number }>(),
        points: [{ seconds: 0, chars: 0 }] as PacePoint[],
        ghost,
        ghostNote: '',
        ghostEligible: !text,
        pasted: false,
        finishedReference: false,
    };
}

export type Run = ReturnType<typeof createRun>;

export function runKey(drillId: string, language: Language, mode: RunMode, range: LineRange | null) {
    return `${drillId}/${language}/${mode}${range ? `/${range.start}-${range.end}` : ''}`;
}

export function loadDraft(key: string, starter: string, allowGhost: boolean, restart = false) {
    const saved = restart ? undefined : drafts.get(key);
    if (saved) return saved;
    const run = createRun(starter, allowGhost ? readGhosts()[key] : undefined);
    drafts.set(key, run);
    return run;
}

export function resetScoring(key: string, run: Run, allowGhost: boolean) {
    Object.assign(run, createRun(run.text, allowGhost ? readGhosts()[key] : undefined), {
        line: run.line,
        revision: run.revision,
        pasted: run.pasted,
        finishedReference: run.finishedReference,
    });
}

export function recordEdit(run: Run, change: EditorChange, now: number, trackLines: boolean) {
    const line = change.lines[0]?.line ?? run.line;
    if (run.lastEdit !== null) {
        const seconds = (now - run.lastEdit) / 1000;
        if (seconds > run.longestGap.seconds) run.longestGap = { seconds, line };
        if (run.lastTypingLine !== null && !change.paste && seconds < minimumPauseSeconds) {
            const split = run.lineSplits.get(run.lastTypingLine);
            if (split) split.seconds += seconds;
        }
    }
    if (trackLines && !change.paste) {
        for (const { line, deleted } of change.lines) {
            const split = run.lineSplits.get(line) ?? { seconds: 0, deleted: 0 };
            split.deleted += deleted;
            run.lineSplits.set(line, split);
        }
    }
    run.lastEdit = now;
    run.lastTypingLine = trackLines && !change.paste ? line : null;
    run.pasted ||= change.paste;
    run.session.record(change);
}

export function recordPoint(run: Run, seconds: number, chars: number) {
    const point = { seconds, chars };
    if (run.points.at(-1)?.seconds === seconds) run.points[run.points.length - 1] = point;
    else run.points.push(point);
    if (run.points.length > 720) run.points = compactTrace(run.points, 360);
}

export function saveBest(key: string, run: Run, seconds: number): string {
    const saved = readGhosts();
    const best = saved[key];
    if (best && seconds >= best.seconds) return `${(seconds - best.seconds).toFixed(1)}s behind your best`;
    saved[key] = { seconds, points: compactTrace(run.points, 72) };
    writeGhosts(saved);
    return best ? `Personal best · ${(best.seconds - seconds).toFixed(1)}s faster` : 'Benchmark saved';
}
