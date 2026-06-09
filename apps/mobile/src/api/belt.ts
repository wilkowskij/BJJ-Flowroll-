import apiClient from './client';
import type { BeltLevel } from './techniques';

export interface BeltProgress {
  currentBelt: BeltLevel;
  nextBelt: BeltLevel;
  requiredTechniques: string[];
  loggedTechniqueIds: string[];
  requiredClasses: number;
  attendedClasses: number;
}

export const getBeltProgress = () =>
  apiClient.get<BeltProgress>('/api/v1/belt-tracks/my-progress');
