import type { LanguageSources } from './languages';
import type { RepairDrill } from './repairs';

export interface Topic {
    id: string;
    label: string;
    description: string;
}

export interface Challenge {
    id: string;
    topic: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    prompt: string;
    example: string;
    solutions: LanguageSources;
    checks?: RepairDrill['checks'];
    sourceUrl?: string;
    sourceOrder?: number;
}

export const topics: Topic[] = [
    { id: 'timers', label: 'Timers', description: 'Debounce and throttle bursts of calls.' },
    { id: 'async', label: 'Async & Promises', description: 'Bound concurrency, share requests, and enforce deadlines.' },
    { id: 'typescript', label: 'TypeScript Patterns', description: 'Derive types with mapped types, recursion, and inference.' },
    { id: 'internals', label: 'JavaScript Internals', description: 'Work with closures, insertion order, and reentrant listeners.' },
    { id: 'algorithms', label: 'Algorithms', description: 'Solve interview-style problems with sliding windows and graphs.' },
];

export const challenges: Challenge[] = [
    {
        id: 'debounce',
        topic: 'timers',
        title: 'Debounce with cancel',
        difficulty: 'Medium',
        prompt: 'Run the callback only after a quiet period of delay milliseconds. Use the latest call’s receiver and arguments. Expose cancel() to discard a pending call.',
        example: 'Calls with "a" at 0 ms and "b" at 50 ms, delay 100 → "b" at 150 ms.',
        solutions: {
            js: `function debounce(fn, delay) {
    let timer;

    function run(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    }

    function cancel() {
        clearTimeout(timer);
        timer = undefined;
    }

    return Object.assign(run, { cancel });
}`,
            ts: `function debounce<Context, Args extends unknown[]>(
    fn: (this: Context, ...args: Args) => void,
    delay: number,
) {
    let timer: ReturnType<typeof setTimeout> | undefined;

    function run(this: Context, ...args: Args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    }

    function cancel() {
        clearTimeout(timer);
        timer = undefined;
    }

    return Object.assign(run, { cancel });
}`,
        },
    },
    {
        id: 'throttle',
        topic: 'timers',
        title: 'Leading and trailing throttle',
        difficulty: 'Hard',
        prompt: 'Run the first call immediately. During each delay window, retain the newest call and run it when the window ends. A trailing call starts a fresh window. Preserve the receiver and arguments.',
        example: 'Calls "a", "b", "c" at 0, 20, 40 ms, delay 100 → "a" at 0 ms and "c" at 100 ms.',
        solutions: {
            js: `function throttle(fn, delay) {
    let cooling = false;
    let pending;

    function startWindow(call) {
        cooling = true;
        setTimeout(() => {
            const next = pending;
            pending = undefined;
            cooling = false;
            if (next) startWindow(next);
        }, delay);
        call();
    }

    return function (...args) {
        const call = () => fn.apply(this, args);
        if (cooling) pending = call;
        else startWindow(call);
    };
}`,
            ts: `function throttle<Context, Args extends unknown[]>(
    fn: (this: Context, ...args: Args) => void,
    delay: number,
) {
    let cooling = false;
    let pending: (() => void) | undefined;

    function startWindow(call: () => void) {
        cooling = true;
        setTimeout(() => {
            const next = pending;
            pending = undefined;
            cooling = false;
            if (next) startWindow(next);
        }, delay);
        call();
    }

    return function (this: Context, ...args: Args) {
        const call = () => fn.apply(this, args);
        if (cooling) pending = call;
        else startWindow(call);
    };
}`,
        },
    },
    {
        id: 'settle-limit',
        topic: 'async',
        title: 'Bounded promise pool',
        difficulty: 'Hard',
        prompt: 'Run an array of task functions with at most limit tasks active. Return settled results in input order. Record thrown errors and rejections, and continue after failures. Assume a positive integer limit.',
        example: 'With limit 2, if task 1 fails before task 0 finishes, task 2 can start. Its result still belongs at index 2.',
        solutions: {
            js: `async function settleLimit(tasks, limit) {
    const results = new Array(tasks.length);
    let next = 0;

    async function worker() {
        while (next < tasks.length) {
            const index = next++;
            try {
                const value = await tasks[index]();
                results[index] = { status: "fulfilled", value };
            } catch (reason) {
                results[index] = { status: "rejected", reason };
            }
        }
    }

    const count = Math.min(tasks.length, limit);
    await Promise.all(Array.from({ length: count }, worker));
    return results;
}`,
            ts: `async function settleLimit<Value>(
    tasks: readonly (() => Value | PromiseLike<Value>)[],
    limit: number,
): Promise<PromiseSettledResult<Value>[]> {
    const results: PromiseSettledResult<Value>[] = new Array(tasks.length);
    let next = 0;

    async function worker() {
        while (next < tasks.length) {
            const index = next++;
            try {
                const value = await tasks[index]();
                results[index] = { status: "fulfilled", value };
            } catch (reason) {
                results[index] = { status: "rejected", reason };
            }
        }
    }

    const count = Math.min(tasks.length, limit);
    await Promise.all(Array.from({ length: count }, worker));
    return results;
}`,
        },
    },
    {
        id: 'coalesce',
        topic: 'async',
        title: 'Share in-flight requests',
        difficulty: 'Medium',
        prompt: 'Wrap a loader so concurrent calls for the same key receive the same promise. Remove the entry after fulfillment or rejection so later calls can retry. Handle synchronous loader errors too.',
        example: 'get("profile") === get("profile") while pending. After settlement, the next call starts a fresh load.',
        solutions: {
            js: `function coalesce(load) {
    const pending = new Map();

    return function get(key) {
        const active = pending.get(key);
        if (active) return active;

        const request = Promise.resolve()
            .then(() => load(key))
            .finally(() => pending.delete(key));
        pending.set(key, request);
        return request;
    };
}`,
            ts: `function coalesce<Key, Value>(
    load: (key: Key) => Value | PromiseLike<Value>,
) {
    const pending = new Map<Key, Promise<Value>>();

    return function get(key: Key): Promise<Value> {
        const active = pending.get(key);
        if (active) return active;

        const request = Promise.resolve()
            .then(() => load(key))
            .finally(() => pending.delete(key));
        pending.set(key, request);
        return request;
    };
}`,
        },
    },
    {
        id: 'deadline',
        topic: 'async',
        title: 'Abort on deadline',
        difficulty: 'Hard',
        prompt: 'Run a task with an AbortSignal. On timeout, reject with Error("Deadline exceeded") and abort the signal. If the task settles first, pass through its result or error and release the timer.',
        example: 'withDeadline(slowTask, 50) rejects after 50 ms and slowTask’s signal becomes aborted.',
        solutions: {
            js: `async function withDeadline(task, delay) {
    const controller = new AbortController();
    let timer;

    const deadline = new Promise((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error("Deadline exceeded"));
            controller.abort();
        }, delay);
    });

    try {
        const work = Promise.resolve().then(() => task(controller.signal));
        return await Promise.race([work, deadline]);
    } finally {
        clearTimeout(timer);
    }
}`,
            ts: `async function withDeadline<Value>(
    task: (signal: AbortSignal) => Value | PromiseLike<Value>,
    delay: number,
): Promise<Value> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
            reject(new Error("Deadline exceeded"));
            controller.abort();
        }, delay);
    });

    try {
        const work = Promise.resolve().then(() => task(controller.signal));
        return await Promise.race([work, deadline]);
    } finally {
        clearTimeout(timer);
    }
}`,
        },
    },
    {
        id: 'event-handlers',
        topic: 'typescript',
        title: 'Discriminated handler map',
        difficulty: 'Medium',
        prompt: 'Given an event union with a unique string kind per member, derive a required handler per kind. Each handler should receive the exact member for its key.',
        example: 'HandlerMap<{ kind: "saved"; id: number } | { kind: "closed" }> makes saved’s argument expose id.',
        solutions: {
            ts: `type HandlerMap<Event extends { kind: string }> = {
    [Member in Event as Member["kind"]]: (event: Member) => void;
};

type PanelEvent =
    | { kind: "saved"; id: number }
    | { kind: "closed" };

const handlers: HandlerMap<PanelEvent> = {
    saved: event => console.log(event.id),
    closed: () => console.log("closed"),
};`,
        },
    },
    {
        id: 'deep-readonly',
        topic: 'typescript',
        title: 'Deep readonly tuples',
        difficulty: 'Hard',
        prompt: 'Make nested record and array properties readonly while preserving optional properties and tuple positions. Leave primitive and function types intact.',
        example: 'DeepReadonly<[number, { name?: string }]> gives readonly [number, { readonly name?: string }].',
        solutions: {
            ts: `type DeepReadonly<Value> =
    Value extends (...args: never[]) => unknown
        ? Value
        : Value extends object
            ? { readonly [Key in keyof Value]: DeepReadonly<Value[Key]> }
            : Value;

type Draft = [number, { name?: string }, () => void];
type FrozenDraft = DeepReadonly<Draft>;`,
        },
    },
    {
        id: 'route-params',
        topic: 'typescript',
        title: 'Infer route parameters',
        difficulty: 'Hard',
        prompt: 'Derive an object type from a literal route. Segments like :id produce required string keys and :tab? produces an optional string key. Ignore static segments and assume unique parameter names.',
        example: 'RouteParams<"/teams/:team/users/:id/:tab?"> gives { team: string; id: string; tab?: string }.',
        solutions: {
            ts: `type SegmentParam<Part extends string> =
    Part extends \`:\${infer Name}?\`
        ? { [Key in Name]?: string }
        : Part extends \`:\${infer Name}\`
            ? { [Key in Name]: string }
            : {};

type RouteParams<Path extends string> =
    Path extends \`\${infer Head}/\${infer Tail}\`
        ? SegmentParam<Head> & RouteParams<Tail>
        : SegmentParam<Path>;

type UserParams = RouteParams<"/teams/:team/users/:id/:tab?">;`,
        },
    },
    {
        id: 'lru',
        topic: 'internals',
        title: 'Least recently used cache',
        difficulty: 'Medium',
        prompt: 'Return a cache with get and set. Reads and writes mark a key as most recently used. When capacity is exceeded, evict the least recently used key. Use constant-time operations and assume positive integer capacity.',
        example: 'Capacity 2. Set a and b, get a, then set c. A subsequent get("b") returns undefined.',
        solutions: {
            js: `function createLru(capacity) {
    const entries = new Map();

    return {
        get(key) {
            const entry = entries.get(key);
            if (!entry) return undefined;
            entries.delete(key);
            entries.set(key, entry);
            return entry.value;
        },
        set(key, value) {
            entries.delete(key);
            entries.set(key, { value });
            if (entries.size > capacity) {
                const oldest = entries.keys().next();
                if (!oldest.done) entries.delete(oldest.value);
            }
        },
    };
}`,
            ts: `function createLru<Key, Value>(capacity: number) {
    const entries = new Map<Key, { value: Value }>();

    return {
        get(key: Key): Value | undefined {
            const entry = entries.get(key);
            if (!entry) return undefined;
            entries.delete(key);
            entries.set(key, entry);
            return entry.value;
        },
        set(key: Key, value: Value) {
            entries.delete(key);
            entries.set(key, { value });
            if (entries.size > capacity) {
                const oldest = entries.keys().next();
                if (!oldest.done) entries.delete(oldest.value);
            }
        },
    };
}`,
        },
    },
    {
        id: 'emitter',
        topic: 'internals',
        title: 'Reentrant event emitter',
        difficulty: 'Hard',
        prompt: 'Build a single-event emitter with on(listener, once?) and emit(value). Return an unsubscribe function from on. Emit in subscription order, skip removed listeners, and defer new listeners to the next emit. A once listener fires at most once, even if it calls emit.',
        example: 'A once listener receives 1 and calls emit(2). It sees only 1. A regular listener can see both emissions.',
        solutions: {
            js: `function createEmitter() {
    const subscriptions = new Set();

    function on(listener, once = false) {
        const entry = { listener, once };
        subscriptions.add(entry);
        return () => { subscriptions.delete(entry); };
    }

    function emit(value) {
        for (const entry of [...subscriptions]) {
            if (!subscriptions.has(entry)) continue;
            if (entry.once) subscriptions.delete(entry);
            entry.listener(value);
        }
    }

    return { on, emit };
}`,
            ts: `function createEmitter<Value>() {
    type Listener = (value: Value) => void;
    const subscriptions = new Set<{ listener: Listener; once: boolean }>();

    function on(listener: Listener, once = false) {
        const entry = { listener, once };
        subscriptions.add(entry);
        return () => { subscriptions.delete(entry); };
    }

    function emit(value: Value) {
        for (const entry of [...subscriptions]) {
            if (!subscriptions.has(entry)) continue;
            if (entry.once) subscriptions.delete(entry);
            entry.listener(value);
        }
    }

    return { on, emit };
}`,
        },
    },
    {
        id: 'min-cover',
        topic: 'algorithms',
        title: 'Minimum covering window',
        difficulty: 'Hard',
        prompt: 'Find the shortest substring containing every character in target, including repeats. Break ties by earliest start. Return an empty string if no window exists or target is empty. Assume ASCII and aim for linear time.',
        example: 'minCover("ACBAAB", "AAB") → "BAA".',
        solutions: {
            js: `function minCover(text, target) {
    if (target.length === 0) return "";
    const need = new Map();
    for (const char of target) need.set(char, (need.get(char) ?? 0) + 1);

    let missing = target.length;
    let left = 0;
    let bestStart = 0;
    let bestLength = Infinity;

    for (let right = 0; right < text.length; right++) {
        const incoming = text[right];
        const count = need.get(incoming);
        if (count !== undefined) {
            if (count > 0) missing--;
            need.set(incoming, count - 1);
        }

        while (missing === 0) {
            const length = right - left + 1;
            if (length < bestLength) {
                bestStart = left;
                bestLength = length;
            }
            const outgoing = text[left++];
            const remaining = need.get(outgoing);
            if (remaining === undefined) continue;
            if (remaining === 0) missing++;
            need.set(outgoing, remaining + 1);
        }
    }

    return bestLength === Infinity ? "" : text.slice(bestStart, bestStart + bestLength);
}`,
            ts: `function minCover(text: string, target: string): string {
    if (target.length === 0) return "";
    const need = new Map<string, number>();
    for (const char of target) need.set(char, (need.get(char) ?? 0) + 1);

    let missing = target.length;
    let left = 0;
    let bestStart = 0;
    let bestLength = Infinity;

    for (let right = 0; right < text.length; right++) {
        const incoming = text[right];
        const count = need.get(incoming);
        if (count !== undefined) {
            if (count > 0) missing--;
            need.set(incoming, count - 1);
        }

        while (missing === 0) {
            const length = right - left + 1;
            if (length < bestLength) {
                bestStart = left;
                bestLength = length;
            }
            const outgoing = text[left++];
            const remaining = need.get(outgoing);
            if (remaining === undefined) continue;
            if (remaining === 0) missing++;
            need.set(outgoing, remaining + 1);
        }
    }

    return bestLength === Infinity ? "" : text.slice(bestStart, bestStart + bestLength);
}`,
        },
    },
    {
        id: 'job-order',
        topic: 'algorithms',
        title: 'Schedule dependent jobs',
        difficulty: 'Medium',
        prompt: 'Return any valid execution order for jobs numbered 0 to n - 1. Each pair [before, after] requires before to finish first. Return an empty array if a cycle blocks the schedule. Aim for O(n + pairs.length) time.',
        example: 'scheduleJobs(4, [[0, 2], [1, 2], [2, 3]]) → [0, 1, 2, 3].',
        solutions: {
            js: `function scheduleJobs(n, pairs) {
    const outgoing = Array.from({ length: n }, () => []);
    const waiting = new Array(n).fill(0);

    for (const [before, after] of pairs) {
        outgoing[before].push(after);
        waiting[after]++;
    }

    const order = [];
    for (let job = 0; job < n; job++) {
        if (waiting[job] === 0) order.push(job);
    }

    for (let head = 0; head < order.length; head++) {
        for (const next of outgoing[order[head]]) {
            waiting[next]--;
            if (waiting[next] === 0) order.push(next);
        }
    }

    return order.length === n ? order : [];
}`,
            ts: `function scheduleJobs(
    n: number,
    pairs: readonly (readonly [number, number])[],
): number[] {
    const outgoing = Array.from({ length: n }, (): number[] => []);
    const waiting: number[] = new Array(n).fill(0);

    for (const [before, after] of pairs) {
        outgoing[before].push(after);
        waiting[after]++;
    }

    const order: number[] = [];
    for (let job = 0; job < n; job++) {
        if (waiting[job] === 0) order.push(job);
    }

    for (let head = 0; head < order.length; head++) {
        for (const next of outgoing[order[head]]) {
            waiting[next]--;
            if (waiting[next] === 0) order.push(next);
        }
    }

    return order.length === n ? order : [];
}`,
        },
    },
];
