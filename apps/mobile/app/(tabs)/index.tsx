import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FeedCard } from '../../src/components/FeedCard';
import { BeltBadge } from '../../src/components/BeltBadge';
import type { FeedItem } from '../../src/api/feed';

const MOCK_FEED: FeedItem[] = [
  {
    id: 'feed-1',
    type: 'announcement',
    text: 'No-gi class this Saturday is moved to 11am. Open mat follows at 12:30pm.',
    date: 'Jun 7',
  },
  {
    id: 'feed-2',
    type: 'weekly_post',
    instructorName: 'Prof. Santos',
    instructorAvatarUrl: null,
    date: 'Jun 5',
    title: 'This Week: Armbar Entries from Closed Guard',
    techniqueId: 'tech-armbar-guard',
    thumbnailUrl: null,
  },
  {
    id: 'feed-3',
    type: 'weekly_post',
    instructorName: 'Prof. Santos',
    instructorAvatarUrl: null,
    date: 'May 29',
    title: 'Hip Bump Sweep → Kimura Follow-up',
    techniqueId: 'tech-hip-bump',
    thumbnailUrl: null,
  },
  {
    id: 'feed-4',
    type: 'announcement',
    text: 'Summer belt promotion ceremony is scheduled for July 12th. Attendance mandatory for promotions.',
    date: 'May 25',
  },
  {
    id: 'feed-5',
    type: 'weekly_post',
    instructorName: 'Prof. Santos',
    instructorAvatarUrl: null,
    date: 'May 22',
    title: 'X-Guard Entry from Seated Guard',
    techniqueId: 'tech-x-guard',
    thumbnailUrl: null,
  },
];

export default function FeedScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.type === 'announcement') {
      return <FeedCard type="announcement" text={item.text} date={item.date} />;
    }
    return (
      <FeedCard
        type="weekly_post"
        instructorName={item.instructorName}
        date={item.date}
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

      <FlatList
        data={MOCK_FEED}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 10,
  },
  gymLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gymLogoText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '800',
  },
  headerMid: {
    flex: 1,
  },
  studentName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  sectionLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 10,
  },
});
