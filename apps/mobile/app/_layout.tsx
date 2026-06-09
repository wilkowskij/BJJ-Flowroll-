import '../global.css';
import React, { useState, useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import type { Subscription } from 'expo-notifications';
import { ThemeProvider } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';
import { useAuthStore } from '../src/store/authStore';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { registerForPushNotifications } from '../src/lib/notifications';
import apiClient from '../src/api/client';

const MOCK_GYM_CONFIG = {
  primaryColor: '#1B4FD8',
  secondaryColor: '#F59E0B',
  logoUrl: null as string | null,
};

export default function RootLayout() {
  const [gymConfig, setGymConfig] = useState(MOCK_GYM_CONFIG);
  const { userId, gymId, token, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const notificationListenerRef = useRef<Subscription | null>(null);

  useEffect(() => {
    // In production this would be: fetch(`/api/gyms/${gymId}/config`)
    setGymConfig(MOCK_GYM_CONFIG);
  }, [gymId]);

  // Register for push notifications once authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          try {
            await apiClient.put('/api/v1/users/me/fcm-token', { token });
          } catch (error) {
            console.warn('[FCM] Failed to send push token to server:', error);
          }
        }
      } catch (error) {
        console.warn('[FCM] Push notification setup failed:', error);
      }
    })();
  }, [isAuthenticated]);

  // Set up notification tap handler
  useEffect(() => {
    try {
      notificationListenerRef.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          try {
            const data = response.notification.request.content.data as Record<string, unknown>;
            const type = data?.type as string | undefined;

            switch (type) {
              case 'weekly_post':
                router.push('/(tabs)/');
                break;
              case 'belt_promotion':
                router.push('/(tabs)/profile');
                break;
              case 'announcement':
                router.push('/(tabs)/');
                break;
              case 'qr_checkin':
                router.push('/(tabs)/checkin');
                break;
              default:
                break;
            }
          } catch (error) {
            console.warn('[FCM] Error handling notification tap:', error);
          }
        });
    } catch (error) {
      console.warn('[FCM] Could not set up notification listener:', error);
    }

    return () => {
      notificationListenerRef.current?.remove();
    };
  }, [router]);

  const authValue = {
    userId,
    gymId,
    token,
    isAuthenticated,
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={gymConfig}>
        <AuthProvider value={authValue}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0F172A' },
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
          <OfflineBanner />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
