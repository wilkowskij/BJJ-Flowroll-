import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FeedCard } from "../../src/components/FeedCard";
import { BeltBadge } from "../../src/components/BeltBadge";
import { getFeed, type WeeklyPost } from "../../src/api/feed";
import { Cache, CacheKeys } from "../../src/lib/cache";
import { useAuthStore } from "../../src/store/authStore";
import { useIsOnline } from "../../src/components/OfflineBanner";

// ---------------------------------------------------------------------------
// Mock data — used as fallback when the API is unavailable
// ---------------------------------------------------------------------------
const MOCK_FEED: WeeklyPost[] = [
  {
    id: "feed-1",
    title: "No-gi class this Saturday is moved to 11am. Open mat follows at 12:30pm.",
    techniqueIds: [],
    publishedAt: new Date("2026-06-07").toISOString(),
  },
  {
    id: "feed-2",
    title: "This Week: Armbar Entries from Closed Guard",
    techniqueIds: ["tech-armbar-guard"],
    publishedAt: new Date("2026-06-05").toISOString(),
  },
  {
    id: "feed-3",
    title: "Hip Bump Sweep → Kimura Follow-up",
    techniqueIds: ["tech-hip-bump"],
    publishedAt: new Date("2026-05-29").toISOString(),
  },
  {
    id: "feed-4",
    title: "Summer belt promotion ceremony is scheduled for July 12th.",
    techniqueIds: [],
    publishedAt: new Date("2026-05-25").toISOString(),
  },
  {
    id: "feed-5",
    title: "X-Guard Entry from Seated Guard",
    techniqueIds: ["tech-x-guard"],
    publishedAt: new Date("2026-05-22").toISOString(),
  },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function FeedScreen() {
  const { gymId } = useAuthStore();
  const isOnline = useIsOnline();
  const [items, setItems] = useState<WeeklyPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeed = useCallback(async (isRefresh = false) => {
    const cacheKey = gymId ? CacheKeys.feed(gymId) : null;

    // 1. Check cache first — show immediately if hit
    if (cacheKey) {
      try {
        // If online, use only fresh cache; if offline, accept stale data
        const cached = isOnline
          ? await Cache.get<WeeklyPost[]>(cacheKey)
          : await Cache.getStale<WeeklyPost[]>(cacheKey);
        if (cached && cached.length > 0 && !isRefresh) {
          setItems(cached);
          setLoading(false);
        }
      } catch (error) {
        console.warn("[Feed] Cache read failed:", error);
      }
    }

    // 2. Background-refresh from API (skip if offline)
    if (!isOnline) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const { data } = await getFeed();
      setItems(data);
      if (cacheKey) {
        await Cache.set(cacheKey, data);
      }
    } catch (error) {
      console.warn("[Feed] API call failed, using cached/mock data", error);
      if (items.length === 0) {
        setItems(MOCK_FEED);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId, isOnline]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFeed(true);
  }, [loadFeed]);

  const renderItem = ({ item }: { item: WeeklyPost }) => {
    const date = formatDate(item.publishedAt);
    const hasTechniques = item.techniqueIds.length > 0;
    if (!hasTechniques && !item.videoUrl) {
      return <FeedCard type="announcement" text={item.title} date={date} />;
    }
    return (
      <FeedCard
        type="weekly_post"
        instructorName="Prof. Santos"
        date={date}
        title={item.title}
        onViewTechnique={() => undefined}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.gymLogoPlaceholder}>
          <Text style={styles.gymLogoText}>FM</Text>
        </View>
        <View style={styles.headerMid}>
          <Text style={styles.studentName}>Alex M.</Text>
        </View>
        <BeltBadge belt="blue" size="sm" />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#94A3B8"
            />
          }
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>Recent Posts</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
    gap: 10,
  },
  gymLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  gymLogoText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "800",
  },
  headerMid: {
    flex: 1,
  },
  studentName: {
    color: "#F8FAFC",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionLabel: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 10,
  },
});
