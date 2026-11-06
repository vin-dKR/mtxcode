import type { Challenge, Topic } from './challenges';
import { weekendIntermediateA } from './weekend-intermediate-a';
import { weekendIntermediateB } from './weekend-intermediate-b';

export const weekendTopics: Topic[] = [
    {
        id: 'weekend-keys',
        label: 'Weekend JS · Keys & Lookups',
        description: 'Read, select, reverse, and index the keys of JavaScript objects.',
    },
    {
        id: 'weekend-values',
        label: 'Weekend JS · Value Transforms',
        description: 'Filter, flatten, sort, and convert values in objects and arrays.',
    },
    {
        id: 'weekend-totals',
        label: 'Weekend JS · Groups & Totals',
        description: 'Group records, count occurrences, and compare sums and averages.',
    },
    {
        id: 'weekend-shaping',
        label: 'Weekend JS · Data Shaping',
        description: 'Turn transactions and rows into totals, indexes, and clean records.',
    },
    {
        id: 'weekend-nested',
        label: 'Weekend JS · Nested Structures',
        description: 'Walk, compare, and reshape data stored several levels deep.',
    },
    {
        id: 'weekend-analysis',
        label: 'Weekend JS · Compare & Reconcile',
        description: 'Rank values, check permissions, and find overlap or differences.',
    },
];

const basicChallenges: Challenge[] = [
    {
        id: 'weekend-01',
        topic: 'weekend-totals',
        title: 'Total each group',
        difficulty: 'Easy',
        prompt: 'Given an object whose values are arrays of numbers, return an object with the same keys and the sum of each array. The sum of an empty array is zero.',
        example: 'sumGroups({ books: [4, 9], snacks: [3], fares: [] }) → { books: 13, snacks: 3, fares: 0 }',
        solutions: {
            js: `function sumGroups(groups) {
    return Object.fromEntries(
        Object.entries(groups).map(([key, values]) => [
            key,
            values.reduce((total, value) => total + value, 0),
        ]),
    );
}`,
            ts: `function sumGroups(groups: Record<string, readonly number[]>): Record<string, number> {
    return Object.fromEntries(
        Object.entries(groups).map(([key, values]) => [
            key,
            values.reduce((total, value) => total + value, 0),
        ]),
    );
}`,
        },
    },
    {
        id: 'weekend-02',
        topic: 'weekend-totals',
        title: 'Build a word tally',
        difficulty: 'Easy',
        prompt: 'Return an object that records how many times each distinct word occurs in the input array. Treat uppercase and lowercase letters as different.',
        example: 'countWords(["red", "blue", "red", "Red"]) → { red: 2, blue: 1, Red: 1 }',
        solutions: {
            js: `function countWords(words) {
    const counts = new Map();

    for (const word of words) {
        counts.set(word, (counts.get(word) ?? 0) + 1);
    }

    return Object.fromEntries(counts);
}`,
            ts: `function countWords(words: readonly string[]): Record<string, number> {
    const counts = new Map<string, number>();

    for (const word of words) {
        counts.set(word, (counts.get(word) ?? 0) + 1);
    }

    return Object.fromEntries(counts);
}`,
        },
    },
    {
        id: 'weekend-03',
        topic: 'weekend-keys',
        title: 'Reverse a string lookup',
        difficulty: 'Easy',
        prompt: 'Build an object where each original string value becomes a key and its original key becomes the value. If a string value repeats, keep the last key for it.',
        example: 'reverseLookup({ home: "H", work: "W", office: "W" }) → { H: "home", W: "office" }',
        solutions: {
            js: `function reverseLookup(lookup) {
    return Object.fromEntries(
        Object.entries(lookup).map(([key, value]) => [value, key]),
    );
}`,
            ts: `function reverseLookup(lookup: Record<string, string>): Record<string, string> {
    return Object.fromEntries(
        Object.entries(lookup).map(([key, value]) => [value, key]),
    );
}`,
        },
    },
    {
        id: 'weekend-04',
        topic: 'weekend-totals',
        title: 'Pick the key with the maximum',
        difficulty: 'Easy',
        prompt: 'Return the key with the greatest numeric value. Use the first key in entry order if values tie, and return undefined for an empty object. Assume finite numbers.',
        example: 'maxKey({ first: -4, second: -1, third: -1 }) → "second"',
        solutions: {
            js: `function maxKey(values) {
    let bestKey;
    let bestValue = -Infinity;

    for (const [key, value] of Object.entries(values)) {
        if (value > bestValue) {
            bestKey = key;
            bestValue = value;
        }
    }

    return bestKey;
}`,
            ts: `function maxKey(values: Record<string, number>): string | undefined {
    let bestKey: string | undefined;
    let bestValue = -Infinity;

    for (const [key, value] of Object.entries(values)) {
        if (value > bestValue) {
            bestKey = key;
            bestValue = value;
        }
    }

    return bestKey;
}`,
        },
    },
    {
        id: 'weekend-05',
        topic: 'weekend-values',
        title: 'Join the arrays in a record',
        difficulty: 'Easy',
        prompt: 'Return a single array containing all the elements of the object’s array values. Visit the values in Object.values() order and keep the order within each array.',
        example: 'joinGroups({ morning: ["tea", "toast"], evening: ["soup"] }) → ["tea", "toast", "soup"]',
        solutions: {
            js: `function joinGroups(groups) {
    return Object.values(groups).flat();
}`,
            ts: `function joinGroups<Item>(groups: Record<string, readonly Item[]>): Item[] {
    return Object.values(groups).flat();
}`,
        },
    },
    {
        id: 'weekend-06',
        topic: 'weekend-totals',
        title: 'Collect names by city',
        difficulty: 'Easy',
        prompt: 'Given people with name and city properties, return a record from city to an array of names. Keep the original order within each city.',
        example: 'namesByCity([{ name: "Asha", city: "Pune" }, { name: "Ira", city: "Pune" }]) → { Pune: ["Asha", "Ira"] }',
        solutions: {
            js: `function namesByCity(people) {
    const groups = new Map();

    for (const { city, name } of people) {
        if (!groups.has(city)) groups.set(city, []);
        groups.get(city).push(name);
    }

    return Object.fromEntries(groups);
}`,
            ts: `function namesByCity(people: readonly { city: string; name: string }[]): Record<string, string[]> {
    const groups = new Map<string, string[]>();

    for (const { city, name } of people) {
        const names = groups.get(city);
        if (names) names.push(name);
        else groups.set(city, [name]);
    }

    return Object.fromEntries(groups);
}`,
        },
    },
    {
        id: 'weekend-07',
        topic: 'weekend-values',
        title: 'Keep scores above fifty',
        difficulty: 'Easy',
        prompt: 'Create a new object containing only the entries whose numeric values are strictly greater than 50.',
        example: 'aboveFifty({ blue: 50, green: 62, amber: 49 }) → { green: 62 }',
        solutions: {
            js: `function aboveFifty(scores) {
    return Object.fromEntries(
        Object.entries(scores).filter(([, score]) => score > 50),
    );
}`,
            ts: `function aboveFifty(scores: Record<string, number>): Record<string, number> {
    return Object.fromEntries(
        Object.entries(scores).filter(([, score]) => score > 50),
    );
}`,
        },
    },
    {
        id: 'weekend-08',
        topic: 'weekend-totals',
        title: 'Find the best average grade',
        difficulty: 'Easy',
        prompt: 'Given a record of students and their grades from 0 to 100, return the name with the highest arithmetic mean. Skip empty grade lists and keep the first student in entry order if averages tie. Return undefined when nobody has grades.',
        example: 'bestAverage({ Ria: [72, 86], Dev: [83], Nila: [] }) → "Dev"',
        solutions: {
            js: `function bestAverage(grades) {
    let winner;
    let highest = -Infinity;

    for (const [student, marks] of Object.entries(grades)) {
        if (marks.length === 0) continue;
        const average = marks.reduce((total, mark) => total + mark, 0) / marks.length;

        if (average > highest) {
            winner = student;
            highest = average;
        }
    }

    return winner;
}`,
            ts: `function bestAverage(grades: Record<string, readonly number[]>): string | undefined {
    let winner: string | undefined;
    let highest = -Infinity;

    for (const [student, marks] of Object.entries(grades)) {
        if (marks.length === 0) continue;
        const average = marks.reduce((total, mark) => total + mark, 0) / marks.length;

        if (average > highest) {
            winner = student;
            highest = average;
        }
    }

    return winner;
}`,
        },
    },
    {
        id: 'weekend-09',
        topic: 'weekend-values',
        title: 'Collect distinct array elements',
        difficulty: 'Easy',
        prompt: 'Combine the array values of a record into one array without duplicates. Keep each value at the position of its first appearance in Object.values() order.',
        example: 'distinctGroups({ first: [7, 1, 7], second: [1, 3] }) → [7, 1, 3]',
        solutions: {
            js: `function distinctGroups(groups) {
    return [...new Set(Object.values(groups).flat())];
}`,
            ts: `function distinctGroups<Item>(groups: Record<string, readonly Item[]>): Item[] {
    return [...new Set(Object.values(groups).flat())];
}`,
        },
    },
    {
        id: 'weekend-10',
        topic: 'weekend-keys',
        title: 'Select fields by name',
        difficulty: 'Easy',
        prompt: 'Given an object and a list of its own string keys, create a new object with those properties and their original values. Assume every requested key is present.',
        example: 'pickFields({ item: "lamp", stock: 4, color: "green" }, ["item", "color"]) → { item: "lamp", color: "green" }',
        solutions: {
            js: `function pickFields(source, keys) {
    return Object.fromEntries(keys.map(key => [key, source[key]]));
}`,
            ts: `function pickFields<Source extends object, Key extends keyof Source & string>(
    source: Source,
    keys: readonly Key[],
): Pick<Source, Key> {
    return Object.fromEntries(keys.map(key => [key, source[key]])) as Pick<Source, Key>;
}`,
        },
    },
    {
        id: 'weekend-11',
        topic: 'weekend-totals',
        title: 'Find the best average with reduce',
        difficulty: 'Easy',
        prompt: 'Revisit the grade challenge using reduce() to track the leading student. Grades range from 0 to 100. Skip students without grades and keep the first student in entry order when averages tie. Return undefined when nobody has grades.',
        example: 'bestAverage({ Mei: [90, 70], Ravi: [80, 80, 80], Jo: [76] }) → "Mei"',
        solutions: {
            js: `function bestAverage(grades) {
    const best = Object.entries(grades).reduce((leader, [name, marks]) => {
        if (marks.length === 0) return leader;
        const average = marks.reduce((total, mark) => total + mark, 0) / marks.length;
        return !leader || average > leader.average ? { name, average } : leader;
    }, undefined);

    return best?.name;
}`,
            ts: `function bestAverage(grades: Record<string, readonly number[]>): string | undefined {
    type Leader = { name: string; average: number };
    const best = Object.entries(grades).reduce<Leader | undefined>((leader, [name, marks]) => {
        if (marks.length === 0) return leader;
        const average = marks.reduce((total, mark) => total + mark, 0) / marks.length;
        return !leader || average > leader.average ? { name, average } : leader;
    }, undefined);

    return best?.name;
}`,
        },
    },
    {
        id: 'weekend-12',
        topic: 'weekend-values',
        title: 'Order entries from low to high',
        difficulty: 'Easy',
        prompt: 'Convert a numeric record to key-value pairs and sort them by their values in ascending order. Preserve original entry order for ties.',
        example: 'sortEntries({ silver: 12, bronze: 7, gold: 18 }) → [["bronze", 7], ["silver", 12], ["gold", 18]]',
        solutions: {
            js: `function sortEntries(scores) {
    return Object.entries(scores).sort((first, second) => first[1] - second[1]);
}`,
            ts: `function sortEntries(scores: Record<string, number>): [string, number][] {
    return Object.entries(scores).sort((first, second) => first[1] - second[1]);
}`,
        },
    },
    {
        id: 'weekend-13',
        topic: 'weekend-keys',
        title: 'Count a record’s own fields',
        difficulty: 'Easy',
        prompt: 'Count the object’s own enumerable string keys.',
        example: 'countFields({ label: "Box", size: 3 }) → 2',
        solutions: {
            js: `function countFields(source) {
    return Object.keys(source).length;
}`,
            ts: `function countFields(source: object): number {
    return Object.keys(source).length;
}`,
        },
    },
    {
        id: 'weekend-14',
        topic: 'weekend-values',
        title: 'Uppercase the first letter',
        difficulty: 'Easy',
        prompt: 'Create a new object with the same keys. For each string value, uppercase its first character and keep the rest as it is. Preserve non-string values and empty strings.',
        example: 'capitalizeFields({ town: "surat", rooms: 2, note: "" }) → { town: "Surat", rooms: 2, note: "" }',
        solutions: {
            js: `function capitalizeFields(source) {
    return Object.fromEntries(
        Object.entries(source).map(([key, value]) => [
            key,
            typeof value === "string" ? value.replace(/^./su, first => first.toUpperCase()) : value,
        ]),
    );
}`,
            ts: `function capitalizeFields(source: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(source).map(([key, value]) => [
            key,
            typeof value === "string" ? value.replace(/^./su, first => first.toUpperCase()) : value,
        ]),
    );
}`,
        },
    },
    {
        id: 'weekend-15',
        topic: 'weekend-values',
        title: 'Encode query parameters',
        difficulty: 'Easy',
        prompt: 'Serialize a record of strings, numbers, or booleans into a URL query string without a leading question mark. Percent-encode both keys and values with encodeURIComponent(). Keep entry order.',
        example: 'toQueryString({ "search term": "tea & toast", limit: 2 }) → "search%20term=tea%20%26%20toast&limit=2"',
        solutions: {
            js: `function toQueryString(params) {
    return Object.entries(params)
        .map(([key, value]) => encodeURIComponent(key) + "=" + encodeURIComponent(String(value)))
        .join("&");
}`,
            ts: `function toQueryString(params: Record<string, string | number | boolean>): string {
    return Object.entries(params)
        .map(([key, value]) => encodeURIComponent(key) + "=" + encodeURIComponent(String(value)))
        .join("&");
}`,
        },
    },
    {
        id: 'weekend-16',
        topic: 'weekend-totals',
        title: 'Tally integer parity',
        difficulty: 'Easy',
        prompt: 'Return the number of even and odd integers in an array. Count zero as even and handle negative integers.',
        example: 'countParity([-3, 0, 2, 7, 10]) → { even: 3, odd: 2 }',
        solutions: {
            js: `function countParity(numbers) {
    const counts = { even: 0, odd: 0 };

    for (const number of numbers) {
        if (number % 2 === 0) counts.even++;
        else counts.odd++;
    }

    return counts;
}`,
            ts: `function countParity(numbers: readonly number[]): { even: number; odd: number } {
    const counts = { even: 0, odd: 0 };

    for (const number of numbers) {
        if (number % 2 === 0) counts.even++;
        else counts.odd++;
    }

    return counts;
}`,
        },
    },
    {
        id: 'weekend-17',
        topic: 'weekend-keys',
        title: 'Find fields in both objects',
        difficulty: 'Easy',
        prompt: 'Return the own enumerable string keys present in both objects, keeping their order from the first object. Values do not affect the result.',
        example: 'sharedKeys({ first: 1, shared: 0 }, { shared: false, last: 2 }) → ["shared"]',
        solutions: {
            js: `function sharedKeys(left, right) {
    const rightKeys = new Set(Object.keys(right));
    return Object.keys(left).filter(key => rightKeys.has(key));
}`,
            ts: `function sharedKeys(left: object, right: object): string[] {
    const rightKeys = new Set(Object.keys(right));
    return Object.keys(left).filter(key => rightKeys.has(key));
}`,
        },
    },
    {
        id: 'weekend-18',
        topic: 'weekend-keys',
        title: 'Index records by ID',
        difficulty: 'Easy',
        prompt: 'Turn an array of records with string or numeric IDs into an object keyed by ID. Keep each full record as the value. If IDs repeat, the last record wins.',
        example: 'indexById([{ id: "a2", price: 12 }]) → { a2: { id: "a2", price: 12 } }',
        solutions: {
            js: `function indexById(records) {
    return Object.fromEntries(records.map(record => [record.id, record]));
}`,
            ts: `function indexById<Item extends { id: string | number }>(
    records: readonly Item[],
): Record<string, Item> {
    return Object.fromEntries(records.map(record => [record.id, record]));
}`,
        },
    },
    {
        id: 'weekend-19',
        topic: 'weekend-values',
        title: 'Check that every field is numeric',
        difficulty: 'Easy',
        prompt: 'Check whether every own enumerable string-keyed value is a JavaScript number. Use typeof to decide, so a numeric string fails and an empty object passes.',
        example: 'allNumbers({ low: 0, high: "14" }) → false',
        solutions: {
            js: `function allNumbers(source) {
    return Object.values(source).every(value => typeof value === "number");
}`,
            ts: `function allNumbers(source: Record<string, unknown>): boolean {
    return Object.values(source).every(value => typeof value === "number");
}`,
        },
    },
];

const sourcePage = 'https://brindle-goal-102.notion.site/QUESTIONS-FOR-JS-WEEKEND-26d46b36b2e980a0b299fbf0d87840af';

// Preserve document order, including the repeated grade drill and the nested longest-string drill.
const sources: readonly [block: string, topic?: string][] = [
    ['26d46b36b2e980569136ea5989d1f4b1'],
    ['26d46b36b2e980f08fadde6c0a6de330'],
    ['26d46b36b2e980b88f46d1a5616d7071'],
    ['26d46b36b2e98032a02cc29cd78879a4'],
    ['26d46b36b2e980d185a7c5f52a6b113f'],
    ['26d46b36b2e980ec83a3efc0c4b41424'],
    ['26d46b36b2e980eda846d048cca9c18c'],
    ['2f546b36b2e9801f8558f5da24e91a4d'],
    ['26d46b36b2e980fd8414d8bddcd34a13'],
    ['26d46b36b2e98065a0fff047bcb1c09d'],
    ['26d46b36b2e9804799c6d6cd802807ce'],
    ['26d46b36b2e98089b3aeddd2bceba41b'],
    ['26d46b36b2e980d59d7acd0c44fdce80'],
    ['26d46b36b2e98028ac0cc7299d6a7aa2'],
    ['26d46b36b2e980caa565ff51caa33014'],
    ['26d46b36b2e9803790bffa81c453d98a'],
    ['26d46b36b2e980cd8d6bedc69af8301b'],
    ['26d46b36b2e980cfb9c0cc751ff65a90'],
    ['26d46b36b2e980a4a4dae203faae9204'],
    ['26d46b36b2e980b2a49be5d42c269155', 'weekend-shaping'],
    ['26d46b36b2e980148ab3ef1c60aafd50', 'weekend-shaping'],
    ['26d46b36b2e980f0ba8bc87138a5deb8', 'weekend-shaping'],
    ['26d46b36b2e98044aaeefdcecff4ce37', 'weekend-analysis'],
    ['26d46b36b2e98065978ddb74408bbf5a', 'weekend-shaping'],
    ['26d46b36b2e980c79944d2a41e042b64', 'weekend-shaping'],
    ['26d46b36b2e980bdb555d9571da1eda6', 'weekend-shaping'],
    ['26d46b36b2e980f2926df18ed7c075b6', 'weekend-analysis'],
    ['26d46b36b2e9809796b4f785389fc3f0', 'weekend-nested'],
    ['26d46b36b2e980309d73f17a494759d3', 'weekend-shaping'],
    ['26d46b36b2e9807fb5e4c39a2d34ff8f', 'weekend-nested'],
    ['26d46b36b2e980bb8701cb3a5d232853', 'weekend-nested'],
    ['26d46b36b2e98067bc9edb2283c834b5', 'weekend-nested'],
    ['26d46b36b2e9803facceefbe4294f001', 'weekend-analysis'],
    ['26d46b36b2e9800ca33dcb9b69eb2c1b', 'weekend-analysis'],
    ['26d46b36b2e9801baa1df36e8fcebaf4', 'weekend-nested'],
    ['26d46b36b2e980b38ed8e0c3d9cc5a4a', 'weekend-nested'],
    ['26d46b36b2e98087833becf2dad3eea0', 'weekend-analysis'],
    ['26d46b36b2e980099d97d096056863b0', 'weekend-analysis'],
    ['26d46b36b2e9800692cecb57ff1650e4', 'weekend-analysis'],
    ['26d46b36b2e98066b93fdf6f686d826f', 'weekend-shaping'],
];

export const weekendChallenges: Challenge[] = [
    ...basicChallenges,
    ...weekendIntermediateA,
    ...weekendIntermediateB,
].map((challenge, index) => {
    const [block, topic = challenge.topic] = sources[index];

    return {
        ...challenge,
        topic,
        sourceOrder: index + 1,
        sourceUrl: `${sourcePage}#${block}`,
    };
});
