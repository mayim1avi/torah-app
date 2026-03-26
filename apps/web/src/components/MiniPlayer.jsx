'use client';
import { useState } from 'react';
import { useWebPlayerStore } from '../lib/webPlayerStore.js';
import { PlayerModal } from './PlayerModal.jsx';

const C = {
  wrap: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0a1f14',
    borderTop: '1px solid #1a3a2a',
    zIndex: 200,
  },
  track: { height: 2, backgroundColor: '#1a3a2a' },
  fill: { height: 2, backgroundColor: '#4caf50', transition: 'width 0.5s linear' },
  body: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    gap: 12,
    cursor: 'pointer',
  },
  icon: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: '#1a3a2a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  title: { color: '#e8f5e9', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sub: { color: '#81c784', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  controls: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  playBtn: {
    width: 38, height: 38, borderRadius: '50%',
    backgroundColor: '#4caf50', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', fontSize: 16,
  },
  stopBtn: {
    background: 'none', border: 'none', color: '#4a7c59',
    fontSize: 18, cursor: 'pointer', padding: 4,
  },
};

export function MiniPlayer() {
  const lesson = useWebPlayerStore((s) => s.currentLesson);
  const isPlaying = useWebPlayerStore((s) => s.isPlaying);
  const positionMs = useWebPlayerStore((s) => s.positionMs);
  const durationMs = useWebPlayerStore((s) => s.durationMs);
  const togglePlayPause = useWebPlayerStore((s) => s.togglePlayPause);
  const stop = useWebPlayerStore((s) => s.stop);
  const [modalOpen, setModalOpen] = useState(false);

  if (!lesson) return null;

  const pct = durationMs > 0 ? Math.min((positionMs / durationMs) * 100, 100) : 0;

  return (
    <>
      <div style={C.wrap}>
        <div style={C.track}>
          <div style={{ ...C.fill, width: `${pct}%` }} />
        </div>
        <div style={C.body} onClick={() => setModalOpen(true)}>
          <div style={C.icon}>{lesson.has_audio ? '🎵' : '▶️'}</div>
          <div style={C.info}>
            <div style={C.title}>{lesson.title ?? lesson.name}</div>
            {lesson.teacher_name && <div style={C.sub}>{lesson.teacher_name}</div>}
          </div>
          <div style={C.controls} onClick={(e) => e.stopPropagation()}>
            <button style={C.playBtn} onClick={togglePlayPause}>
              {isPlaying ? '⏸' : '▶'}
            </button>
            <button style={C.stopBtn} onClick={stop}>✕</button>
          </div>
        </div>
      </div>

      {modalOpen && <PlayerModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
