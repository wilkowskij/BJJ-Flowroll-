import { apiClient } from './client'

export interface GymUpdateDto {
  gymName?: string
  primaryColor?: string
  secondaryColor?: string
}

export const gymsApi = {
  /** PATCH /api/v1/gyms/:id — update the current instructor's gym settings */
  updateGym: (gymId: string, data: GymUpdateDto) => apiClient.patch(`/gyms/${gymId}`, data),
}
