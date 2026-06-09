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
  name: string;
  position: Position;
  beltLevel: BeltLevel;
  description?: string;
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

export async function searchTechniques(
  gymId: string,
  query: string,
): Promise<Technique[]> {
  const response = await apiClient.get<Technique[]>(
    `/gyms/${gymId}/techniques`,
    { params: { q: query } },
  );
  return response.data;
}

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
