'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLesson, useIsLessonSaved, useSaveLessonMutation } from '@torah-app/api-client';
import { useWebPlayerStore } from '../../../src/lib/webPlayerStore.js';
import { useWebAuthStore } from '../../../src/lib/webAuthStore.js';

const C = {
  page: { maxWidth: 720, margin: '0 auto', padding: '32px 16px' },
  card: {
    backgroundColor: '#0a1f14', border: '1px solid #1a3a2a',
    borderRadius: 16, padding: 28, textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    marginBottom: 24,
  },
  artwork: {
    width: 120, height: 120, borderRadius: 20,
    backgroundColor: '#1a3a2a', border: '1px solid #2d5c40',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 56, marginBottom: 8, position: 'relative',
  },
  nowPlaying: {
    position: 'absolute', bottom: 6,
    backgroundColor: '#4caf5088', borderRadius: 8,
    padding: '2px 8px', color: '#e8f5e9', fontSize: 10, fontWeight: 700,
  },
  title: { color: '#e8f5e9', fontSize: 19, fontWeight: 800, lineHeight: 1.4 },
  teacher: { color: '#81c784', fontSize: 14 },
  institution: { color: '#4a7c59', fontSize: 13 },
  playBtn: (disabled) => ({
    marginTop: 14, padding: '12px 44px', borderRadius: 28,
    backgroundColor: disabled ? '#2d5c40' : '#4caf50',
    color: disabled ? '#4a7c59' : '#0a1f14',
    fontSize: 16, fontWeight: 800, border: 'none',
    cursor: disabled ? 'default' : 'pointer',
  }),
  saveBtn: {
    marginTop: 6, padding: '8px 20px', borderRadius: 20,
    border: '1px solid #2d5c40', backgroundColor: 'transparent',
    color: '#81c784', fontSize: 13, cursor: 'pointer',
  },
  section: {
    backgroundColor: '#0a1f14', borderTop: '1px solid #1a3a2a',
    borderBottom: '1px solid #1a3a2a', marginBottom: 12,
  },
  sectionTitle: {
    color: '#81c784', fontSize: 12, fontWeight: 700,
    padding: '12px 16px 4px', textAlign: 'right', letterSpacing: 0.4,
  },
  metaRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: '10px 16px', borderBottom: '1px solid #1a3a2a',
  },
  metaLabel: { color: '#4a7c59', fontSize: 13, flex: 1 },
  metaValue: { color: '#e8f5e9', fontSize: 13, flex: 2, textAlign: 'right' },
  metaLink: { color: '#4caf50', textDecoration: 'underline', cursor: 'pointer' },
  description: { color: '#b2dfdb', fontSize: 14, lineHeight: 1.7, padding: 16, textAlign: 'right' },
  transcriptToggle: {
    padding: 14, textAlign: 'center', cursor: 'pointer',
    color: '#4caf50', fontWeight: 700, fontSize: 14,
    background: 'none', border: 'none', width: '100%',
  },
  transcript: {
    color: '#b2dfdb', fontSize: 13, lineHeight: 1.8,
    padding: '12px 16px 16px', textAlign: 'right',
    borderTop: '1px solid #1a3a2a',
  },
  loading: { color: '#81c784', padding: 48, textAlign: 'center' },
};

export default function LessonPage() {
  const { id } = useParams();
  const router = useRouter();
  const [showTranscript, setShowTranscript] = useState(false);

  const { data: lesson, isLoading } = useLesson(id);
  const currentLesson = useWebPlayerStore((s) => s.currentLesson);
  const isPlaying = useWebPlayerStore((s) => s.isPlaying);
  const playLesson = useWebPlayerStore((s) => s.playLesson);
  const togglePlayPause = useWebPlayerStore((s) => s.togglePlayPause);

  const isLoggedIn = !!useWebAuthStore((s) => s.token);
  const { data: savedData } = useIsLessonSaved(id, isLoggedIn);
  const isSaved = savedData?.saved ?? false;
  const { mutate: toggleSave } = useSaveLessonMutation();

  if (isLoading) return <div style={C.loading}>טוען...</div>;
  if (!lesson) return <div style={C.loading}>שיעור לא נמצא</div>;

  const isThisLesson = currentLesson?.id === Number(id);
  const canPlay = !!lesson.link;

  function handlePlay() {
    if (!canPlay) return;
    if (isThisLesson) togglePlayPause();
    else playLesson(lesson);
  }

  const playLabel = !canPlay ? 'אין קישור'
    : isThisLesson && isPlaying ? '⏸  השהה'
    : isThisLesson ? '▶  המשך'
    : '▶  השמע';

  const formattedDate = lesson.date
    ? new Date(lesson.date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div style={C.page}>
      <div style={C.card}>
        <div style={C.artwork}>
          {lesson.has_audio ? '🎵' : '▶️'}
          {isThisLesson && isPlaying && <div style={C.nowPlaying}>מנגן ▶</div>}
        </div>
        <div style={C.title}>{lesson.title ?? lesson.name}</div>
        {lesson.teacher_name && (
          <div
            style={{ ...C.teacher, ...(lesson.teacher_id ? { cursor: 'pointer', textDecoration: 'underline' } : {}) }}
            onClick={() => lesson.teacher_id && router.push(`/teacher/${lesson.teacher_id}`)}
          >
            {lesson.teacher_name}
          </div>
        )}
        {lesson.institution_name && <div style={C.institution}>{lesson.institution_name}</div>}

        <button style={C.playBtn(!canPlay)} onClick={handlePlay} disabled={!canPlay}>
          {playLabel}
        </button>

        {isLoggedIn && (
          <button style={C.saveBtn} onClick={() => toggleSave({ lessonId: Number(id), save: !isSaved })}>
            {isSaved ? '🔖 שמור' : '🔖 שמור לספריה'}
          </button>
        )}
      </div>

      {/* Metadata */}
      <div style={C.section}>
        {formattedDate && <MetaRow label="תאריך" value={formattedDate} />}
        {lesson.series_name && (
          <MetaRow
            label="סדרה"
            value={lesson.series_name}
            onPress={() => router.push(`/series/${lesson.series_id}`)}
          />
        )}
        {lesson.institution_full_name && <MetaRow label="מוסד" value={lesson.institution_full_name} />}
        {lesson.categories?.length > 0 && (
          <MetaRow label="קטגוריות" value={lesson.categories.map((c) => c.name).join(' • ')} />
        )}
      </div>

      {lesson.description && (
        <div style={C.section}>
          <div style={C.sectionTitle}>תיאור</div>
          <div style={C.description}>{lesson.description}</div>
        </div>
      )}

      {lesson.transcript && (
        <div style={C.section}>
          <button style={C.transcriptToggle} onClick={() => setShowTranscript((v) => !v)}>
            {showTranscript ? '▲ הסתר תמליל' : '▼ הצג תמליל'}
          </button>
          {showTranscript && <div style={C.transcript}>{lesson.transcript}</div>}
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value, onPress }) {
  return (
    <div style={C.metaRow}>
      <span style={C.metaLabel}>{label}</span>
      {onPress ? (
        <span style={{ ...C.metaValue, ...C.metaLink }} onClick={onPress}>{value}</span>
      ) : (
        <span style={C.metaValue}>{value}</span>
      )}
    </div>
  );
}
