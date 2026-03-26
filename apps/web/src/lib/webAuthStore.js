'use client';
import { create } from 'zustand';

const TOKEN_KEY = 'torah_app_token';

function decodeToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 > Date.now()) return payload;
  } catch {}
  return null;
}

export const useWebAuthStore = create((set) => ({
  token: null,
  user: null,
  isLoading: true,

  hydrate: () => {
    if (typeof window === 'undefined') { set({ isLoading: false }); return; }
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      const payload = decodeToken(token);
      if (payload) {
        set({ token, user: { id: payload.sub, name: payload.name, email: payload.email }, isLoading: false });
        return;
      }
      localStorage.removeItem(TOKEN_KEY);
    }
    set({ isLoading: false });
  },

  login: (token, user) => {
    if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
    set({ token, user });
  },

  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null });
  },
}));
