'use client';
import { useEffect, useRef } from 'react';
import { useWebPlayerStore } from '../lib/webPlayerStore.js';

function fmt(ms) {
  if (!ms || isNaN(ms)) return '0:00';
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

const C = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: '#000a', zIndex: 300,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
  },
  sheet: {
    backgroundColor: '#0a1f14',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    width: '100%', maxWidth: 600,
    padding: '24px 24px 48px',
    display: 'flex', flexDirection: 'column', gap: 20,
    maxHeight: '90vh', overflowY: 'auto', position: 'relative',
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#2d5c40', margin: '0 auto' },
  artwork: {
    width: 140, height: 140, borderRadius: 18,
    backgroundColor: '#1a3a2a', border: '1px solid #2d5c40',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 64, margin: '0 auto',
  },
  titleWrap: { textAlign: 'center' },
  title: { color: '#e8f5e9', fontSize: 17, fontWeight: 700, lineHeight: 1.4 },
  teacher: { color: '#81c784', fontSize: 14, marginTop: 4 },
  queuePos: { color: '#4a7c59', fontSize: 12, marginTop: 4 },
  progressWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  track: {
    height: 4, backgroundColor: '#1a3a2a', borderRadius: 2,
    cursor: 'pointer', position: 'relative', direction: 'ltr',
  },
  times: { display: 'flex', justifyContent: 'space-between', color: '#4a7c59', fontSize: 11, direction: 'ltr' },
  controls: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, direction: 'ltr' },
  navBtn: (enabled) => ({
    background: 'none', border: 'none', color: '#81c784',
    fontSize: 22, cursor: enabled ? 'pointer' : 'default',
    padding: 8, opacity: enabled ? 1 : 0.25,
  }),
  skipBtn: {
    background: 'none', border: 'none', color: '#81c784',
    cursor: 'pointer', padding: '6px 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
  },
  skipIcon: { fontSize: 22 },
  skipLabel: { fontSize: 10, color: '#4a7c59', fontWeight: 700 },
  playBtn: {
    width: 68, height: 68, borderRadius: '50%', border: 'none',
    backgroundColor: '#4caf50', fontSize: 30, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 8px',
  },
  speeds: { display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  speedChip: (active) => ({
    padding: '5px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
    backgroundColor: active ? '#4caf50' : '#1a3a2a',
    color: active ? '#0a1f14' : '#81c784',
    border: `1px solid ${active ? '#4caf50' : '#2d5c40'}`,
    fontWeight: active ? 700 : 400,
  }),
  closeBtn: {
    position: 'absolute', top: 16, right: 16,
    background: 'none', border: 'none', color: '#4a7c59',
    fontSize: 22, cursor: 'pointer',
  },
};

export function PlayerModal({ onClose }) {
  const lesson = useWebPlayerStore((s) => s.currentLesson);
  const queue = useWebPlayerStore((s) => s.queue);
  const queueIndex = useWebPlayerStore((s) => s.queueIndex);
  const isPlaying = useWebPlayerStore((s) => s.isPlaying);
  const positionMs = useWebPlayerStore((s) => s.positionMs);
  const durationMs = useWebPlayerStore((s) => s.durationMs);
  const speed = useWebPlayerStore((s) => s.speed);
  const togglePlayPause = useWebPlayerStore((s) => s.togglePlayPause);
  const seek = useWebPlayerStore((s) => s.seek);
  const seekRelative = useWebPlayerStore((s) => s.seekRelative);
  const setSpeed = useWebPlayerStore((s) => s.setSpeed);
  const playNext = useWebPlayerStore((s) => s.playNext);
  const playPrev = useWebPlayerStore((s) => s.playPrev);
  const trackRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!lesson) { onClose(); return null; }

  const pct = durationMs > 0 ? Math.min((positionMs / durationMs) * 100, 100) : 0;
  const canPrev = queueIndex > 0;
  const canNext = queueIndex < queue.length - 1;
  const hasSeries = queue.length > 1;

  function handleTrackClick(e) {
    if (!trackRef.current || !durationMs) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio * durationMs);
  }

  return (
    <div style={C.overlay} onClick={onClose}>
      <div style={C.sheet} onClick={(e) => e.stopPropagation()}>
        <button style={C.closeBtn} onClick={onClose}>✕</button>
        <div style={C.handle} />

        <div style={C.artwork}>{lesson.has_audio ? '🎵' : '▶️'}</div>

        <div style={C.titleWrap}>
          <div style={C.title}>{lesson.title ?? lesson.name}</div>
          {lesson.teacher_name && <div style={C.teacher}>{lesson.teacher_name}</div>}
          {hasSeries && <div style={C.queuePos}>{queueIndex + 1} / {queue.length}</div>}
        </div>

        {/* Progress bar */}
        <div style={C.progressWrap}>
          <div ref={trackRef} style={C.track} onClick={handleTrackClick}>
            <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#4caf50', borderRadius: 2 }} />
          </div>
          <div style={C.times}>
            <span>{fmt(positionMs)}</span>
            <span>{fmt(durationMs)}</span>
          </div>
        </div>

        {/* Controls */}
        <div style={C.controls}>
          {hasSeries && (
            <button style={C.navBtn(canPrev)} onClick={canPrev ? playPrev : undefined} title="שיעור קודם">
              ⏮
            </button>
          )}

          <button style={C.skipBtn} onClick={() => seekRelative(-15000)} title="15 שניות אחורה">
            <span style={C.skipIcon}>↺</span>
            <span style={C.skipLabel}>15</span>
          </button>

          <button style={C.playBtn} onClick={togglePlayPause}>
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button style={C.skipBtn} onClick={() => seekRelative(30000)} title="30 שניות קדימה">
            <span style={C.skipIcon}>↻</span>
            <span style={C.skipLabel}>30</span>
          </button>

          {hasSeries && (
            <button style={C.navBtn(canNext)} onClick={canNext ? playNext : undefined} title="שיעור הבא">
              ⏭
            </button>
          )}
        </div>

        {/* Speed */}
        <div style={C.speeds}>
          {SPEEDS.map((s) => (
            <button key={s} style={C.speedChip(speed === s)} onClick={() => setSpeed(s)}>
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
