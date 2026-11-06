import type { Challenge } from './challenges';

export const weekendIntermediateB: Challenge[] = [
    {
        id: 'weekend-31',
        sourceOrder: 31,
        topic: 'weekend-intermediate',
        title: 'Compare nested values',
        difficulty: 'Medium',
        prompt: 'Implement deepEqual(left, right) for JSON-like values. Compare arrays by position and objects by their own keys and values. Object key order is irrelevant, and an array differs from an object with numeric keys.',
        example: "deepEqual({ grid: [[2], [4]] }, { grid: [[2], [4]] }) → true",
        solutions: {
            js: `function deepEqual(left, right) {
    if (Object.is(left, right)) return true;
    if (left === null || right === null ||
        typeof left !== 'object' || typeof right !== 'object') return false;

    if (Array.isArray(left)) {
        return Array.isArray(right) && left.length === right.length &&
            left.every((value, index) => deepEqual(value, right[index]));
    }
    if (Array.isArray(right)) return false;

    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length &&
        keys.every(key => Object.hasOwn(right, key) && deepEqual(left[key], right[key]));
}`,
            ts: `type JsonValue = null | boolean | number | string | JsonValue[] |
    { [key: string]: JsonValue };

function deepEqual(left: JsonValue, right: JsonValue): boolean {
    if (Object.is(left, right)) return true;
    if (left === null || right === null ||
        typeof left !== 'object' || typeof right !== 'object') return false;

    if (Array.isArray(left)) {
        return Array.isArray(right) && left.length === right.length &&
            left.every((value, index) => deepEqual(value, right[index]));
    }
    if (Array.isArray(right)) return false;

    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length &&
        keys.every(key => Object.hasOwn(right, key) && deepEqual(left[key], right[key]));
}`,
        },
    },
    {
        id: 'weekend-32',
        sourceOrder: 32,
        topic: 'weekend-intermediate',
        title: 'Flatten arrays within a record',
        difficulty: 'Medium',
        prompt: 'Implement flattenGroups(groups). Each key holds an array that can nest numbers at any depth. Return a new record with the same keys and the numbers from each group in their original order.',
        example: 'flattenGroups({ left: [5, [[8]]], right: [[], [13, 21]] }) → { left: [5, 8], right: [13, 21] }',
        solutions: {
            js: `function flattenGroups(groups) {
    function flatten(values) {
        return values.flatMap(value => Array.isArray(value) ? flatten(value) : [value]);
    }

    return Object.fromEntries(
        Object.entries(groups).map(([key, values]) => [key, flatten(values)]),
    );
}`,
            ts: `type NestedNumbers = (number | NestedNumbers)[];

function flattenGroups(groups: Record<string, NestedNumbers>): Record<string, number[]> {
    function flatten(values: NestedNumbers): number[] {
        return values.flatMap(value => Array.isArray(value) ? flatten(value) : [value]);
    }

    return Object.fromEntries(
        Object.entries(groups).map(([key, values]) => [key, flatten(values)]),
    );
}`,
        },
    },
    {
        id: 'weekend-33',
        sourceOrder: 33,
        topic: 'weekend-intermediate',
        title: 'Find the most frequent word',
        difficulty: 'Medium',
        prompt: 'Implement mostFrequentWord(groups). Count every word across the arrays in the record. Return the word with the largest count. On a tie, return the one you encountered first. Return undefined when there are no words.',
        example: "mostFrequentWord({ shelf: ['oak', 'ash'], desk: ['ash', 'elm'] }) → 'ash'",
        solutions: {
            js: `function mostFrequentWord(groups) {
    const counts = new Map();
    for (const words of Object.values(groups)) {
        for (const word of words) {
            counts.set(word, (counts.get(word) ?? 0) + 1);
        }
    }

    let winner;
    let highest = 0;
    for (const [word, count] of counts) {
        if (count > highest) {
            winner = word;
            highest = count;
        }
    }
    return winner;
}`,
            ts: `function mostFrequentWord(groups: Record<string, string[]>): string | undefined {
    const counts = new Map<string, number>();
    for (const words of Object.values(groups)) {
        for (const word of words) {
            counts.set(word, (counts.get(word) ?? 0) + 1);
        }
    }

    let winner: string | undefined;
    let highest = 0;
    for (const [word, count] of counts) {
        if (count > highest) {
            winner = word;
            highest = count;
        }
    }
    return winner;
}`,
        },
    },
    {
        id: 'weekend-34',
        sourceOrder: 34,
        topic: 'weekend-intermediate',
        title: 'Intersect all groups',
        difficulty: 'Medium',
        prompt: 'Implement intersectGroups(groups). Return the distinct numbers that appear in every array in the record, in their order of first appearance in the first array. An empty record returns an empty array.',
        example: 'intersectGroups({ north: [8, 5, 2], south: [5, 8, 3], west: [1, 8, 5] }) → [8, 5]',
        solutions: {
            js: `function intersectGroups(groups) {
    const [first = [], ...rest] = Object.values(groups);
    const sets = rest.map(values => new Set(values));
    return [...new Set(first)].filter(value => sets.every(set => set.has(value)));
}`,
            ts: `function intersectGroups(groups: Record<string, number[]>): number[] {
    const [first = [], ...rest] = Object.values(groups);
    const sets = rest.map(values => new Set(values));
    return [...new Set(first)].filter(value => sets.every(set => set.has(value)));
}`,
        },
    },
    {
        id: 'weekend-35',
        sourceOrder: 35,
        topic: 'weekend-intermediate',
        title: 'Merge nested records',
        difficulty: 'Medium',
        prompt: 'Implement deepMerge(left, right) for plain records with JSON-like values. Keep unique keys from both sides. Recursively merge shared keys when both values are records. For other shared keys, take the right value. Treat arrays as whole values and leave both inputs intact.',
        example: 'deepMerge({ panel: { gap: 4, wide: true } }, { panel: { gap: 8, rows: 2 } }) → { panel: { gap: 8, wide: true, rows: 2 } }',
        solutions: {
            js: `function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(left, right) {
    const overrides = Object.entries(right).map(([key, value]) => {
        const previous = Object.hasOwn(left, key) ? left[key] : undefined;
        const merged = isRecord(previous) && isRecord(value) ? deepMerge(previous, value) : value;
        return [key, merged];
    });

    return Object.fromEntries([...Object.entries(left), ...overrides]);
}`,
            ts: `type MergeValue = null | boolean | number | string | MergeValue[] | MergeRecord;
type MergeRecord = { [key: string]: MergeValue };

function isRecord(value: MergeValue | undefined): value is MergeRecord {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(left: MergeRecord, right: MergeRecord): MergeRecord {
    const overrides = Object.entries(right).map(([key, value]): [string, MergeValue] => {
        const previous = Object.hasOwn(left, key) ? left[key] : undefined;
        const merged = isRecord(previous) && isRecord(value) ? deepMerge(previous, value) : value;
        return [key, merged];
    });

    return Object.fromEntries([...Object.entries(left), ...overrides]);
}`,
        },
    },
    {
        id: 'weekend-36',
        sourceOrder: 36,
        topic: 'weekend-intermediate',
        title: 'Destructure a nested profile',
        difficulty: 'Medium',
        prompt: 'Implement profileSummary(account). Use nested object destructuring to read name and age from account.user.profile. Return an object containing just those two fields. Assume the nested profile is present.',
        example: "profileSummary({ user: { profile: { name: 'Nora', age: 29 } } }) → { name: 'Nora', age: 29 }",
        solutions: {
            js: `function profileSummary(account) {
    const { user: { profile: { name, age } } } = account;
    return { name, age };
}`,
            ts: `type Profile = { name: string; age: number };
type Account = { user: { profile: Profile } };

function profileSummary(account: Account): Profile {
    const { user: { profile: { name, age } } } = account;
    return { name, age };
}`,
        },
    },
    {
        id: 'weekend-37',
        sourceOrder: 37,
        topic: 'weekend-intermediate',
        title: 'Rank keys by value',
        difficulty: 'Medium',
        prompt: 'Implement topKeys(scores, n). Return up to n keys, starting with the highest numeric score. Break ties by the record’s entry order. Assume n is a nonnegative integer.',
        example: "topKeys({ wave: 12, stone: 3, reed: 16, hill: 10 }, 2) → ['reed', 'wave']",
        solutions: {
            js: `function topKeys(scores, n) {
    return Object.entries(scores)
        .sort(([, first], [, second]) => second - first)
        .slice(0, n)
        .map(([key]) => key);
}`,
            ts: `function topKeys(scores: Record<string, number>, n: number): string[] {
    return Object.entries(scores)
        .sort(([, first], [, second]) => second - first)
        .slice(0, n)
        .map(([key]) => key);
}`,
        },
    },
    {
        id: 'weekend-38',
        sourceOrder: 38,
        topic: 'weekend-intermediate',
        title: 'Sort by name and age',
        difficulty: 'Medium',
        prompt: 'Implement sortPeople(people). Return a copy ordered alphabetically by name and then from youngest to oldest among people with the same name.',
        example: "sortPeople([{ name: 'Sam', age: 42 }, { name: 'Jo', age: 33 }, { name: 'Sam', age: 25 }]) → [{ name: 'Jo', age: 33 }, { name: 'Sam', age: 25 }, { name: 'Sam', age: 42 }]",
        solutions: {
            js: `function sortPeople(people) {
    return [...people].sort((left, right) =>
        left.name.localeCompare(right.name) || left.age - right.age,
    );
}`,
            ts: `type Person = { name: string; age: number };

function sortPeople(people: Person[]): Person[] {
    return [...people].sort((left, right) =>
        left.name.localeCompare(right.name) || left.age - right.age,
    );
}`,
        },
    },
    {
        id: 'weekend-39',
        sourceOrder: 39,
        topic: 'weekend-intermediate',
        title: 'Reconcile expected and actual items',
        difficulty: 'Medium',
        prompt: 'Implement reconcile(expected, actual). Report the strings missing from actual and the extra strings it contains. Each output list should contain each item once and follow the order of the input it came from.',
        example: "reconcile(['draft', 'review'], ['review', 'published']) → { missing: ['draft'], extra: ['published'] }",
        solutions: {
            js: `function reconcile(expected, actual) {
    const wanted = new Set(expected);
    const received = new Set(actual);

    return {
        missing: [...wanted].filter(item => !received.has(item)),
        extra: [...received].filter(item => !wanted.has(item)),
    };
}`,
            ts: `function reconcile(expected: string[], actual: string[]) {
    const wanted = new Set(expected);
    const received = new Set(actual);

    return {
        missing: [...wanted].filter(item => !received.has(item)),
        extra: [...received].filter(item => !wanted.has(item)),
    };
}`,
        },
    },
    {
        id: 'weekend-40',
        sourceOrder: 40,
        topic: 'weekend-intermediate',
        title: 'Overlay one record on another',
        difficulty: 'Medium',
        prompt: 'Implement mergeRecords(base, override). Copy both records into a new object. When a key appears on both sides, use the complete value from override. Leave both inputs intact.',
        example: "mergeRecords({ zoom: 2, theme: 'light' }, { theme: 'dark', grid: true }) → { zoom: 2, theme: 'dark', grid: true }",
        solutions: {
            js: `function mergeRecords(base, override) {
    return { ...base, ...override };
}`,
            ts: `function mergeRecords(base: Record<string, unknown>, override: Record<string, unknown>) {
    return { ...base, ...override };
}`,
        },
    },
];
