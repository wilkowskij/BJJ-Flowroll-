import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import {
  getVideos,
  type Technique,
  type BeltLevel,
  type TechniquePosition,
} from '../../src/api/techniques';
import { useAuthStore } from '../../src/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2; // 16 padding each side + 16 gap

const BELT_COLORS: Record<BeltLevel, string> = {
  white: '#F1F5F9',
  blue: '#3B82F6',
  purple: '#A855F7',
  brown: '#92400E',
  black: '#1E293B',
};

const POSITION_FILTERS: Array<{ label: string; value: TechniquePosition | 'All' }> = [
  { label: 'All', value: 'All' },
  { label: 'Guard', value: 'Guard' },
  { label: 'Guard Pass', value: 'Guard Pass' },
  { label: 'Submissions', value: 'Submissions' },
  { label: 'Sweeps', value: 'Sweeps' },
  { label: 'Takedowns', value: 'Takedowns' },
  { label: 'Back Takes', value: 'Back Takes' },
  { label: 'Mount', value: 'Mount' },
];

const BELT_FILTERS: Array<{ label: string; value: BeltLevel | 'All' }> = [
  { label: 'All', value: 'All' },
  { label: 'White', value: 'white' },
  { label: 'Blue', value: 'blue' },
  { label: 'Purple', value: 'purple' },
  { label: 'Brown', value: 'brown' },
  { label: 'Black', value: 'black' },
];

function getBeltColor(beltLevel: string): string {
  const normalized = beltLevel?.toLowerCase() as BeltLevel;
  return BELT_COLORS[normalized] ?? '#64748B';
}

interface VideoPlayerModalProps {
  technique: Technique | null;
  visible: boolean;
  onClose: () => void;
}

function VideoPlayerModal({ technique, visible, onClose }: VideoPlayerModalProps) {
  const insets = useSafeAreaInsets();

  if (!technique) return null;

  const streamUrl = technique.muxPlaybackId
    ? `https://stream.mux.com/${technique.muxPlaybackId}.m3u8`
    : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
        {/* Close button */}
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 12 }]}
          onPress={onClose}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={24} color="#F1F5F9" />
        </TouchableOpacity>

        {/* Video player */}
        <View style={styles.videoContainer}>
          {streamUrl ? (
            <Video
              source={{ uri: streamUrl }}
              style={styles.video}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              shouldPlay={false}
            />
          ) : (
            <View style={styles.processingContainer}>
              <Ionicons name="time-outline" size={48} color="#475569" />
              <Text style={styles.processingText}>Processing...</Text>
              <Text style={styles.processingSubText}>
                This video is still being processed. Check back soon.
              </Text>
            </View>
          )}
        </View>

        {/* Info below player */}
        <ScrollView
          style={styles.modalInfoScroll}
          contentContainerStyle={styles.modalInfoContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modalBeltAccent}>
            <View
              style={[
                styles.modalBeltDot,
                { backgroundColor: getBeltColor(technique.beltLevel) },
              ]}
            />
            <Text style={styles.modalBeltLabel}>
              {technique.beltLevel
                ? technique.beltLevel.charAt(0).toUpperCase() +
                  technique.beltLevel.slice(1) +
                  ' Belt'
                : 'All Belts'}
            </Text>
          </View>
          <Text style={styles.modalTitle}>{technique.title}</Text>
          <Text style={styles.modalPosition}>{technique.position}</Text>
          {technique.description ? (
            <Text style={styles.modalDescription}>{technique.description}</Text>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

interface VideoCardProps {
  technique: Technique;
  onPress: (technique: Technique) => void;
}

function VideoCard({ technique, onPress }: VideoCardProps) {
  const beltColor = getBeltColor(technique.beltLevel);
  const thumbnailUrl = technique.muxPlaybackId
    ? `https://image.mux.com/${technique.muxPlaybackId}/thumbnail.jpg?time=0`
    : null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(technique)}
      activeOpacity={0.8}
    >
      {/* Belt color left border */}
      <View style={[styles.cardBeltAccent, { backgroundColor: beltColor }]} />

      {/* Thumbnail */}
      <View style={styles.thumbnailContainer}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="videocam-outline" size={28} color="#475569" />
          </View>
        )}
        {/* Processing indicator */}
        {!technique.muxPlaybackId && (
          <View style={styles.processingBadge}>
            <Text style={styles.processingBadgeText}>●</Text>
          </View>
        )}
        {/* Play overlay */}
        {technique.muxPlaybackId ? (
          <View style={styles.playOverlay}>
            <Ionicons name="play" size={20} color="#FFFFFF" />
          </View>
        ) : null}
      </View>

      {/* Card content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {technique.title}
        </Text>
        <Text style={styles.cardPosition} numberOfLines={1}>
          {technique.position?.toLowerCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function VideosScreen() {
  const gymId = useAuthStore.getState().gymId;
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState<TechniquePosition | 'All'>('All');
  const [beltFilter, setBeltFilter] = useState<BeltLevel | 'All'>('All');
  const [selectedVideo, setSelectedVideo] = useState<Technique | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadVideos = useCallback(async () => {
    if (!gymId) {
      setError('No gym associated with your account.');
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setError(null);
      const { data } = await getVideos(gymId);
      // Filter client-side: only items with a muxPlaybackId are "video" items
      const withVideo = data.filter((t) => t.muxPlaybackId);
      setTechniques(withVideo);
    } catch (err) {
      console.warn('Failed to load videos', err);
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gymId]);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadVideos();
  }, [loadVideos]);

  const openVideo = useCallback((technique: Technique) => {
    setSelectedVideo(technique);
    setModalVisible(true);
  }, []);

  const closeVideo = useCallback(() => {
    setModalVisible(false);
    setSelectedVideo(null);
  }, []);

  // Apply client-side position + belt filters
  const filtered = techniques.filter((t) => {
    const matchPosition =
      positionFilter === 'All' ||
      t.position?.toLowerCase() === positionFilter.toLowerCase();
    const matchBelt =
      beltFilter === 'All' ||
      t.beltLevel?.toLowerCase() === beltFilter.toLowerCase();
    return matchPosition && matchBelt;
  });

  const renderCard = ({ item }: { item: Technique }) => (
    <VideoCard technique={item} onPress={openVideo} />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Video Library</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1B4FD8" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#64748B" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadVideos}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
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
            <View>
              {/* Position filter chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {POSITION_FILTERS.map((f) => {
                  const active = positionFilter === f.value;
                  return (
                    <TouchableOpacity
                      key={f.value}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setPositionFilter(f.value as TechniquePosition | 'All')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.chipText, active && styles.chipTextActive]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Belt filter chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {BELT_FILTERS.map((f) => {
                  const active = beltFilter === f.value;
                  const beltColor =
                    f.value !== 'All' ? getBeltColor(f.value) : undefined;
                  return (
                    <TouchableOpacity
                      key={f.value}
                      style={[
                        styles.chip,
                        active && styles.chipActive,
                        beltColor && active
                          ? { backgroundColor: beltColor, borderColor: beltColor }
                          : undefined,
                      ]}
                      onPress={() => setBeltFilter(f.value as BeltLevel | 'All')}
                      activeOpacity={0.7}
                    >
                      {beltColor && (
                        <View
                          style={[
                            styles.beltDot,
                            { backgroundColor: beltColor },
                          ]}
                        />
                      )}
                      <Text
                        style={[
                          styles.chipText,
                          active && styles.chipTextActive,
                          beltColor && active && f.value === 'white'
                            ? { color: '#0F172A' }
                            : undefined,
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="play-circle-outline" size={64} color="#334155" />
              <Text style={styles.emptyTitle}>No videos yet</Text>
              <Text style={styles.emptySubtitle}>
                Technique videos from your gym will appear here.
              </Text>
            </View>
          }
        />
      )}

      <VideoPlayerModal
        technique={selectedVideo}
        visible={modalVisible}
        onClose={closeVideo}
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  title: {
    color: '#F1F5F9',
    fontSize: 24,
    fontWeight: '800',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#1B4FD8',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 4,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipActive: {
    backgroundColor: '#1B4FD8',
    borderColor: '#1B4FD8',
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  beltDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  columnWrapper: {
    gap: 16,
    marginBottom: 16,
  },
  // Card styles
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBeltAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    zIndex: 1,
  },
  thumbnailContainer: {
    width: '100%',
    height: CARD_WIDTH * 0.6,
    backgroundColor: '#334155',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 9999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  processingBadgeText: {
    color: '#000',
    fontSize: 8,
  },
  playOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 9999,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    paddingHorizontal: 10,
    paddingLeft: 14,
    paddingVertical: 10,
    gap: 4,
  },
  cardTitle: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  cardPosition: {
    color: '#64748B',
    fontSize: 11,
    textTransform: 'lowercase',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 9999,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  processingText: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '700',
  },
  processingSubText: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
  modalInfoScroll: {
    flex: 1,
  },
  modalInfoContent: {
    padding: 20,
    gap: 8,
  },
  modalBeltAccent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modalBeltDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalBeltLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalTitle: {
    color: '#F1F5F9',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  modalPosition: {
    color: '#64748B',
    fontSize: 14,
    textTransform: 'lowercase',
    marginBottom: 8,
  },
  modalDescription: {
    color: '#94A3B8',
    fontSize: 15,
    lineHeight: 22,
  },
});
