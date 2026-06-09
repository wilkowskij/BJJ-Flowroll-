import { apiClient } from './client'
import type { Belt, UserRole } from '@/store/authStore'

export interface Student {
  id: string
  gymId: string
  name: string
  email: string
  belt: Belt
  avatarUrl: string | null
  techniquesLogged: number
  lastActiveAt: string
  flowchartNodes: number
  joinedAt: string
}

export interface StudentEngagementRow {
  id: string
  name: string
  email: string
  beltLevel: Belt
  techniqueCount: number
  attendanceCount: number
  lastActive: string | null
  churnRisk: 'low' | 'medium' | 'high'
}

export interface User {
  id: string
  gymId: string
  supabaseUid: string
  name: string
  email: string
  role: UserRole
  beltLevel: Belt
  avatarUrl: string | null
  updatedAt: string
  createdAt: string
}

export const usersApi = {
  listStudents: () => apiClient.get<Student[]>('/users'),
  getStudent: (id: string) => apiClient.get<Student>(`/users/${id}`),
  getMe: () => apiClient.get<User>('/users/me'),
  /** GET /api/v1/users/students — returns engagement rows for the instructor portal */
  listStudentEngagement: () => apiClient.get<StudentEngagementRow[]>('/users/students'),
}
