'use client';
import { create } from 'zustand';

// Singleton Audio element (client-only)
let _audio = null;

function ensureAudio(store) {
  if (typeof window === 'undefined') return null;
  if (_audio) return _audio;

  _audio = new Audio();

  _audio.addEventListener('loadedmetadata', () => {
    store.setState({ isLoading: false, durationMs: _audio.duration * 1000 });
  });
  _audio.addEventListener('timeupdate', () => {
    store.setState({ positionMs: _audio.currentTime * 1000, durationMs: _audio.duration * 1000 || 0 });
  });
  _audio.addEventListener('play', () => store.setState({ isPlaying: true, isLoading: false }));
  _audio.addEventListener('pause', () => store.setState({ isPlaying: false }));
  _audio.addEventListener('waiting', () => store.setState({ isLoading: true }));
  _audio.addEventListener('canplay', () => store.setState({ isLoading: false }));
  _audio.addEventListener('ended', () => {
    store.setState({ isPlaying: false });
    store.getState().playNext();
  });
  _audio.addEventListener('error', () => store.setState({ isLoading: false, isPlaying: false }));

  return _audio;
}

// Progress sync to server — every 10 seconds when playing and authenticated
let _syncInterval = null;

function startSync(getToken) {
  stopSync();
  _syncInterval = setInterval(async () => {
    const s = useWebPlayerStore.getState();
    const token = getToken();
    if (!s.currentLesson || !s.isPlaying || !token || !s.durationMs) return;
    try {
      const { api } = await import('@torah-app/api-client');
      await api.saveProgress({
        lessonId: s.currentLesson.id,
        positionMs: Math.round(s.positionMs),
        durationMs: Math.round(s.durationMs),
      });
    } catch {}
  }, 10_000);
}

function stopSync() {
  if (_syncInterval) { clearInterval(_syncInterval); _syncInterval = null; }
}

export const useWebPlayerStore = create((set, get, store) => ({
  currentLesson: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  isLoading: false,
  positionMs: 0,
  durationMs: 0,
  speed: 1,
  _getToken: () => null,

  // Call once at app startup to wire progress sync
  init: (getToken) => {
    store.setState({ _getToken: getToken });
  },

  playLesson: (lesson, queue = null) => {
    const audio = ensureAudio(store);
    if (!audio || !lesson.link) return;
    const q = queue ?? [lesson];
    const idx = q.findIndex((l) => l.id === lesson.id);
    audio.src = lesson.link;
    audio.playbackRate = get().speed;
    audio.play().catch(() => {});
    set({ currentLesson: lesson, queue: q, queueIndex: idx >= 0 ? idx : 0, isLoading: true, positionMs: 0, durationMs: 0 });
    startSync(get()._getToken);
  },

  togglePlayPause: () => {
    const audio = ensureAudio(store);
    if (!audio) return;
    if (get().isPlaying) audio.pause();
    else audio.play().catch(() => {});
  },

  seek: (ms) => {
    const audio = ensureAudio(store);
    if (!audio) return;
    audio.currentTime = ms / 1000;
    set({ positionMs: ms });
  },

  setSpeed: (speed) => {
    const audio = ensureAudio(store);
    if (audio) audio.playbackRate = speed;
    set({ speed });
  },

  playNext: () => {
    const { queue, queueIndex, playLesson } = get();
    const next = queue[queueIndex + 1];
    if (next) playLesson(next, queue);
    else stopSync();
  },

  playPrev: () => {
    const { positionMs, queue, queueIndex, playLesson, seek } = get();
    if (positionMs > 3000) { seek(0); return; }
    const prev = queue[queueIndex - 1];
    if (prev) playLesson(prev, queue);
  },

  stop: () => {
    const audio = _audio;
    if (audio) { audio.pause(); audio.src = ''; }
    stopSync();
    set({ currentLesson: null, isPlaying: false, positionMs: 0, durationMs: 0, queue: [], queueIndex: 0 });
  },
}));
