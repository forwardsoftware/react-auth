import AppRoutes from '@/app/routes';
import { AuthProvider } from '@/src/auth';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export const unstable_settings = {
  anchor: 'index',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppRoutes />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
