import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { offlineApi } from '../hooks/useOfflineApi';
import { OFFLINE_MODE } from '../hooks/useApi';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(!OFFLINE_MODE);

  useEffect(() => {
    if (OFFLINE_MODE && !dbReady) {
      console.log('🗄️ Initializing offline database...');
      offlineApi
        .initDatabase()
        .then(() => {
          console.log('✅ Offline database ready');
          setDbReady(true);
        })
        .catch((err) => {
          console.error('❌ Failed to initialize database:', err);
          setDbReady(true); // Still set to true to allow app to continue
        });
    }
  }, []);

  if (!dbReady) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
