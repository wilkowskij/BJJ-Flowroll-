import { apiClient } from './client'

export interface StorageUsage {
  usedBytes: number
  usedGb: number
  limitGb: number
  percentUsed: number
}

export const videoApi = {
  /** GET /api/v1/video/storage-usage — returns current storage consumption */
  getStorageUsage: () => apiClient.get<StorageUsage>('/video/storage-usage'),

  /** DELETE /api/v1/video/technique/:techniqueId — removes the video attached to a technique */
  deleteVideo: (techniqueId: string) => apiClient.delete(`/video/technique/${techniqueId}`),
}
