import { apiClient } from './client'
import type { Belt } from '@/store/authStore'

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

export const usersApi = {
  listStudents: () => apiClient.get<Student[]>('/users/students'),
  getStudent: (id: string) => apiClient.get<Student>(`/users/${id}`),
}
