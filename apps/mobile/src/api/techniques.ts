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

export type TechniquePosition =
  | 'Guard'
  | 'Guard Pass'
  | 'Submissions'
  | 'Sweeps'
  | 'Takedowns'
  | 'Back Takes'
  | 'Mount';

export interface Technique {
  id: string;
  gymId: string;
  title: string;
  position: string;
  beltLevel: string;
  type: string;
  difficulty: number;
  description?: string;
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

export interface ClassSchedule {
  id: string;
  gymId: string;
  title: string;
  instructorName: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
}

export interface AttendanceCheckInPayload {
  classId: string;
  method: 'manual';
}

export const getTechniques = (params?: {
  position?: string;
  beltLevel?: string;
  query?: string;
  gymId?: string;
}) => apiClient.get<Technique[]>('/api/v1/techniques', { params });

export const getVideos = (
  gymId: string,
  filters?: { position?: TechniquePosition; beltLevel?: BeltLevel },
) =>
  apiClient.get<Technique[]>('/api/v1/techniques', {
    params: { gymId, ...filters },
  });

export const getTemplates = () =>
  apiClient.get<Technique[]>('/api/v1/techniques/templates');

export const getSchedule = () =>
  apiClient.get<ClassSchedule[]>('/api/v1/attendance/schedule');

export const checkInToClass = (payload: AttendanceCheckInPayload) =>
  apiClient.post<{ success: boolean }>('/api/v1/attendance', payload);

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
