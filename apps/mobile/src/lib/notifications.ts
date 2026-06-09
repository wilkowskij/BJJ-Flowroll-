import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Replace with actual EAS project ID once configured
const EAS_PROJECT_ID = '<EAS_PROJECT_ID>';

/**
 * Requests push notification permission and returns the Expo push token string,
 * or null if permission is denied or an error occurs.
 * Never throws — the app must not crash if FCM is not configured.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Expo Go on web doesn't support push notifications
    if (Platform.OS === 'web') {
      console.log('[Notifications] Push notifications not supported on web');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission denied for push notifications');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });

    return tokenData.data;
  } catch (error) {
    console.warn('[Notifications] Registration failed:', error);
    return null;
  }
}
