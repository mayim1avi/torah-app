import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useAudioPlayer } from '../src/audio/useAudioPlayer.js';
import { MiniPlayer } from '../src/components/MiniPlayer.jsx';
import { useAuthStore } from '@torah-app/store';
import { setTokenProvider } from '@torah-app/api-client';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 2 } },
});

function AudioEngine() {
  useAudioPlayer();
  return null;
}

function AuthHydrator() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const token = useAuthStore((s) => s.token);

  useEffect(() => { hydrate(); }, []);

  // Keep api-client's token provider in sync
  useEffect(() => {
    setTokenProvider(() => useAuthStore.getState().token);
  }, [token]);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <AuthHydrator />
      <AudioEngine />
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0a1f14' },
            headerTintColor: '#e8f5e9',
            headerTitleStyle: { fontWeight: '700' },
            contentStyle: { backgroundColor: '#0d2618' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="category/[id]" options={{ title: '' }} />
          <Stack.Screen name="series/[id]" options={{ title: '' }} />
          <Stack.Screen name="lesson/[id]" options={{ title: '' }} />
          <Stack.Screen name="teacher/[id]" options={{ title: '' }} />
          <Stack.Screen name="auth/index" options={{ title: 'כניסה', presentation: 'modal' }} />
        </Stack>
        <MiniPlayer />
      </View>
    </QueryClientProvider>
  );
}
