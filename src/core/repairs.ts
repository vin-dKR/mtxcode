import type { LanguageSources } from './languages';

export interface RepairDrill {
    id: string;
    title: string;
    topic: string;
    prompt: string;
    starter: LanguageSources;
    checks: { name: string; body: string }[];
}

const fakeClock = `
let now = 0;
let nextId = 0;
const timers = new Map();
const clock = {
    set(callback, delay) {
        const id = ++nextId;
        timers.set(id, { callback, at: now + delay });
        return id;
    },
    clear(id) {
        timers.delete(id);
    },
    advance(ms) {
        const target = now + ms;
        for (;;) {
            const next = Array.from(timers).sort((a, b) => a[1].at - b[1].at)[0];
            if (!next || next[1].at > target) break;
            const [id, timer] = next;
            now = timer.at;
            timers.delete(id);
            timer.callback();
        }
        now = target;
    },
};
`;

export const repairs: RepairDrill[] = [
    {
        id: 'repair-debounce',
        title: 'Debounce drops a pending edit',
        topic: 'timers',
        prompt: 'An autosave queue sometimes writes stale data or drops an edit triggered by its own callback. Repair debounce(fn, delay, clock?) so it waits for a full quiet period and runs the latest call with its original receiver and arguments. cancel() discards the pending call, and flush() runs it immediately once. A call made inside the callback starts a fresh quiet period. The optional clock supplies set(callback, delay) and clear(id).',
        starter: {
            js: `function debounce(fn, delay, clock = {
    set: (callback, ms) => setTimeout(callback, ms),
    clear: (id) => clearTimeout(id),
}) {
    let timer;
    let pending;

    function cancel() {
        if (timer !== undefined) clock.clear(timer);
        timer = undefined;
        pending = undefined;
    }

    function flush() {
        if (timer !== undefined) clock.clear(timer);
        timer = undefined;
        pending?.();
        pending = undefined;
    }

    function run(...args) {
        if (timer !== undefined) clock.clear(timer);
        pending ??= () => fn.apply(this, args);
        timer = clock.set(flush, delay);
    }

    return Object.assign(run, { cancel, flush });
}`,
            ts: `type DebounceTimer = ReturnType<typeof setTimeout>;

type DebounceClock = {
    set(callback: () => void, delay: number): DebounceTimer;
    clear(id: DebounceTimer): void;
};

function debounce<Context, Args extends unknown[]>(
    fn: (this: Context, ...args: Args) => void,
    delay: number,
    clock: DebounceClock = {
        set: (callback, ms) => setTimeout(callback, ms),
        clear: (id) => clearTimeout(id),
    },
) {
    let timer: DebounceTimer | undefined;
    let pending: (() => void) | undefined;

    function cancel() {
        if (timer !== undefined) clock.clear(timer);
        timer = undefined;
        pending = undefined;
    }

    function flush() {
        if (timer !== undefined) clock.clear(timer);
        timer = undefined;
        pending?.();
        pending = undefined;
    }

    function run(this: Context, ...args: Args) {
        if (timer !== undefined) clock.clear(timer);
        pending ??= () => fn.apply(this, args);
        timer = clock.set(flush, delay);
    }

    return Object.assign(run, { cancel, flush });
}`,
        },
        checks: [
            {
                name: 'Waits for quiet and uses the latest call',
                body: fakeClock + `
const calls = [];
const run = debounce(function (text, revision) {
    calls.push([this.document, text, revision]);
}, 10, clock);
run.call({ document: 'old' }, 'draft', 1);
clock.advance(6);
run.call({ document: 'new' }, 'final', 2);
clock.advance(9);
assert(calls.length === 0, 'The full delay should start again after the second call.');
clock.advance(1);
assert(JSON.stringify(calls) === '[["new","final",2]]', 'Use the latest receiver and both arguments.');
`,
            },
            {
                name: 'Cancels pending work and accepts a new call',
                body: fakeClock + `
const calls = [];
const run = debounce((value) => calls.push(value), 10, clock);
run('discard');
run.cancel();
run.flush();
clock.advance(10);
assert(calls.length === 0, 'Cancel should clear the timer and the pending callback.');
run('save');
clock.advance(10);
assert(calls.join() === 'save', 'A call after cancel should still be delivered.');
`,
            },
            {
                name: 'Flushes immediately and only once',
                body: fakeClock + `
const calls = [];
const run = debounce((value) => calls.push(value), 10, clock);
run('save');
run.flush();
assert(calls.join() === 'save', 'Flush should run the pending call immediately.');
run.flush();
clock.advance(10);
assert(calls.length === 1, 'A second flush and the old timer should have no effect.');
`,
            },
            {
                name: 'Keeps a call scheduled by the callback',
                body: fakeClock + `
const calls = [];
const run = debounce((value) => {
    calls.push(value);
    if (value === 'save') run('save again');
}, 10, clock);
run('save');
clock.advance(10);
assert(calls.join() === 'save', 'The nested call should wait for its own delay.');
clock.advance(10);
assert(calls.join() === 'save,save again', 'The first callback should leave the nested call pending.');
`,
            },
        ],
    },
    {
        id: 'repair-coalesce',
        title: 'A failed request poisons its key',
        topic: 'async',
        prompt: 'After a fetch fails, the request coalescer keeps returning the same failure. Repair createCoalescer(load) so overlapping calls with the same key share the exact same promise. Different keys can load independently. Both successful and failed requests release their key for a fresh load. If load throws synchronously, return a rejected promise with that error.',
        starter: {
            js: `function createCoalescer(load) {
    const pending = new Map();

    return function get(key) {
        if (pending.has(key)) return pending.get(key);

        const request = Promise.resolve(load(key)).then((value) => {
            pending.delete(key);
            return value;
        });
        pending.set(key, request);
        return request;
    };
}`,
            ts: `function createCoalescer<Key, Value>(
    load: (key: Key) => Value | PromiseLike<Value>,
) {
    const pending = new Map<Key, Promise<Value>>();

    return function get(key: Key): Promise<Value> {
        const current = pending.get(key);
        if (current) return current;

        const request = Promise.resolve(load(key)).then((value) => {
            pending.delete(key);
            return value;
        });
        pending.set(key, request);
        return request;
    };
}`,
        },
        checks: [
            {
                name: 'Shares one promise until the request settles',
                body: `
let calls = 0;
let release;
const value = new Promise((resolve) => { release = resolve; });
const get = createCoalescer(() => { calls += 1; return value; });
const first = get('profile');
const second = get('profile');
release('done');
assert(first === second, 'Overlapping calls should get the same promise object.');
assert(await first === 'done', 'Both callers should receive the loader result.');
assert(calls === 1, 'The loader should run once for overlapping calls.');
const third = get('profile');
await third;
assert(third !== first && calls === 2, 'A fulfilled request should release its key.');
`,
            },
            {
                name: 'Starts requests independently by key',
                body: `
const seen = [];
let release;
const pending = new Promise((resolve) => { release = resolve; });
const get = createCoalescer((key) => {
    seen.push(key);
    return key === 'slow' ? pending : key;
});
const slow = get('slow');
assert(await get('fast') === 'fast', 'The fast key should resolve while the slow key is pending.');
release('slow');
assert(await slow === 'slow', 'The first key should keep its own result.');
assert(seen.length === 2 && seen.includes('slow') && seen.includes('fast'), 'Each key should load once.');
`,
            },
            {
                name: 'Releases a rejected request for retry',
                body: `
const failure = new Error('network');
let calls = 0;
const get = createCoalescer(async () => {
    if (++calls === 1) throw failure;
    return 'recovered';
});
const first = get('profile');
const second = get('profile');
const outcomes = await Promise.allSettled([first, second]);
assert(first === second, 'Calls should share the pending request even when it fails.');
assert(outcomes.every((outcome) => outcome.status === 'rejected' && outcome.reason === failure),
    'All callers should receive the original failure.');
const [retry] = await Promise.allSettled([get('profile')]);
assert(retry.status === 'fulfilled' && retry.value === 'recovered' && calls === 2,
    'A failed key should start a fresh request on the next call.');
`,
            },
            {
                name: 'Turns a synchronous throw into a rejection',
                body: `
const failure = new Error('invalid connection');
let calls = 0;
const get = createCoalescer(() => {
    if (++calls === 1) throw failure;
    return 'ok';
});
let request;
try {
    request = get('profile');
} catch {
    assert(false, 'get should return a promise even when load throws synchronously.');
}
assert(typeof request?.then === 'function', 'get should return a promise.');
const [outcome] = await Promise.allSettled([request]);
assert(outcome.status === 'rejected' && outcome.reason === failure, 'Preserve the original error.');
assert(await get('profile') === 'ok', 'The key should be available for retry.');
`,
            },
        ],
    },
    {
        id: 'repair-lru',
        title: 'The cache evicts the wrong entry',
        topic: 'internals',
        prompt: 'A recently used cache entry can still be evicted if it was updated or stores undefined. Repair createLru(capacity), where capacity is a non-negative integer. get(key) returns the value and makes an existing key most recent. set(key, value) inserts or updates a key and makes it most recent. has(key) checks membership without affecting recency. Evict the least recently used entry when over capacity. A zero-capacity cache stores nothing.',
        starter: {
            js: `function createLru(capacity) {
    const entries = new Map();

    return {
        get(key) {
            const value = entries.get(key);
            if (value !== undefined) {
                entries.delete(key);
                entries.set(key, value);
            }
            return value;
        },
        set(key, value) {
            entries.set(key, value);
            if (capacity > 0 && entries.size > capacity) {
                entries.delete(entries.keys().next().value);
            }
        },
        has(key) {
            return entries.has(key);
        },
    };
}`,
            ts: `function createLru<Key, Value>(capacity: number) {
    const entries = new Map<Key, Value>();

    return {
        get(key: Key) {
            const value = entries.get(key);
            if (value !== undefined) {
                entries.delete(key);
                entries.set(key, value);
            }
            return value;
        },
        set(key: Key, value: Value) {
            entries.set(key, value);
            if (capacity > 0 && entries.size > capacity) {
                const oldest = entries.keys().next();
                if (!oldest.done) entries.delete(oldest.value);
            }
        },
        has(key: Key) {
            return entries.has(key);
        },
    };
}`,
        },
        checks: [
            {
                name: 'Promotes reads but leaves membership checks neutral',
                body: `
const cache = createLru(2);
cache.set('a', 0);
cache.set('b', 2);
assert(cache.get('a') === 0 && cache.has('b'), 'Read the exact stored value and report membership.');
assert(cache.get('missing') === undefined, 'A missing read should return undefined.');
cache.set('c', 3);
assert(cache.has('a') && !cache.has('b') && cache.has('c'), 'get should promote a, while has should leave b least recent.');
`,
            },
            {
                name: 'Makes an updated key most recent',
                body: `
const cache = createLru(2);
cache.set('a', 1);
cache.set('b', 2);
cache.set('a', 3);
assert(cache.has('a') && cache.has('b'), 'Updating a key should leave room for both entries.');
cache.set('c', 4);
assert(cache.get('a') === 3 && !cache.has('b'), 'The update should promote a and preserve its new value.');
`,
            },
            {
                name: 'Promotes a stored undefined value',
                body: `
const cache = createLru(2);
cache.set('a', undefined);
cache.set('b', 2);
assert(cache.has('a') && cache.get('a') === undefined, 'A stored undefined still belongs to the cache.');
cache.set('c', 3);
assert(cache.has('a') && !cache.has('b'), 'Reading a stored undefined should still change recency.');
`,
            },
            {
                name: 'Keeps a zero-capacity cache empty',
                body: `
const cache = createLru(0);
cache.set('a', 1);
assert(!cache.has('a') && cache.get('a') === undefined, 'Zero capacity should retain no values.');
`,
            },
        ],
    },
];
