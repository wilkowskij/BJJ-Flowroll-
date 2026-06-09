import apiClient from './client';

export type FeedItemType = 'weekly_post' | 'announcement';

export interface FeedWeeklyPost {
  id: string;
  type: 'weekly_post';
  instructorName: string;
  instructorAvatarUrl: string | null;
  date: string;
  title: string;
  techniqueId: string;
  thumbnailUrl: string | null;
}

export interface FeedAnnouncement {
  id: string;
  type: 'announcement';
  text: string;
  date: string;
}

export type FeedItem = FeedWeeklyPost | FeedAnnouncement;

export async function getFeed(gymId: string): Promise<FeedItem[]> {
  const response = await apiClient.get<FeedItem[]>(`/gyms/${gymId}/feed`);
  return response.data;
}
