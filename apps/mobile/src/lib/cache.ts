import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export const Cache = {
  async set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        expiresAt: Date.now() + ttlMs,
      };
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('[Cache] set failed for key:', key, error);
    }
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);

      // If expired, return null — but do NOT delete so stale data remains
      // available for offline use
      if (Date.now() > entry.expiresAt) {
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('[Cache] get failed for key:', key, error);
      return null;
    }
  },

  /** Returns stale data even when expired — use when offline. */
  async getStale<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      return entry.data;
    } catch (error) {
      console.warn('[Cache] getStale failed for key:', key, error);
      return null;
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('[Cache] remove failed for key:', key, error);
    }
  },

  async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((k) => k.startsWith('cache:'));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.warn('[Cache] clear failed', error);
    }
  },
};

// Typed cache key helpers
export const CacheKeys = {
  techniques: (gymId: string) => `cache:techniques:${gymId}`,
  flowchart: (userId: string) => `cache:flowchart:${userId}`,
  feed: (gymId: string) => `cache:feed:${gymId}`,
};
