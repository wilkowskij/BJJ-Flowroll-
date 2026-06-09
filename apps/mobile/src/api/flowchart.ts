import apiClient from './client';

export interface FlowchartData {
  id: string;
  nodes: unknown[];
  edges: unknown[];
  updatedAt: string;
}

export const getMyFlowchart = () =>
  apiClient.get<FlowchartData>('/api/v1/flowcharts/me');
