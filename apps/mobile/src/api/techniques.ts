import apiClient from './client';

export type BeltLevel = 'white' | 'blue' | 'purple' | 'brown' | 'black';
export type Position =
  | 'Guard'
  | 'Half Guard'
  | 'Mount'
  | 'Back'
  | 'Side Control'
  | 'Turtle'
  | 'Standing'
  | 'Takedown'
  | 'Submission';

export interface Technique {
  id: string;
  gymId: string;
  title: string;
  position: string;
  beltLevel: string;
  type: string;
  difficulty: number;
  videoUrl?: string;
  muxPlaybackId?: string;
}

export interface LogEntry {
  id: string;
  techniqueId: string;
  techniqueName: string;
  position: Position;
  drilled: boolean;
  rolled: boolean;
  notes?: string;
  loggedAt: string;
}

export interface LogTechniquePayload {
  techniqueId: string;
  drilled: boolean;
  rolled: boolean;
  notes?: string;
}

export const getTechniques = (params?: {
  position?: string;
  beltLevel?: string;
  query?: string;
}) => apiClient.get<Technique[]>('/api/v1/techniques', { params });

export const getTemplates = () =>
  apiClient.get<Technique[]>('/api/v1/techniques/templates');

export async function getMyLog(studentId: string): Promise<LogEntry[]> {
  const response = await apiClient.get<LogEntry[]>(
    `/students/${studentId}/log`,
  );
  return response.data;
}

export async function logTechnique(
  studentId: string,
  payload: LogTechniquePayload,
): Promise<LogEntry> {
  const response = await apiClient.post<LogEntry>(
    `/students/${studentId}/log`,
    payload,
  );
  return response.data;
}
