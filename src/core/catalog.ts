import { challenges, topics } from './challenges';
import { interviewChallenges, interviewTopics } from './interview';
import { getLanguage, repairStarterLanguages, solutionLanguages } from './languages';
import { repairs } from './repairs';
import { weekendChallenges, weekendTopics } from './weekend';
import type { Language, RunRecord, Selection } from '../types';

export interface Drill {
  id: string;
  title: string;
  topic: string;
  detail: string;
  level: 'Easy' | 'Medium' | 'Hard' | 'Repair';
  languages: string;
  languageIds: Language[];
  track: 'language' | 'algorithm' | 'repair';
  sourceUrl?: string;
  sourceOrder?: number;
  selection: Selection;
}

const algorithmTopics = new Set(['algorithms', ...interviewTopics.map(({ id }) => id)]);
const languageTopicOrder = new Map(['internals', 'timers', 'async', 'typescript'].map((id, index) => [id, index]));
const labelsFor = (ids: Language[]) => ids.map((id) => getLanguage(id).shortName).join(' / ');

export const drillCatalog: Drill[] = [
  ...[...weekendChallenges, ...challenges, ...interviewChallenges].map((challenge): Drill => {
    const languageIds = solutionLanguages(challenge.solutions);
    return {
      id: challenge.id,
      title: challenge.title,
      topic: challenge.topic,
      detail: challenge.prompt,
      level: challenge.difficulty,
      languages: labelsFor(languageIds),
      languageIds,
      track: algorithmTopics.has(challenge.topic) ? 'algorithm' : 'language',
      sourceUrl: challenge.sourceUrl,
      sourceOrder: challenge.sourceOrder,
      selection: { kind: 'practice', challenge, mode: 'guided' },
    };
  }),
  ...repairs.map((drill): Drill => {
    const languageIds = repairStarterLanguages(drill.starter);
    return {
      id: drill.id,
      title: drill.title,
      topic: 'repair',
      detail: drill.prompt,
      level: 'Repair',
      languages: labelsFor(languageIds),
      languageIds,
      track: 'repair',
      selection: { kind: 'repair', drill },
    };
  }),
];

export const topicCatalog = [
  ...weekendTopics,
  ...topics.filter(({ id }) => !algorithmTopics.has(id)).sort((left, right) =>
    (languageTopicOrder.get(left.id) ?? Infinity) - (languageTopicOrder.get(right.id) ?? Infinity)),
  { id: 'repair', label: 'Repair Lab', description: 'Fix broken code and run its behavior checks.' },
  ...interviewTopics,
  ...topics.filter(({ id }) => algorithmTopics.has(id)),
];

export const topicNames = new Map(topicCatalog.map(({ id, label }) => [id, label]));

const drillsById = new Map(drillCatalog.map((drill) => [drill.id, drill]));

export function openSelection(id: string, mode?: RunRecord['mode']): Selection | undefined {
  const drill = drillsById.get(id);
  if (!drill || drill.selection.kind === 'repair') return drill?.selection;
  return { ...drill.selection, mode: mode === 'blind' ? 'blind' : 'guided' };
}

export function nextCodeCheck(id: string, language: Language): Selection | undefined {
  const drills = drillCatalog.filter((drill) => drill.selection.kind === 'practice' && drill.languageIds.includes(language));
  if (drills.length < 2) return undefined;
  const current = drills.findIndex((drill) => drill.id === id);
  if (current < 0) return undefined;
  const next = drills.slice(current + 1).find((drill) => drill.topic === drills[current].topic)
    ?? drills[(current + 1) % drills.length];
  return openSelection(next.id);
}

const circuits = [
  { title: 'Debounce', topic: 'Timers', practice: 'debounce', repair: 'repair-debounce' },
  { title: 'Request coalescing', topic: 'Async & Promises', practice: 'coalesce', repair: 'repair-coalesce' },
  { title: 'LRU cache', topic: 'JavaScript Internals', practice: 'lru', repair: 'repair-lru' },
];

export function dailyCircuit(date = new Date()) {
  const midnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const day = Math.floor(midnight / 86_400_000);
  return { ...circuits[day % circuits.length], start: new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() };
}
