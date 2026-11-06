import type { Challenge } from './challenges';

export const weekendIntermediateA: Challenge[] = [
  {
    id: 'weekend-20',
    topic: 'weekend-intermediate',
    title: 'Sum transactions by user',
    difficulty: 'Medium',
    sourceOrder: 20,
    prompt: 'Given transactions with a user and amount, return an object that maps each user to their total amount. Include negative amounts in the sum.',
    example: '[{user: "ana", amount: 7}, {user: "lee", amount: 8}, {user: "ana", amount: -2}] → {ana: 5, lee: 8}',
    solutions: {
      js: `function sumByUser(transactions) {
    const totals = new Map();

    for (const { user, amount } of transactions) {
        totals.set(user, (totals.get(user) ?? 0) + amount);
    }

    return Object.fromEntries(totals);
}`,
      ts: `type Transaction = { user: string; amount: number };

function sumByUser(transactions: readonly Transaction[]): Record<string, number> {
    const totals = new Map<string, number>();

    for (const { user, amount } of transactions) {
        totals.set(user, (totals.get(user) ?? 0) + amount);
    }

    return Object.fromEntries(totals);
}`,
    },
  },
  {
    id: 'weekend-21',
    topic: 'weekend-intermediate',
    title: 'Build an ID-to-name lookup',
    difficulty: 'Medium',
    sourceOrder: 21,
    prompt: 'Turn an API response of objects with id and name fields into a lookup object. If an ID occurs more than once, use the last name.',
    example: '[{id: 41, name: "Ana"}, {id: 52, name: "Lee"}] → {41: "Ana", 52: "Lee"}',
    solutions: {
      js: `function namesById(items) {
    const entries = items.map(({ id, name }) => [id, name]);
    return Object.fromEntries(entries);
}`,
      ts: `type NamedItem = { id: string | number; name: string };

function namesById(items: readonly NamedItem[]): Record<string, string> {
    const entries = items.map(({ id, name }) => [id, name] as const);
    return Object.fromEntries(entries);
}`,
    },
  },
  {
    id: 'weekend-22',
    topic: 'weekend-intermediate',
    title: 'Remove falsy object values',
    difficulty: 'Medium',
    sourceOrder: 22,
    prompt: 'Return a new object containing only the entries with truthy values. Apply JavaScript truthiness to each value.',
    example: '{a: 0, b: "0", c: null, d: true, e: NaN, f: ""} → {b: "0", d: true}',
    solutions: {
      js: `function compactValues(record) {
    const entries = Object.entries(record);
    return Object.fromEntries(entries.filter(([, value]) => Boolean(value)));
}`,
      ts: `function compactValues<T>(record: Readonly<Record<string, T>>): Record<string, T> {
    const entries = Object.entries(record);
    return Object.fromEntries(entries.filter(([, value]) => Boolean(value)));
}`,
    },
  },
  {
    id: 'weekend-23',
    topic: 'weekend-intermediate',
    title: 'Check role permissions',
    difficulty: 'Medium',
    sourceOrder: 23,
    prompt: 'Given a lookup of roles to allowed permissions, return whether a particular role has the requested permission. Unknown roles have no permissions.',
    example: '{owner: ["share", "edit"], member: ["edit"]}, "member", "share" → false',
    solutions: {
      js: `function hasPermission(permissions, role, permission) {
    if (!Object.hasOwn(permissions, role)) return false;
    return permissions[role].includes(permission);
}`,
      ts: `function hasPermission(
    permissions: Readonly<Record<string, readonly string[]>>,
    role: string,
    permission: string,
): boolean {
    if (!Object.hasOwn(permissions, role)) return false;
    return permissions[role].includes(permission);
}`,
    },
  },
  {
    id: 'weekend-24',
    topic: 'weekend-intermediate',
    title: 'Calculate revenue by category',
    difficulty: 'Medium',
    sourceOrder: 24,
    prompt: 'Given a list of sold products, return the sum of their prices for each category.',
    example: '[{category: "books", price: 21}, {category: "games", price: 12}, {category: "books", price: 6}] → {books: 27, games: 12}',
    solutions: {
      js: `function revenueByCategory(sales) {
    const revenue = new Map();

    for (const { category, price } of sales) {
        const total = revenue.get(category) ?? 0;
        revenue.set(category, total + price);
    }

    return Object.fromEntries(revenue);
}`,
      ts: `type Sale = { category: string; price: number };

function revenueByCategory(sales: readonly Sale[]): Record<string, number> {
    const revenue = new Map<string, number>();

    for (const { category, price } of sales) {
        const total = revenue.get(category) ?? 0;
        revenue.set(category, total + price);
    }

    return Object.fromEntries(revenue);
}`,
    },
  },
  {
    id: 'weekend-25',
    topic: 'weekend-intermediate',
    title: 'Deduplicate objects by ID',
    difficulty: 'Medium',
    sourceOrder: 25,
    prompt: 'Return the first object for each distinct ID, keeping those objects in their original order.',
    example: '[{id: 4, name: "Ana"}, {id: 9, name: "Lee"}, {id: 4, name: "Duplicate"}] → [{id: 4, name: "Ana"}, {id: 9, name: "Lee"}]',
    solutions: {
      js: `function uniqueById(items) {
    const seen = new Set();

    return items.filter(({ id }) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });
}`,
      ts: `function uniqueById<T extends { id: string | number }>(items: readonly T[]): T[] {
    const seen = new Set<string | number>();

    return items.filter(({ id }) => {
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });
}`,
    },
  },
  {
    id: 'weekend-26',
    topic: 'weekend-intermediate',
    title: 'Chunk object entries',
    difficulty: 'Medium',
    sourceOrder: 26,
    prompt: 'Divide Object.entries(record) into arrays of at most size entries, preserving order. Throw RangeError if size is not a positive integer.',
    example: '{a: 1, b: 2, c: 3}, 2 → [[["a", 1], ["b", 2]], [["c", 3]]]',
    solutions: {
      js: `function chunkEntries(record, size) {
    if (!Number.isInteger(size) || size < 1) {
        throw new RangeError("Chunk size must be a positive integer.");
    }

    const entries = Object.entries(record);
    const chunks = [];

    for (let start = 0; start < entries.length; start += size) {
        chunks.push(entries.slice(start, start + size));
    }

    return chunks;
}`,
      ts: `function chunkEntries<T>(record: Readonly<Record<string, T>>, size: number): [string, T][][] {
    if (!Number.isInteger(size) || size < 1) {
        throw new RangeError("Chunk size must be a positive integer.");
    }

    const entries = Object.entries(record);
    const chunks: [string, T][][] = [];

    for (let start = 0; start < entries.length; start += size) {
        chunks.push(entries.slice(start, start + size));
    }

    return chunks;
}`,
    },
  },
  {
    id: 'weekend-27',
    topic: 'weekend-intermediate',
    title: 'Find the longest string value',
    difficulty: 'Medium',
    sourceOrder: 27,
    prompt: 'Return the longest string among the values of an object. Keep the first value on ties and return null for an empty object.',
    example: '{short: "lime", long: "blueberry", tie: "cranberry"} → "blueberry"',
    solutions: {
      js: `function longestValue(record) {
    let longest = null;

    for (const value of Object.values(record)) {
        if (longest === null || value.length > longest.length) {
            longest = value;
        }
    }

    return longest;
}`,
      ts: `function longestValue(record: Readonly<Record<string, string>>): string | null {
    let longest: string | null = null;

    for (const value of Object.values(record)) {
        if (longest === null || value.length > longest.length) {
            longest = value;
        }
    }

    return longest;
}`,
    },
  },
  {
    id: 'weekend-28',
    topic: 'weekend-intermediate',
    title: 'Transpose translations by key',
    difficulty: 'Medium',
    sourceOrder: 28,
    prompt: 'Turn a language-to-translations dictionary into a translation-key-to-languages dictionary. Include only languages that supply each key.',
    example: '{en: {yes: "Yes", no: "No"}, fr: {yes: "Oui"}} → {yes: {en: "Yes", fr: "Oui"}, no: {en: "No"}}',
    solutions: {
      js: `function translationsByKey(dictionaries) {
    const keys = new Map();

    for (const [language, dictionary] of Object.entries(dictionaries)) {
        for (const [key, text] of Object.entries(dictionary)) {
            if (!keys.has(key)) keys.set(key, new Map());
            keys.get(key).set(language, text);
        }
    }

    return Object.fromEntries(
        Array.from(keys, ([key, texts]) => [key, Object.fromEntries(texts)]),
    );
}`,
      ts: `type Dictionary = Readonly<Record<string, string>>;

function translationsByKey(dictionaries: Readonly<Record<string, Dictionary>>) {
    const keys = new Map<string, Map<string, string>>();

    for (const [language, dictionary] of Object.entries(dictionaries)) {
        for (const [key, text] of Object.entries(dictionary)) {
            const texts = keys.get(key) ?? new Map<string, string>();
            texts.set(language, text);
            keys.set(key, texts);
        }
    }

    return Object.fromEntries(
        Array.from(keys, ([key, texts]) => [key, Object.fromEntries(texts)] as const),
    );
}`,
    },
  },
  {
    id: 'weekend-29',
    topic: 'weekend-intermediate',
    title: 'Group IDs by category',
    difficulty: 'Medium',
    sourceOrder: 29,
    prompt: 'Return a lookup from each category to the IDs of its items. Preserve the input order of IDs within each category.',
    example: '[{id: 41, category: "books"}, {id: 52, category: "games"}, {id: 93, category: "books"}] → {books: [41, 93], games: [52]}',
    solutions: {
      js: `function idsByCategory(items) {
    const groups = new Map();

    for (const { id, category } of items) {
        const ids = groups.get(category) ?? [];
        ids.push(id);
        groups.set(category, ids);
    }

    return Object.fromEntries(groups);
}`,
      ts: `type Categorized<Id> = { id: Id; category: string };

function idsByCategory<Id extends string | number>(
    items: readonly Categorized<Id>[],
): Record<string, Id[]> {
    const groups = new Map<string, Id[]>();

    for (const { id, category } of items) {
        const ids = groups.get(category) ?? [];
        ids.push(id);
        groups.set(category, ids);
    }

    return Object.fromEntries(groups);
}`,
    },
  },
  {
    id: 'weekend-30',
    topic: 'weekend-intermediate',
    title: 'Remove a key from nested objects',
    difficulty: 'Medium',
    sourceOrder: 30,
    prompt: 'Given a JSON value and a key, return a copy with that key removed from every object. Visit objects inside arrays and preserve array order.',
    example: '{name: "Ana", token: "x", sessions: [{token: "y", active: true}, null]}, "token" → {name: "Ana", sessions: [{active: true}, null]}',
    solutions: {
      js: `function withoutKey(value, key) {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map((item) => withoutKey(item, key));

    const entries = Object.entries(value)
        .filter(([name]) => name !== key)
        .map(([name, item]) => [name, withoutKey(item, key)]);

    return Object.fromEntries(entries);
}`,
      ts: `type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

function withoutKey(value: Json, key: string): Json {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map((item) => withoutKey(item, key));

    const entries = Object.entries(value)
        .filter(([name]) => name !== key)
        .map(([name, item]) => [name, withoutKey(item, key)] as const);

    return Object.fromEntries(entries);
}`,
    },
  },
];
