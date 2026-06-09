import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { StatBar } from '../../src/components/StatBar';
import { Cache, CacheKeys } from '../../src/lib/cache';
import { useAuthStore } from '../../src/store/authStore';
import { useIsOnline } from '../../src/components/OfflineBanner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SHOW_FLOWCHART = true; // Toggle to false to see empty state

// Shape for cached flowchart data
interface FlowchartData {
  nodes: Array<{ id: string; label: string; x: number; y: number }>;
  edges: Array<{ from: string; to: string }>;
  stats: { techniques: number; connections: number; positions: number };
}

function buildFlowchartHTML(primaryColor: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; background: #0F172A; overflow: hidden; }
  svg { display: block; }
</style>
</head>
<body>
<svg width="100%" height="100%" viewBox="0 0 360 580" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="360" height="580" fill="#0F172A"/>

  <!-- Edges / connections -->
  <line x1="180" y1="70" x2="90" y2="150" stroke="${primaryColor}" stroke-width="2" opacity="0.7"/>
  <line x1="180" y1="70" x2="270" y2="150" stroke="${primaryColor}" stroke-width="2" opacity="0.7"/>
  <line x1="90" y1="200" x2="90" y2="290" stroke="${primaryColor}" stroke-width="2" opacity="0.7"/>
  <line x1="270" y1="200" x2="180" y2="360" stroke="${primaryColor}" stroke-width="2" opacity="0.7"/>
  <line x1="90" y1="340" x2="180" y2="420" stroke="${primaryColor}" stroke-width="2" opacity="0.7"/>
  <!-- Arrow markers -->
  <defs>
    <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
      <polygon points="0 0, 6 3, 0 6" fill="${primaryColor}" opacity="0.7"/>
    </marker>
  </defs>

  <!-- Node 1: Closed Guard -->
  <rect x="110" y="30" width="140" height="40" rx="10" fill="#334155" stroke="${primaryColor}" stroke-width="1.5"/>
  <text x="180" y="55" text-anchor="middle" fill="#F8FAFC" font-size="12" font-weight="600" font-family="sans-serif">Closed Guard</text>

  <!-- Node 2: Hip Bump Sweep -->
  <rect x="20" y="155" width="140" height="40" rx="10" fill="#334155" stroke="${primaryColor}" stroke-width="1.5"/>
  <text x="90" y="180" text-anchor="middle" fill="#F8FAFC" font-size="12" font-weight="600" font-family="sans-serif">Hip Bump Sweep</text>

  <!-- Node 3: Armbar from Guard -->
  <rect x="200" y="155" width="140" height="40" rx="10" fill="#334155" stroke="${primaryColor}" stroke-width="1.5"/>
  <text x="270" y="173" text-anchor="middle" fill="#F8FAFC" font-size="11" font-weight="600" font-family="sans-serif">Armbar from</text>
  <text x="270" y="188" text-anchor="middle" fill="#F8FAFC" font-size="11" font-weight="600" font-family="sans-serif">Guard</text>

  <!-- Node 4: Scissor Sweep -->
  <rect x="20" y="295" width="140" height="40" rx="10" fill="#334155" stroke="${primaryColor}" stroke-width="1.5"/>
  <text x="90" y="320" text-anchor="middle" fill="#F8FAFC" font-size="12" font-weight="600" font-family="sans-serif">Scissor Sweep</text>

  <!-- Node 5: Triangle Choke -->
  <rect x="110" y="365" width="140" height="40" rx="10" fill="#334155" stroke="${primaryColor}" stroke-width="1.5"/>
  <text x="180" y="383" text-anchor="middle" fill="#F8FAFC" font-size="11" font-weight="600" font-family="sans-serif">Triangle</text>
  <text x="180" y="398" text-anchor="middle" fill="#F8FAFC" font-size="11" font-weight="600" font-family="sans-serif">Choke</text>

  <!-- Node 6: Omoplata -->
  <rect x="110" y="470" width="140" height="40" rx="10" fill="#1E293B" stroke="#475569" stroke-width="1.5" stroke-dasharray="6,3"/>
  <text x="180" y="495" text-anchor="middle" fill="#94A3B8" font-size="12" font-weight="600" font-family="sans-serif">Omoplata</text>
  <text x="180" y="530" text-anchor="middle" fill="#475569" font-size="10" font-family="sans-serif">Not yet logged</text>
</svg>
</body>
</html>`;
}

export default function FlowchartScreen() {
  const { primaryColor } = useTheme();
  const router = useRouter();
  const { userId } = useAuthStore();
  const isOnline = useIsOnline();
  const showFlowchart = SHOW_FLOWCHART;

  // Cache-aware data loading
  useEffect(() => {
    const cacheKey = userId ? CacheKeys.flowchart(userId) : null;
    if (!cacheKey) return;

    (async () => {
      try {
        // Load from cache (stale ok if offline)
        const cached = isOnline
          ? await Cache.get<FlowchartData>(cacheKey)
          : await Cache.getStale<FlowchartData>(cacheKey);

        if (cached) {
          // In production: use cached.nodes / cached.edges to render the chart
          console.log('[Flowchart] Loaded from cache, nodes:', cached.nodes?.length);
        }
      } catch (error) {
        console.warn('[Flowchart] Cache read failed:', error);
      }

      // Background-refresh only when online
      if (!isOnline) return;

      try {
        // In production: fetch from /api/v1/users/${userId}/flowchart
        // const { data } = await apiClient.get(`/api/v1/users/${userId}/flowchart`);
        // await Cache.set(cacheKey, data);
      } catch (error) {
        console.warn('[Flowchart] Background refresh failed:', error);
      }
    })();
  }, [userId, isOnline]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Flowchart</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <StatBar
          stats={[
            { label: 'Techniques', value: 12 },
            { label: 'Connections', value: 8 },
            { label: 'Positions', value: 4 },
          ]}
        />
      </View>

      {/* Content */}
      {showFlowchart ? (
        <View style={styles.webviewContainer}>
          <WebView
            source={{ html: buildFlowchartHTML(primaryColor) }}
            style={styles.webview}
            scrollEnabled={true}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            originWhitelist={['*']}
          />
        </View>
      ) : (
        <View style={styles.emptyState}>
          {/* BJJ mat SVG illustration */}
          <View style={styles.matIllustration}>
            <Text style={styles.matIllustrationText}>⬡</Text>
          </View>
          <Text style={styles.emptyTitle}>Your game plan grows here.</Text>
          <Text style={styles.emptySubtitle}>
            Log your first technique after class
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: primaryColor }]}
            onPress={() => router.push('/(tabs)/log')}
            activeOpacity={0.85}
          >
            <Text style={styles.emptyButtonText}>Log a Technique</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: primaryColor }]}
        onPress={() => router.push('/(tabs)/log')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  webviewContainer: {
    flex: 1,
    marginHorizontal: 0,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  matIllustration: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  matIllustrationText: {
    fontSize: 64,
    color: '#334155',
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  emptyButton: {
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
