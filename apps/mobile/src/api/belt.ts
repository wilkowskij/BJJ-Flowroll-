import apiClient from './client';
import type { BeltLevel } from './techniques';

export interface BeltProgress {
  currentBelt: BeltLevel;
  nextBelt: BeltLevel | null;
  requiredTechniques: number;
  completedTechniques: number;
  checklist: BeltChecklistItem[];
}

export interface BeltChecklistItem {
  id: string;
  name: string;
  completed: boolean;
}

export async function getBeltProgress(studentId: string): Promise<BeltProgress> {
  const response = await apiClient.get<BeltProgress>(
    `/students/${studentId}/belt-progress`,
  );
  return response.data;
}
