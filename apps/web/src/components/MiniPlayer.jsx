'use client';
import { useState } from 'react';
import { useWebPlayerStore } from '../lib/webPlayerStore.js';
import { PlayerModal } from './PlayerModal.jsx';

const C = {
  wrap: {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    backgroundColor: '#0a1f14', borderTop: '1px solid #1a3a2a', zIndex: 200,
  },
  track: { height: 3, backgroundColor: '#1a3a2a', cursor: 'pointer', direction: 'ltr' },
  fill: { height: 3, backgroundColor: '#4caf50', transition: 'width 0.5s linear' },
  body: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    padding: '8px 16px', gap: 12, direction: 'ltr',
  },
  info: { minWidth: 0, cursor: 'pointer', direction: 'rtl' },
  title: { color: '#e8f5e9', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sub: { color: '#81c784', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  controls: { display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, direction: 'ltr' },
  ctrlBtn: {
    background: 'none', border: 'none', color: '#81c784',
    cursor: 'pointer', padding: '4px 6px', fontSize: 13, fontWeight: 700,
    display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1,
  },
  ctrlBtnDisabled: { opacity: 0.25, cursor: 'default' },
  skipLabel: { fontSize: 9, color: '#4a7c59', marginTop: 1 },
  playBtn: {
    width: 42, height: 42, borderRadius: '50%', border: 'none',
    backgroundColor: '#4caf50', fontSize: 18, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 4px',
  },
  speedBtn: {
    background: 'none', border: '1px solid #2d5c40', color: '#81c784',
    borderRadius: 6, padding: '3px 7px', fontSize: 11, cursor: 'pointer',
    fontWeight: 700, flexShrink: 0,
  },
  stopBtn: {
    background: 'none', border: 'none', color: '#4a7c59',
    fontSize: 16, cursor: 'pointer', padding: '4px 6px', flexShrink: 0,
  },
};

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function MiniPlayer() {
  const lesson = useWebPlayerStore((s) => s.currentLesson);
  const queue = useWebPlayerStore((s) => s.queue);
  const queueIndex = useWebPlayerStore((s) => s.queueIndex);
  const isPlaying = useWebPlayerStore((s) => s.isPlaying);
  const positionMs = useWebPlayerStore((s) => s.positionMs);
  const durationMs = useWebPlayerStore((s) => s.durationMs);
  const speed = useWebPlayerStore((s) => s.speed);
  const togglePlayPause = useWebPlayerStore((s) => s.togglePlayPause);
  const seekRelative = useWebPlayerStore((s) => s.seekRelative);
  const setSpeed = useWebPlayerStore((s) => s.setSpeed);
  const playNext = useWebPlayerStore((s) => s.playNext);
  const playPrev = useWebPlayerStore((s) => s.playPrev);
  const stop = useWebPlayerStore((s) => s.stop);
  const [modalOpen, setModalOpen] = useState(false);

  if (!lesson) return null;

  const pct = durationMs > 0 ? Math.min((positionMs / durationMs) * 100, 100) : 0;
  const canPrev = queueIndex > 0;
  const canNext = queueIndex < queue.length - 1;
  const hasSeries = queue.length > 1;
  const nextSpeed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];

  function handleTrackClick(e) {
    if (!durationMs) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    useWebPlayerStore.getState().seek(ratio * durationMs);
  }

  return (
    <>
      <div style={C.wrap}>
        <div style={C.track} onClick={handleTrackClick}>
          <div style={{ ...C.fill, width: `${pct}%` }} />
        </div>
        <div style={C.body}>
          {/* Info — click to open modal */}
          <div style={C.info} onClick={() => setModalOpen(true)}>
            <div style={C.title}>{lesson.title ?? lesson.name}</div>
            {lesson.teacher_name && <div style={C.sub}>{lesson.teacher_name}</div>}
          </div>

          {/* Controls — centered group */}
          <div style={C.controls}>
            {hasSeries && (
              <button
                style={{ ...C.ctrlBtn, ...(canPrev ? {} : C.ctrlBtnDisabled) }}
                onClick={canPrev ? playPrev : undefined}
                title="שיעור קודם"
              >⏮</button>
            )}

            <button style={C.ctrlBtn} onClick={() => seekRelative(-15000)} title="15 שניות אחורה">
              <span>↺</span>
              <span style={C.skipLabel}>15</span>
            </button>

            <button style={C.playBtn} onClick={togglePlayPause}>
              {isPlaying ? '⏸' : '▶'}
            </button>

            <button style={C.ctrlBtn} onClick={() => seekRelative(30000)} title="30 שניות קדימה">
              <span>↻</span>
              <span style={C.skipLabel}>30</span>
            </button>

            {hasSeries && (
              <button
                style={{ ...C.ctrlBtn, ...(canNext ? {} : C.ctrlBtnDisabled) }}
                onClick={canNext ? playNext : undefined}
                title="שיעור הבא"
              >⏭</button>
            )}
          </div>

          {/* Speed + close — right column */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <button style={C.speedBtn} onClick={() => setSpeed(nextSpeed)} title="מהירות">
              {speed}x
            </button>
            <button style={C.stopBtn} onClick={stop} title="עצור">✕</button>
          </div>
        </div>
      </div>

      {modalOpen && <PlayerModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
