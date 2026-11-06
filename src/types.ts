import type { Challenge } from './core/challenges';
import type { VimMapping } from './core/editor';
import type { Language } from './core/languages';
import type { RepairDrill } from './core/repairs';
import type { PacePoint } from './core/trace';

export type { Language } from './core/languages';
export type PracticeMode = 'guided' | 'blind' | 'repair' | 'sprint';
export type SaveKey = 'Mod-s' | 'Mod-Enter' | 'Alt-s';
export type LineRange = { start: number; end: number };

export interface Settings {
  theme: string;
  vim: boolean;
  saveKey: SaveKey;
  mappings: VimMapping[];
}

export type Selection =
  | { kind: 'practice'; challenge: Challenge; mode: 'guided' | 'blind' }
  | { kind: 'repair'; drill: RepairDrill };

export interface RunRecord {
  id: string;
  drillId: string;
  title: string;
  language: Language;
  mode: PracticeMode;
  createdAt: number;
  seconds: number;
  wpm: number;
  inserted: number;
  deleted: number;
  matched?: number;
  total?: number;
  passed?: number;
  checks?: number;
  range?: LineRange;
}

export interface PracticeResult {
  record: RunRecord;
  points: PacePoint[];
  ghost?: PacePoint[];
  ghostNote?: string;
  complete?: boolean;
  review?: { line: number; status: 'match' | 'edit' | 'empty'; editable: boolean }[];
  lineSplits?: { line: number; seconds: number; deleted: number }[];
  longestGap?: { seconds: number; line: number };
  checks?: { name: string; passed: boolean; message?: string }[];
  repeatRange?: LineRange;
  repeatLine?: number;
  repeatReason?: 'difference' | 'extra' | 'deletions' | 'pause' | 'active';
}

export interface WorkspaceProps {
  selection: Selection;
  initialLanguage?: Language;
  initialRange?: LineRange;
  settings: Settings;
  onVimChange(vim: boolean): void;
  onBack(): void;
  onRecord(record: RunRecord): void;
  onSettings(): void;
}
