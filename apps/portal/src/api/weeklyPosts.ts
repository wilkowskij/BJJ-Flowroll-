import { apiClient } from './client'
import type { Belt } from '@/store/authStore'

export type PostStatus = 'draft' | 'published' | 'scheduled'

export interface WeeklyPost {
  id: string
  gymId: string
  instructorId: string
  title: string
  body: string
  status: PostStatus
  techniqueIds: string[]
  targetBelt: Belt | 'all'
  scheduledAt: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePostDto {
  title: string
  body: string
  techniqueIds: string[]
  targetBelt: Belt | 'all'
  scheduledAt?: string
}

export const weeklyPostsApi = {
  list: () => apiClient.get<WeeklyPost[]>('/weekly-posts'),
  get: (id: string) => apiClient.get<WeeklyPost>(`/weekly-posts/${id}`),
  create: (data: CreatePostDto) => apiClient.post<WeeklyPost>('/weekly-posts', data),
  update: (id: string, data: Partial<CreatePostDto>) =>
    apiClient.patch<WeeklyPost>(`/weekly-posts/${id}`, data),
  publish: (id: string) => apiClient.post<WeeklyPost>(`/weekly-posts/${id}/publish`),
  delete: (id: string) => apiClient.delete(`/weekly-posts/${id}`),
}
