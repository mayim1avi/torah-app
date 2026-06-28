import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import { Audio } from 'expo-av';
import { usePlayerStore, useAuthStore } from '@torah-app/store';
import { api } from '@torah-app/api-client';

const POSITION_POLL_MS = 500;
const PROGRESS_SYNC_MS = 10_000; // sync to server every 10 seconds

export function useAudioPlayer() {
  const soundRef = useRef(null);
  const pollRef = useRef(null);
  const syncRef = useRef(null);

  const currentLesson = usePlayerStore((s) => s.currentLesson);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const positionMs = usePlayerStore((s) => s.positionMs);
  const speed = usePlayerStore((s) => s.speed);
  const _setPosition = usePlayerStore((s) => s._setPosition);
  const _setLoading = usePlayerStore((s) => s._setLoading);
  const playNext = usePlayerStore((s) => s.playNext);
  const token = useAuthStore((s) => s.token);

  // Configure audio session once
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    }).catch(() => {});
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (syncRef.current) { clearInterval(syncRef.current); syncRef.current = null; }
  }, []);

  const unloadSound = useCallback(async () => {
    stopPolling();
    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
  }, [stopPolling]);

  // Load and play when lesson changes
  useEffect(() => {
    if (!currentLesson?.link) return;
    let cancelled = false;

    async function load() {
      await unloadSound();
      if (cancelled) return;
      _setLoading(true);

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: currentLesson.link },
          { shouldPlay: false, rate: speed },
          (status) => {
            if (!status.isLoaded) return;
            _setPosition(status.positionMillis ?? 0, status.durationMillis ?? 0);
            if (status.didJustFinish) { _setPosition(0, 0); playNext(); }
          }
        );

        if (cancelled) { await sound.unloadAsync().catch(() => {}); return; }
        soundRef.current = sound;
        _setLoading(false);

        // Restore saved position for authenticated users
        if (token) {
          try {
            const saved = await api.getProgress(currentLesson.id);
            const pos = saved?.position_ms ?? 0;
            const dur = saved?.duration_ms ?? 0;
            if (pos > 0 && (dur === 0 || pos < dur * 0.95)) {
              await sound.setPositionAsync(pos).catch(() => {});
            }
          } catch {}
        }

        // Start playback if the store still wants it playing
        if (usePlayerStore.getState().isPlaying) {
          await sound.playAsync().catch(() => {});
        }

        // Position polling
        pollRef.current = setInterval(async () => {
          if (!soundRef.current) return;
          const st = await soundRef.current.getStatusAsync().catch(() => null);
          if (st?.isLoaded) _setPosition(st.positionMillis ?? 0, st.durationMillis ?? 0);
        }, POSITION_POLL_MS);

        // Progress sync to server (only when logged in)
        syncRef.current = setInterval(() => {
          if (!token || !currentLesson?.id) return;
          const { positionMs: pos, durationMs: dur } = usePlayerStore.getState();
          api.saveProgress({ lessonId: currentLesson.id, positionMs: pos, durationMs: dur })
            .catch(() => {});
        }, PROGRESS_SYNC_MS);

      } catch {
        _setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLesson?.id]);

  // Play/pause
  useEffect(() => {
    if (!soundRef.current) return;
    if (isPlaying) {
      soundRef.current.playAsync().catch(() => {});
    } else {
      soundRef.current.pauseAsync().catch(() => {});
      // Save position on pause
      if (token && currentLesson?.id) {
        const { positionMs: pos, durationMs: dur } = usePlayerStore.getState();
        if (dur > 0) {
          api.saveProgress({ lessonId: currentLesson.id, positionMs: pos, durationMs: dur }).catch(() => {});
        }
      }
    }
  }, [isPlaying]);

  // Speed
  useEffect(() => {
    if (!soundRef.current) return;
    soundRef.current.setRateAsync(speed, true).catch(() => {});
  }, [speed]);

  // Seek (user-initiated: large delta vs last polled value)
  const lastPolledMs = useRef(0);
  useEffect(() => {
    if (!soundRef.current) return;
    if (Math.abs(positionMs - lastPolledMs.current) > 1000) {
      soundRef.current.setPositionAsync(positionMs).catch(() => {});
    }
    lastPolledMs.current = positionMs;
  }, [positionMs]);

  // Save progress when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'background' && nextState !== 'inactive') return;
      if (!token || !currentLesson?.id) return;
      const { positionMs: pos, durationMs: dur } = usePlayerStore.getState();
      if (dur > 0) {
        api.saveProgress({ lessonId: currentLesson.id, positionMs: pos, durationMs: dur }).catch(() => {});
      }
    });
    return () => sub.remove();
  }, [token, currentLesson?.id]);

  useEffect(() => () => { unloadSound(); }, [unloadSound]);
}
