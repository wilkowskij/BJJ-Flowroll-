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

// API shape returned by /api/v1/weekly-posts/feed
export interface WeeklyPost {
  id: string;
  title: string;
  body?: string;
  videoUrl?: string;
  muxPlaybackId?: string;
  techniqueIds: string[];
  beltTarget?: string;
  publishedAt: string;
}

export const getFeed = () =>
  apiClient.get<WeeklyPost[]>('/api/v1/weekly-posts/feed');
