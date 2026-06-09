import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';

export default function AppIndex() {
  const { isAuthenticated } = useAuthStore();
  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}
