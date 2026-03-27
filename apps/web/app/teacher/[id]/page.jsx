'use client';
import { useParams, useRouter } from 'next/navigation';
import { useTeacher, useTeacherLessons } from '@torah-app/api-client';
import { useWebPlayerStore } from '../../../src/lib/webPlayerStore.js';

const C = {
  page: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
  header: {
    backgroundColor: '#0a1f14', border: '1px solid #1a3a2a',
    borderRadius: 16, padding: '28px 24px', marginBottom: 24,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    textAlign: 'center',
  },
  avatar: {
    width: 96, height: 96, borderRadius: '50%',
    backgroundColor: '#1a3a2a', border: '1px solid #2d5c40',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 48, marginBottom: 4,
  },
  name: { color: '#e8f5e9', fontSize: 22, fontWeight: 800 },
  enName: { color: '#4a7c59', fontSize: 14 },
  stats: { display: 'flex', gap: 12, marginTop: 4 },
  badge: {
    backgroundColor: '#1a3a2a', borderRadius: 12,
    padding: '8px 16px', textAlign: 'center',
  },
  badgeValue: { color: '#4caf50', fontSize: 20, fontWeight: 800, display: 'block' },
  badgeLabel: { color: '#4a7c59', fontSize: 11, display: 'block', marginTop: 2 },
  description: { color: '#b2dfdb', fontSize: 13, lineHeight: 1.7, maxWidth: 560 },
  playAllBtn: {
    padding: '10px 36px', borderRadius: 24, backgroundColor: '#4caf50',
    color: '#0a1f14', fontWeight: 800, fontSize: 15, border: 'none',
    cursor: 'pointer', marginTop: 4,
  },
  sectionTitle: { color: '#81c784', fontSize: 12, fontWeight: 700, marginBottom: 12, letterSpacing: 0.4, alignSelf: 'flex-start' },
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderBottom: '1px solid #1a3a2a',
    cursor: 'pointer', backgroundColor: '#0a1f14',
  },
  indexBadge: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: '#1a3a2a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#4a7c59', fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  indexBadgeActive: { backgroundColor: '#4caf5033', color: '#4caf50' },
  rowInfo: { flex: 1, textAlign: 'right', minWidth: 0 },
  rowTitle: { color: '#e8f5e9', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowMeta: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 3, flexWrap: 'wrap' },
  seriesLink: { color: '#4caf50', fontSize: 11, textDecoration: 'underline', cursor: 'pointer' },
  rowDate: { color: '#4a7c59', fontSize: 11 },
  audioIcon: { fontSize: 16 },
  infoBtn: { background: 'none', border: 'none', color: '#4a7c59', fontSize: 16, cursor: 'pointer', padding: 4, flexShrink: 0 },
  loading: { color: '#81c784', padding: 48, textAlign: 'center' },
  empty: { color: '#4a7c59', padding: 32, textAlign: 'center' },
};

export default function TeacherPage() {
  const { id } = useParams();
  const router = useRouter();
  const { data: teacher, isLoading: teacherLoading } = useTeacher(id);
  const { data: lessons = [], isLoading: lessonsLoading } = useTeacherLessons(id);
  const currentLesson = useWebPlayerStore((s) => s.currentLesson);
  const playLesson = useWebPlayerStore((s) => s.playLesson);

  if (teacherLoading) return <div style={C.loading}>טוען...</div>;
  if (!teacher) return <div style={C.loading}>מרצה לא נמצא</div>;

  const playableLessons = lessons.filter((l) => l.link);
  const honorific = teacher.honorific ? `${teacher.honorific} ` : '';

  return (
    <div style={C.page}>
      <div style={C.header}>
        <div style={C.avatar}>👤</div>
        <div style={C.name}>{honorific}{teacher.name}</div>
        {teacher.en_name && <div style={C.enName}>{teacher.en_name}</div>}

        <div style={C.stats}>
          <div style={C.badge}>
            <span style={C.badgeValue}>{teacher.lesson_count}</span>
            <span style={C.badgeLabel}>שיעורים</span>
          </div>
          {teacher.series_count > 0 && (
            <div style={C.badge}>
              <span style={C.badgeValue}>{teacher.series_count}</span>
              <span style={C.badgeLabel}>סדרות</span>
            </div>
          )}
        </div>

        {teacher.description && (
          <div style={C.description}>{teacher.description}</div>
        )}

        {playableLessons.length > 0 && (
          <button style={C.playAllBtn} onClick={() => playLesson(playableLessons[0], playableLessons)}>
            ▶ השמע הכל ({playableLessons.length})
          </button>
        )}
      </div>

      <div style={C.sectionTitle}>שיעורים ({lessons.length})</div>

      {lessonsLoading && <div style={C.loading}>טוען שיעורים...</div>}

      {lessons.map((lesson, idx) => {
        const isActive = currentLesson?.id === lesson.id;
        const date = lesson.date
          ? new Date(lesson.date).toLocaleDateString('he-IL', { year: 'numeric', month: 'short', day: 'numeric' })
          : null;

        return (
          <div
            key={lesson.id}
            style={{
              ...C.row,
              borderRight: isActive ? '3px solid #4caf50' : '3px solid transparent',
              backgroundColor: isActive ? '#0f2a1a' : '#0a1f14',
            }}
            onClick={() => lesson.link ? playLesson(lesson, playableLessons) : router.push(`/lesson/${lesson.id}`)}
            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#0f2a1a'; }}
            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = '#0a1f14'; }}
          >
            <div style={{ ...C.indexBadge, ...(isActive ? C.indexBadgeActive : {}) }}>
              {isActive ? '▶' : idx + 1}
            </div>
            <div style={C.rowInfo}>
              <div style={C.rowTitle}>{lesson.title ?? lesson.name}</div>
              <div style={C.rowMeta}>
                {lesson.series_name && (
                  <span
                    style={C.seriesLink}
                    onClick={(e) => { e.stopPropagation(); router.push(`/series/${lesson.series_id}`); }}
                  >
                    {lesson.series_name}
                  </span>
                )}
                {date && <span style={C.rowDate}>{date}</span>}
              </div>
            </div>
            {lesson.has_audio && <span style={C.audioIcon}>🎵</span>}
            <button
              style={C.infoBtn}
              onClick={(e) => { e.stopPropagation(); router.push(`/lesson/${lesson.id}`); }}
            >ℹ</button>
          </div>
        );
      })}

      {!lessonsLoading && lessons.length === 0 && (
        <div style={C.empty}>אין שיעורים</div>
      )}
    </div>
  );
}
