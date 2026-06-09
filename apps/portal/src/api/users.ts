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
}
