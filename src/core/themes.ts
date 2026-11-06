export const THEMES = [
  { id: 'graphite', name: 'Dusk', description: 'Graphite and lilac' },
  { id: 'midnight', name: 'Midnight', description: 'Navy and ice blue' },
  { id: 'forest', name: 'Forest', description: 'Moss and fern' },
  { id: 'ember', name: 'Ember', description: 'Umber and copper' },
  { id: 'amethyst', name: 'Amethyst', description: 'Plum and orchid' },
  { id: 'paper', name: 'Paper', description: 'Parchment and clay' },
  { id: 'daylight', name: 'Daylight', description: 'Mist and cobalt' },
  { id: 'contrast', name: 'High contrast', description: 'Black and citron' },
] as const;

export const DEFAULT_THEME = THEMES[0].id;

export function isTheme(value: unknown): value is (typeof THEMES)[number]['id'] {
  return THEMES.some((theme) => theme.id === value);
}
