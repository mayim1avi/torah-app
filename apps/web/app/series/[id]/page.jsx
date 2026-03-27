'use client';
import { useParams, useRouter } from 'next/navigation';
import { useSeries, useSeriesLessons } from '@torah-app/api-client';
import { useWebPlayerStore } from '../../../src/lib/webPlayerStore.js';

const C = {
  page: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
  header: {
    backgroundColor: '#0a1f14', border: '1px solid #1a3a2a',
    borderRadius: 16, padding: 24, marginBottom: 24, textAlign: 'center',
  },
  artwork: {
    width: 100, height: 100, borderRadius: 16,
    backgroundColor: '#1a3a2a', border: '1px solid #2d5c40',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 48, margin: '0 auto 14px',
  },
  title: { color: '#e8f5e9', fontSize: 20, fontWeight: 800, marginBottom: 6 },
  teacher: { color: '#81c784', fontSize: 14, marginBottom: 4 },
  institution: { color: '#4a7c59', fontSize: 13, marginBottom: 14 },
  playAllBtn: {
    padding: '10px 32px', borderRadius: 24, backgroundColor: '#4caf50',
    color: '#0a1f14', fontWeight: 800, fontSize: 15, border: 'none',
    cursor: 'pointer',
  },
  sectionTitle: { color: '#81c784', fontSize: 12, fontWeight: 700, marginBottom: 12, letterSpacing: 0.4 },
  row: (isActive) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderBottom: '1px solid #1a3a2a',
    cursor: 'pointer',
    backgroundColor: isActive ? '#0f2a1a' : '#0a1f14',
    borderRight: isActive ? '3px solid #4caf50' : '3px solid transparent',
  }),
  badge: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#1a3a2a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#4a7c59', fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  rowInfo: { flex: 1, textAlign: 'right', minWidth: 0 },
  rowTitle: { color: '#e8f5e9', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowMeta: { color: '#81c784', fontSize: 12, marginTop: 2 },
  loading: { color: '#81c784', padding: 32, textAlign: 'center' },
  infoBtn: {
    background: 'none', border: 'none', color: '#4a7c59',
    fontSize: 16, cursor: 'pointer', padding: 4,
    flexShrink: 0,
  },
};

export default function SeriesPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: series, isLoading: seriesLoading } = useSeries(id);
  const { data: lessons = [], isLoading: lessonsLoading } = useSeriesLessons(id);
  const currentLesson = useWebPlayerStore((s) => s.currentLesson);
  const playLesson = useWebPlayerStore((s) => s.playLesson);

  if (seriesLoading) return <div style={C.loading}>טוען...</div>;
  if (!series) return <div style={C.loading}>סדרה לא נמצאה</div>;

  const playableLessons = lessons.filter((l) => l.link);

  function handlePlayAll() {
    if (playableLessons.length === 0) return;
    playLesson(playableLessons[0], playableLessons);
  }

  return (
    <div style={C.page}>
      <div style={C.header}>
        <div style={C.artwork}>📚</div>
        <div style={C.title}>{series.name}</div>
        {series.teachers?.map((t) => (
          <div
            key={t.id}
            style={{ ...C.teacher, cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => router.push(`/teacher/${t.id}`)}
          >
            {t.name}
          </div>
        )) ?? (series.teacher_name && <div style={C.teacher}>{series.teacher_name}</div>)}
        {series.institution_name && <div style={C.institution}>{series.institution_name}</div>}
        {playableLessons.length > 0 && (
          <button style={C.playAllBtn} onClick={handlePlayAll}>
            ▶ השמע הכל ({playableLessons.length})
          </button>
        )}
      </div>

      <div style={C.sectionTitle}>שיעורים ({lessons.length})</div>
      {lessonsLoading ? (
        <div style={C.loading}>טוען שיעורים...</div>
      ) : (
        <div>
          {lessons.map((lesson, idx) => {
            const isActive = currentLesson?.id === lesson.id;
            return (
              <div
                key={lesson.id}
                style={C.row(isActive)}
                onClick={() => lesson.link ? playLesson(lesson, playableLessons) : router.push(`/lesson/${lesson.id}`)}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#0f2a1a'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#0a1f14'; }}
              >
                <div style={C.badge}>{idx + 1}</div>
                <div style={C.rowInfo}>
                  <div style={C.rowTitle}>{lesson.title ?? lesson.name}</div>
                  {(lesson.teacher_name || lesson.date) && (
                    <div style={C.rowMeta}>
                      {[lesson.teacher_name, lesson.date ? new Date(lesson.date).toLocaleDateString('he-IL') : null]
                        .filter(Boolean).join(' • ')}
                    </div>
                  )}
                </div>
                {lesson.has_audio && <span style={{ fontSize: 16 }}>🎵</span>}
                <button
                  style={C.infoBtn}
                  onClick={(e) => { e.stopPropagation(); router.push(`/lesson/${lesson.id}`); }}
                >ℹ</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
