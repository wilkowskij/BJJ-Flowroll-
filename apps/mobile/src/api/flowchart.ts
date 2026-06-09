import apiClient from './client';

export interface FlowchartNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface FlowchartEdge {
  from: string;
  to: string;
}

export interface FlowchartData {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
}

export async function getMyFlowchart(studentId: string): Promise<FlowchartData> {
  const response = await apiClient.get<FlowchartData>(
    `/students/${studentId}/flowchart`,
  );
  return response.data;
}
