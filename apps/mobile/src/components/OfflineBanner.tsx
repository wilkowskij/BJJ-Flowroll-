import React, { useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

const BANNER_HEIGHT = 36;

/**
 * Hook that returns the current online status.
 * Defaults to true (online) until NetInfo reports otherwise.
 * Gracefully no-ops on platforms where NetInfo is unavailable.
 */
export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    try {
      unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
        setIsOnline(state.isConnected !== false);
      });
    } catch (error) {
      console.warn('[OfflineBanner] NetInfo not available:', error);
    }
    return () => {
      unsubscribe?.();
    };
  }, []);

  return isOnline;
}

/**
 * Slim amber banner that slides in from the top when the device is offline.
 * Add this to the root layout so it appears on every screen.
 */
export function OfflineBanner() {
  const isOnline = useIsOnline();
  const translateY = useSharedValue(-BANNER_HEIGHT);

  useEffect(() => {
    translateY.value = withTiming(isOnline ? -BANNER_HEIGHT : 0, {
      duration: 300,
      easing: Easing.out(Easing.ease),
    });
  }, [isOnline, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.banner, animatedStyle]}>
      <Text style={styles.text}>
        You're offline — showing cached content
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  text: {
    color: '#1C1917',
    fontSize: 12,
    fontWeight: '600',
  },
});
