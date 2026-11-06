import type { Language } from '../../types';

export interface RoadmapState {
  track: 'language' | 'algorithm';
  query: string;
  language: Language | '';
  statusFilter: 'all' | 'review' | 'saved' | 'complete';
  expanded: Record<string, boolean>;
}

export const initialRoadmapState: RoadmapState = {
  track: 'language',
  query: '',
  language: '',
  statusFilter: 'all',
  expanded: {},
};
