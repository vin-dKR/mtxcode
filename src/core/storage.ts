import type { LineRange, RunRecord, SaveKey, Settings } from '../types';
import { isLanguage } from './languages';
import { DEFAULT_THEME, isTheme } from './themes';

export function readStored(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

export const settingsKey = 'keycraft.settings.v1';
export const historyKey = 'keycraft.history.v1';
export const favoritesKey = 'keycraft.favorites.v1';
const saveKeys: SaveKey[] = ['Mod-s', 'Mod-Enter', 'Alt-s'];
const modes = new Set(['guided', 'blind', 'repair', 'sprint']);

export function validRange(value: unknown): value is LineRange {
  if (!value || typeof value !== 'object') return false;
  const { start, end } = value as Partial<LineRange>;
  return typeof start === 'number' && typeof end === 'number' && Number.isSafeInteger(start) && Number.isSafeInteger(end) &&
    start >= 1 && end >= start && end <= 2000;
}

export function initialSettings(): Settings {
  const saved = readStored(settingsKey);
  const previous = saved && typeof saved === 'object' ? saved as Partial<Settings> : {
    theme: readStored('keycraft-theme'),
    vim: readStored('keycraft-keymap') === 'vim',
    saveKey: readStored('keycraft-save-key'),
    mappings: readStored('keycraft-mappings'),
  };
  return {
    theme: isTheme(previous.theme) ? previous.theme : DEFAULT_THEME,
    vim: previous.vim === true,
    saveKey: saveKeys.includes(previous.saveKey as SaveKey) ? previous.saveKey as SaveKey : 'Mod-s',
    mappings: Array.isArray(previous.mappings) ? previous.mappings.filter((mapping) => (
      mapping && typeof mapping.from === 'string' && mapping.from.trim() && !mapping.from.trim().startsWith(':') &&
      typeof mapping.to === 'string' && mapping.to.trim() &&
      ['normal', 'insert', 'visual'].includes(mapping.mode)
    )) : [],
  };
}

export function initialHistory(): RunRecord[] {
  const saved = readStored(historyKey);
  if (!Array.isArray(saved)) return [];
  return saved.filter((record): record is RunRecord => (
    record && typeof record.id === 'string' && typeof record.drillId === 'string' && typeof record.title === 'string' &&
    isLanguage(record.language) && modes.has(record.mode) &&
    Number.isFinite(new Date(record.createdAt).getTime()) &&
    [record.createdAt, record.seconds, record.wpm, record.inserted, record.deleted].every(Number.isFinite) &&
    (record.range === undefined || validRange(record.range))
  )).slice(0, 200);
}

export function initialFavorites(): string[] {
  const saved = readStored(favoritesKey);
  return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];
}
