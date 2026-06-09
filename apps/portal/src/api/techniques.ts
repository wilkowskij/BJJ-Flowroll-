import { apiClient } from './client'
import type { Belt } from '@/store/authStore'

export type Position = 'guard' | 'mount' | 'back' | 'side_control' | 'standing'
export type TechniqueType = 'submission' | 'sweep' | 'escape' | 'pass' | 'takedown' | 'transition'

export interface Technique {
  id: string
  gymId: string
  title: string
  description: string
  position: Position
  beltLevel: Belt
  type: TechniqueType
  difficulty: number
  videoUrl: string | null
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTechniqueDto {
  title: string
  description: string
  position: Position
  beltLevel: Belt
  type: TechniqueType
  difficulty: number
  videoUrl?: string
}

export const techniquesApi = {
  list: () => apiClient.get<Technique[]>('/techniques'),
  get: (id: string) => apiClient.get<Technique>(`/techniques/${id}`),
  create: (data: CreateTechniqueDto) => apiClient.post<Technique>('/techniques', data),
  update: (id: string, data: Partial<CreateTechniqueDto>) =>
    apiClient.patch<Technique>(`/techniques/${id}`, data),
  delete: (id: string) => apiClient.delete(`/techniques/${id}`),
}
