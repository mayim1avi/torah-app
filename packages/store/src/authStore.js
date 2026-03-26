import { create } from 'zustand';

const TOKEN_KEY = 'torah_app_token';

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,       // { id, name, email }
  isLoading: true,  // true while checking SecureStore on launch

  // Called at app launch — loads persisted token
  hydrate: async () => {
    try {
      // Dynamic import so this module can be imported in non-Expo contexts
      const SecureStore = await import('expo-secure-store');
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        // Decode payload (no verify needed — API verifies on each request)
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          set({ token, user: { id: payload.sub, email: payload.email }, isLoading: false });
          return;
        }
        // Expired — clean up
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      }
    } catch {}
    set({ isLoading: false });
  },

  login: async (token, user) => {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch {}
    set({ token, user });
  },

  logout: async () => {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {}
    set({ token: null, user: null });
  },
}));
