import type { Challenge, Topic } from './challenges';

export const interviewTopics: Topic[] = [
  { id: 'interview-search', label: 'Search & two pointers', description: 'Maintain a useful boundary while narrowing the search.' },
  { id: 'interview-windows', label: 'Windows, sums & intervals', description: 'Track what changes as a range moves or grows.' },
  { id: 'interview-graphs', label: 'Graphs & queues', description: 'Explore reachable states and respect dependencies.' },
  { id: 'interview-optimization', label: 'Stacks & dynamic programming', description: 'Keep only the work that can affect a later answer.' },
];

function variants(jsSignature: string, tsSignature: string, body: string): Challenge['solutions'] {
  return {
    js: `function ${jsSignature} {\n${body}\n}`,
    ts: `function ${tsSignature} {\n${body}\n}`,
  };
}

export const interviewChallenges: Challenge[] = [
  {
    id: 'lower-bound',
    topic: 'interview-search',
    title: 'Find the first eligible timestamp',
    difficulty: 'Medium',
    prompt: 'Given a nondecreasing array of timestamps and a cutoff, return the first index with a value at least the cutoff. Return the array length if every timestamp is earlier. Use logarithmic time.',
    example: 'firstEligible([8, 12, 12, 19], 12) → 1',
    checks: [
      { name: 'Finds the first duplicate', body: 'assert(firstEligible([8, 12, 12, 19], 12) === 1, "Return the first index with timestamp 12.");' },
      { name: 'Handles cutoffs outside the range', body: 'assert(firstEligible([8, 12], 2) === 0 && firstEligible([8, 12], 15) === 2 && firstEligible([], 7) === 0);' },
    ],
    solutions: variants('firstEligible(times, cutoff)', 'firstEligible(times: readonly number[], cutoff: number): number', `    let low = 0;
    let high = times.length;
    while (low < high) {
        const middle = low + Math.floor((high - low) / 2);
        if (times[middle] < cutoff) low = middle + 1;
        else high = middle;
    }
    return low;`),
  },
  {
    id: 'sorted-pair',
    topic: 'interview-search',
    title: 'Find two prices within a budget',
    difficulty: 'Medium',
    prompt: 'Return two distinct indices from sorted prices whose values sum to the budget, or null if no pair exists. Use one pass and constant extra space.',
    example: 'pairForBudget([3, 7, 11, 15], 18) → [0, 3]',
    checks: [
      { name: 'Returns two distinct valid indices', body: 'const prices = [3, 7, 11, 15]; const pair = pairForBudget(prices, 18); assert(Array.isArray(pair) && pair.length === 2 && pair[0] !== pair[1] && prices[pair[0]] + prices[pair[1]] === 18);' },
      { name: 'Handles duplicates and missing pairs', body: 'const pair = pairForBudget([4, 4], 8); assert(Array.isArray(pair) && pair.includes(0) && pair.includes(1)); assert(pairForBudget([1, 2, 3], 8) === null);' },
    ],
    solutions: variants('pairForBudget(prices, budget)', 'pairForBudget(prices: readonly number[], budget: number): [number, number] | null', `    let left = 0;
    let right = prices.length - 1;
    while (left < right) {
        const total = prices[left] + prices[right];
        if (total === budget) return [left, right];
        if (total < budget) left++;
        else right--;
    }
    return null;`),
  },
  {
    id: 'prefix-target',
    topic: 'interview-windows',
    title: 'Count stretches with a target sum',
    difficulty: 'Medium',
    prompt: 'Count nonempty contiguous sections whose values sum to target. Values may be positive, zero, or negative. Aim for linear time.',
    example: 'countTargetSections([1, -1, 1, 1], 1) → 5',
    checks: [
      { name: 'Counts sections with negative values', body: 'assert(countTargetSections([1, -1, 1, 1], 1) === 5);' },
      { name: 'Counts repeated zero prefixes', body: 'assert(countTargetSections([0, 0, 0], 0) === 6 && countTargetSections([], 0) === 0);' },
    ],
    solutions: variants('countTargetSections(values, target)', 'countTargetSections(values: readonly number[], target: number): number', `    const frequencies = new Map([[0, 1]]);
    let prefix = 0;
    let count = 0;
    for (const value of values) {
        prefix += value;
        count += frequencies.get(prefix - target) ?? 0;
        frequencies.set(prefix, (frequencies.get(prefix) ?? 0) + 1);
    }
    return count;`),
  },
  {
    id: 'merge-maintenance',
    topic: 'interview-windows',
    title: 'Merge maintenance windows',
    difficulty: 'Medium',
    prompt: 'Combine overlapping or touching closed time intervals. Return the merged intervals sorted by start and preserve the input arrays.',
    example: 'mergeWindows([[8, 10], [1, 4], [4, 6]]) → [[1, 6], [8, 10]]',
    checks: [
      { name: 'Sorts and merges touching windows', body: 'const result = mergeWindows([[8, 10], [1, 4], [4, 6]]); assert(JSON.stringify(result) === "[[1,6],[8,10]]");' },
      { name: 'Preserves the original intervals', body: 'const input = [[4, 5], [1, 9], [2, 3]]; const before = JSON.stringify(input); assert(JSON.stringify(mergeWindows(input)) === "[[1,9]]"); assert(JSON.stringify(input) === before, "The input intervals changed.");' },
    ],
    solutions: variants('mergeWindows(windows)', 'mergeWindows(windows: ReadonlyArray<readonly [number, number]>): number[][]', `    const sorted = [...windows].sort(([a], [b]) => a - b);
    const merged = [];
    for (const [start, end] of sorted) {
        const last = merged[merged.length - 1];
        if (!last || start > last[1]) merged.push([start, end]);
        else last[1] = Math.max(last[1], end);
    }
    return merged;`),
  },
  {
    id: 'shortest-hops',
    topic: 'interview-graphs',
    title: 'Fewest service hops',
    difficulty: 'Medium',
    prompt: 'Given a directed adjacency list, return the number of edges on the shortest path from start to target. Return −1 when the target is unreachable. An absent adjacency entry has no outgoing edges.',
    example: 'fewestHops({ a: ["b", "c"], b: ["d"] }, "a", "d") → 2',
    checks: [
      { name: 'Uses the shorter path', body: 'assert(fewestHops({ a: ["b", "c"], b: ["d"], c: ["x"], x: ["d"] }, "a", "d") === 2);' },
      { name: 'Handles cycles and unreachable targets', body: 'assert(fewestHops({ a: ["b"], b: ["a"] }, "a", "c") === -1); assert(fewestHops({}, "a", "a") === 0);' },
    ],
    solutions: variants('fewestHops(graph, start, target)', 'fewestHops(graph: Record<string, readonly string[]>, start: string, target: string): number', `    const queue = [start];
    const distances = new Map([[start, 0]]);
    for (let head = 0; head < queue.length; head++) {
        const current = queue[head];
        const distance = distances.get(current) ?? 0;
        if (current === target) return distance;
        const outgoing = Object.hasOwn(graph, current) ? graph[current] : [];
        for (const next of outgoing) {
            if (distances.has(next)) continue;
            distances.set(next, distance + 1);
            queue.push(next);
        }
    }
    return -1;`),
  },
  {
    id: 'next-higher-load',
    topic: 'interview-optimization',
    title: 'Time until the next higher load',
    difficulty: 'Medium',
    prompt: 'For each sample, return how many positions until a strictly higher load. Use 0 if no higher sample follows. Aim for linear time.',
    example: 'nextHigherLoad([7, 4, 6, 9, 8]) → [3, 1, 1, 0, 0]',
    checks: [
      { name: 'Finds the next higher sample', body: 'assert(JSON.stringify(nextHigherLoad([7, 4, 6, 9, 8])) === "[3,1,1,0,0]");' },
      { name: 'Skips equal samples', body: 'assert(JSON.stringify(nextHigherLoad([5, 5, 6])) === "[2,1,0]"); assert(JSON.stringify(nextHigherLoad([])) === "[]");' },
    ],
    solutions: variants('nextHigherLoad(load)', 'nextHigherLoad(load: readonly number[]): number[]', `    const waits = Array(load.length).fill(0);
    const pending = [];
    for (let i = 0; i < load.length; i++) {
        while (pending.length && load[i] > load[pending[pending.length - 1]]) {
            const previous = pending.pop();
            if (previous !== undefined) waits[previous] = i - previous;
        }
        pending.push(i);
    }
    return waits;`),
  },
  {
    id: 'fewest-tokens',
    topic: 'interview-optimization',
    title: 'Spend the fewest tokens',
    difficulty: 'Hard',
    prompt: 'Find the fewest tokens needed to pay a nonnegative integer amount. Each positive integer denomination is available in unlimited quantity. Return −1 if the amount cannot be paid.',
    example: 'fewestTokens([1, 4, 6], 8) → 2',
    checks: [
      { name: 'Beats the greedy choice', body: 'assert(fewestTokens([1, 4, 6], 8) === 2, "Two tokens of value 4 are sufficient.");' },
      { name: 'Handles zero and impossible totals', body: 'assert(fewestTokens([4, 6], 7) === -1 && fewestTokens([4, 6], 0) === 0);' },
    ],
    solutions: variants('fewestTokens(denominations, amount)', 'fewestTokens(denominations: readonly number[], amount: number): number', `    const best = Array(amount + 1).fill(Infinity);
    best[0] = 0;
    for (let total = 1; total <= amount; total++) {
        for (const value of denominations) {
            if (value <= total) best[total] = Math.min(best[total], best[total - value] + 1);
        }
    }
    return Number.isFinite(best[amount]) ? best[amount] : -1;`),
  },
];
