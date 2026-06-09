import '../global.css';
import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider } from '../src/context/ThemeContext';
import { AuthProvider } from '../src/context/AuthContext';
import { useAuthStore } from '../src/store/authStore';

const MOCK_GYM_CONFIG = {
  primaryColor: '#1B4FD8',
  secondaryColor: '#F59E0B',
  logoUrl: null as string | null,
};

export default function RootLayout() {
  const [gymConfig, setGymConfig] = useState(MOCK_GYM_CONFIG);
  const { userId, gymId, token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // In production this would be: fetch(`/api/gyms/${gymId}/config`)
    setGymConfig(MOCK_GYM_CONFIG);
  }, [gymId]);

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
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
