'use client';
import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWebAuthStore } from '../lib/webAuthStore.js';
import { useWebPlayerStore } from '../lib/webPlayerStore.js';
import { setTokenProvider } from '@torah-app/api-client';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 2 } },
});

function AuthHydrator() {
  const hydrate = useWebAuthStore((s) => s.hydrate);
  const token = useWebAuthStore((s) => s.token);
  const initPlayer = useWebPlayerStore((s) => s.init);

  useEffect(() => {
    hydrate();
    // Wire player progress sync to auth token
    initPlayer(() => useWebAuthStore.getState().token);
    setTokenProvider(() => useWebAuthStore.getState().token);
  }, []);

  useEffect(() => {
    setTokenProvider(() => useWebAuthStore.getState().token);
  }, [token]);

  return null;
}

export function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator />
      {children}
    </QueryClientProvider>
  );
}
