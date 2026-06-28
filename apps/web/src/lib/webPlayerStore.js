'use client';
import { create } from 'zustand';

// Singleton Audio element (client-only)
let _audio = null;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function audioProxyUrl(url) {
  if (!url) return url;
  // Route through proxy so the API server handles range requests for servers that don't support them
  return `${API_BASE}/api/audio/proxy?url=${encodeURIComponent(url)}`;
}

function ensureAudio(store) {
  if (typeof window === 'undefined') return null;
  if (_audio) return _audio;

  _audio = new Audio();

  _audio.addEventListener('loadedmetadata', (e) => {
    const dur = e.target.duration * 1000;
    store.setState({ isLoading: false, durationMs: dur });
    // Apply a pending resume position (set by playLesson after fetching saved progress)
    const { _pendingResumeMs } = store.getState();
    if (_pendingResumeMs > 0 && _pendingResumeMs < dur * 0.95) {
      _audio.currentTime = _pendingResumeMs / 1000;
      store.setState({ _pendingResumeMs: 0, positionMs: _pendingResumeMs });
    }
  });
  _audio.addEventListener('timeupdate', (e) => {
    store.setState({ positionMs: e.target.currentTime * 1000, durationMs: e.target.duration * 1000 || 0 });
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

// Debounced save for seek events
let _seekSaveTimeout = null;
function debouncedSaveProgress() {
  if (_seekSaveTimeout) clearTimeout(_seekSaveTimeout);
  _seekSaveTimeout = setTimeout(async () => {
    const s = useWebPlayerStore.getState();
    const token = s._getToken();
    if (!token || !s.currentLesson || !s.durationMs) return;
    try {
      const { api } = await import('@torah-app/api-client');
      await api.saveProgress({ lessonId: s.currentLesson.id, positionMs: Math.round(s.positionMs), durationMs: Math.round(s.durationMs) });
    } catch {}
  }, 500);
}

const GUEST_PLAYS_KEY = 'torah_guest_plays';

function getGuestPlays() {
  try {
    const stored = JSON.parse(localStorage.getItem(GUEST_PLAYS_KEY) || 'null');
    const month = new Date().toISOString().slice(0, 7);
    return stored?.month === month ? stored : { month, lessonIds: [] };
  } catch { return { month: new Date().toISOString().slice(0, 7), lessonIds: [] }; }
}

function recordGuestPlay(lessonId) {
  const plays = getGuestPlays();
  if (!plays.lessonIds.includes(lessonId)) {
    plays.lessonIds.push(lessonId);
    localStorage.setItem(GUEST_PLAYS_KEY, JSON.stringify(plays));
  }
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
  loginGateVisible: false,
  _getToken: () => null,
  _pendingResumeMs: 0,

  // Call once at app startup to wire progress sync
  init: (getToken) => {
    store.setState({ _getToken: getToken });
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'hidden') return;
        const s = useWebPlayerStore.getState();
        const token = s._getToken();
        if (!token || !s.currentLesson || !s.durationMs) return;
        fetch(`${API_BASE}/api/user/progress`, {
          method: 'POST',
          body: JSON.stringify({ lessonId: s.currentLesson.id, positionMs: Math.round(s.positionMs), durationMs: Math.round(s.durationMs) }),
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          keepalive: true,
        }).catch(() => {});
      });
    }
  },

  playLesson: async (lesson, queue = null) => {
    const audio = ensureAudio(store);
    if (!audio || !lesson.link) return;
    // Guest lesson limit: 5 unique lessons per calendar month
    const token = get()._getToken();
    if (!token && typeof window !== 'undefined') {
      const plays = getGuestPlays();
      if (!plays.lessonIds.includes(lesson.id) && plays.lessonIds.length >= 5) {
        set({ loginGateVisible: true });
        return;
      }
      recordGuestPlay(lesson.id);
    }
    const q = queue ?? [lesson];
    const idx = q.findIndex((l) => l.id === lesson.id);
    audio.src = audioProxyUrl(lesson.link);
    audio.playbackRate = get().speed;
    audio.play().catch(() => {});
    set({ currentLesson: lesson, queue: q, queueIndex: idx >= 0 ? idx : 0, isLoading: true, positionMs: 0, durationMs: 0, loginGateVisible: false, _pendingResumeMs: 0 });
    startSync(get()._getToken);

    // Restore saved position for authenticated users
    if (token) {
      try {
        const { api } = await import('@torah-app/api-client');
        const saved = await api.getProgress(lesson.id);
        const pos = saved?.position_ms ?? 0;
        const dur = saved?.duration_ms ?? 0;
        if (pos > 0 && (dur === 0 || pos < dur * 0.95)) {
          // If metadata already loaded, seek immediately; otherwise queue it for the loadedmetadata handler
          if (_audio && !isNaN(_audio.duration) && _audio.duration > 0) {
            _audio.currentTime = pos / 1000;
            store.setState({ positionMs: pos });
          } else {
            store.setState({ _pendingResumeMs: pos });
          }
        }
      } catch {}
    }
  },

  dismissLoginGate: () => set({ loginGateVisible: false }),

  addToQueue: (lessons) => {
    const { currentLesson, queue, playLesson } = get();
    const newLessons = lessons.filter((l) => l.link);
    if (!newLessons.length) return;
    if (!currentLesson) {
      playLesson(newLessons[0], newLessons);
    } else {
      set({ queue: [...queue, ...newLessons] });
    }
  },

  togglePlayPause: () => {
    if (!_audio) return;
    if (get().isPlaying) {
      _audio.pause();
      // Save position on pause
      const { currentLesson, positionMs, durationMs } = get();
      const token = get()._getToken();
      if (token && currentLesson && durationMs > 0) {
        import('@torah-app/api-client').then(({ api }) => {
          api.saveProgress({ lessonId: currentLesson.id, positionMs: Math.round(positionMs), durationMs: Math.round(durationMs) }).catch(() => {});
        });
      }
    } else {
      _audio.play().catch(() => {});
    }
  },

  seek: (ms) => {
    if (!_audio) return;
    _audio.currentTime = ms / 1000;
    set({ positionMs: ms });
    debouncedSaveProgress();
  },

  seekRelative: (deltaMs) => {
    if (!_audio) return;
    const dur = isNaN(_audio.duration) ? 0 : _audio.duration;
    const next = Math.max(0, Math.min(_audio.currentTime + deltaMs / 1000, dur || Infinity));
    _audio.currentTime = next;
    set({ positionMs: next * 1000 });
    debouncedSaveProgress();
  },

  setSpeed: (speed) => {
    if (_audio) _audio.playbackRate = speed;
    set({ speed });
  },

  playNext: async () => {
    const { queue, queueIndex, playLesson } = get();
    const next = queue[queueIndex + 1];
    if (next) { playLesson(next, queue); return; }

    // End of queue — wrap to the first unheard lesson (series loop)
    if (queue.length <= 1) { stopSync(); return; }
    const token = get()._getToken();
    if (!token) { stopSync(); return; }
    try {
      const { api } = await import('@torah-app/api-client');
      const progressMap = await api.getProgressBatch(queue.map(l => l.id));
      const firstUnheard = queue.find(l => !progressMap[l.id]?.completed);
      if (firstUnheard) playLesson(firstUnheard, queue);
      else stopSync();
    } catch { stopSync(); }
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
