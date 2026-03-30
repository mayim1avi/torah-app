import { create } from 'zustand';

const GUEST_PLAYS_KEY = 'torah_guest_plays';

async function getGuestPlays() {
  try {
    const SecureStore = await import('expo-secure-store');
    const raw = await SecureStore.getItemAsync(GUEST_PLAYS_KEY);
    const stored = raw ? JSON.parse(raw) : null;
    const month = new Date().toISOString().slice(0, 7);
    return stored?.month === month ? stored : { month, lessonIds: [] };
  } catch { return { month: new Date().toISOString().slice(0, 7), lessonIds: [] }; }
}

async function recordGuestPlay(lessonId) {
  try {
    const SecureStore = await import('expo-secure-store');
    const plays = await getGuestPlays();
    if (!plays.lessonIds.includes(lessonId)) {
      plays.lessonIds.push(lessonId);
      await SecureStore.setItemAsync(GUEST_PLAYS_KEY, JSON.stringify(plays));
    }
  } catch {}
}

export const usePlayerStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────────────────────
  currentLesson: null,   // full lesson object
  queue: [],             // ordered lesson array
  queueIndex: 0,         // index of currentLesson in queue
  isPlaying: false,
  isLoading: false,
  positionMs: 0,
  durationMs: 0,
  speed: 1,
  loginGateVisible: false,

  // ── Actions ──────────────────────────────────────────────────────────────

  dismissLoginGate: () => set({ loginGateVisible: false }),

  /**
   * Start playing a lesson, optionally with a queue.
   * If queue is omitted the lesson plays solo.
   */
  playLesson: async (lesson, queue = null) => {
    // Guest lesson limit: 5 unique lessons per calendar month
    const { useAuthStore } = await import('./authStore.js');
    const token = useAuthStore.getState().token;
    if (!token) {
      const plays = await getGuestPlays();
      if (!plays.lessonIds.includes(lesson.id) && plays.lessonIds.length >= 5) {
        set({ loginGateVisible: true });
        return;
      }
      await recordGuestPlay(lesson.id);
    }
    const resolvedQueue = queue ?? [lesson];
    const idx = resolvedQueue.findIndex((l) => l.id === lesson.id);
    set({
      currentLesson: lesson,
      queue: resolvedQueue,
      queueIndex: idx >= 0 ? idx : 0,
      isPlaying: true,
      isLoading: true,
      positionMs: 0,
      durationMs: 0,
      loginGateVisible: false,
    });
  },

  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),

  togglePlayPause: () => {
    const { isPlaying } = get();
    set({ isPlaying: !isPlaying });
  },

  seek: (ms) => set({ positionMs: ms }),

  playNext: () => {
    const { queue, queueIndex } = get();
    if (queueIndex < queue.length - 1) {
      const nextIndex = queueIndex + 1;
      set({
        currentLesson: queue[nextIndex],
        queueIndex: nextIndex,
        isPlaying: true,
        isLoading: true,
        positionMs: 0,
        durationMs: 0,
      });
    }
  },

  playPrev: () => {
    const { queue, queueIndex, positionMs } = get();
    // If >3 seconds in, restart current; otherwise go to prev
    if (positionMs > 3000) {
      set({ positionMs: 0 });
    } else if (queueIndex > 0) {
      const prevIndex = queueIndex - 1;
      set({
        currentLesson: queue[prevIndex],
        queueIndex: prevIndex,
        isPlaying: true,
        isLoading: true,
        positionMs: 0,
        durationMs: 0,
      });
    }
  },

  setSpeed: (speed) => set({ speed }),

  // Called by the audio engine to sync playback position
  _setPosition: (positionMs, durationMs) =>
    set({ positionMs, durationMs }),

  _setLoading: (isLoading) => set({ isLoading }),

  stop: () =>
    set({
      currentLesson: null,
      queue: [],
      queueIndex: 0,
      isPlaying: false,
      isLoading: false,
      positionMs: 0,
      durationMs: 0,
    }),
}));
