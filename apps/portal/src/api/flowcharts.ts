import { apiClient } from './client'
import type { Node, Edge } from 'reactflow'

export interface FlowchartData {
  id: string
  gymId: string
  instructorId: string
  nodes: Node[]
  edges: Edge[]
  createdAt: string
  updatedAt: string
}

export interface SaveFlowchartDto {
  nodes: Node[]
  edges: Edge[]
}

export const flowchartsApi = {
  getMyFlowchart: () => apiClient.get<FlowchartData>('/flowcharts/me'),
  saveMyFlowchart: (data: SaveFlowchartDto) =>
    apiClient.put<FlowchartData>('/flowcharts/me', data),
}
