'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useInstitution, useInstitutionSeries, useInstitutionLessons } from '@torah-app/api-client';
import { useWebPlayerStore } from '../../../src/lib/webPlayerStore.js';

const TABS = [
  { key: 'series', label: 'סדרות' },
  { key: 'lessons', label: 'שיעורים' },
];

const C = {
  page: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
  header: {
    backgroundColor: '#0a1f14', border: '1px solid #1a3a2a',
    borderRadius: 16, padding: '28px 24px', marginBottom: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center',
  },
  avatar: {
    width: 90, height: 90, borderRadius: 18,
    backgroundColor: '#1a3a2a', border: '1px solid #2d5c40',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 44, marginBottom: 4,
  },
  name: { color: '#e8f5e9', fontSize: 20, fontWeight: 800 },
  shortName: { color: '#81c784', fontSize: 13 },
  website: { color: '#4caf50', fontSize: 13, textDecoration: 'underline' },
  stats: { display: 'flex', gap: 12, marginTop: 4 },
  badge: { backgroundColor: '#1a3a2a', borderRadius: 12, padding: '8px 16px', textAlign: 'center' },
  badgeValue: { color: '#4caf50', fontSize: 20, fontWeight: 800, display: 'block' },
  badgeLabel: { color: '#4a7c59', fontSize: 11, display: 'block', marginTop: 2 },
  playAllBtn: {
    padding: '10px 36px', borderRadius: 24, backgroundColor: '#4caf50',
    color: '#0a1f14', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', marginTop: 4,
  },
  tabs: {
    display: 'flex', borderBottom: '1px solid #1a3a2a',
    backgroundColor: '#0a1f14', marginBottom: 0,
  },
  tab: (active) => ({
    flex: 1, padding: '12px 0', textAlign: 'center', cursor: 'pointer',
    color: active ? '#4caf50' : '#4a7c59',
    fontWeight: active ? 700 : 400, fontSize: 14,
    borderBottom: active ? '2px solid #4caf50' : '2px solid transparent',
    background: 'none', border: 'none',
    borderBottom: active ? '2px solid #4caf50' : '2px solid transparent',
  }),
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderBottom: '1px solid #1a3a2a',
    cursor: 'pointer', backgroundColor: '#0a1f14',
  },
  rowIcon: {
    width: 38, height: 38, borderRadius: 8, backgroundColor: '#1a3a2a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0,
  },
  rowIconActive: { backgroundColor: '#4caf5033' },
  rowInfo: { flex: 1, textAlign: 'right', minWidth: 0 },
  rowTitle: { color: '#e8f5e9', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowMeta: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 3, flexWrap: 'wrap' },
  metaText: { color: '#81c784', fontSize: 11 },
  metaLink: { color: '#4caf50', fontSize: 11, textDecoration: 'underline', cursor: 'pointer' },
  metaDate: { color: '#4a7c59', fontSize: 11 },
  countWrap: { textAlign: 'center', flexShrink: 0 },
  countNum: { color: '#4caf50', fontSize: 16, fontWeight: 800, display: 'block' },
  countLabel: { color: '#4a7c59', fontSize: 10, display: 'block' },
  infoBtn: { background: 'none', border: 'none', color: '#4a7c59', fontSize: 16, cursor: 'pointer', padding: 4, flexShrink: 0 },
  loading: { color: '#81c784', padding: 32, textAlign: 'center' },
  empty: { color: '#4a7c59', padding: 32, textAlign: 'center' },
};

export default function InstitutionPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tab, setTab] = useState('series');

  const { data: inst, isLoading: instLoading } = useInstitution(id);
  const { data: series = [], isLoading: seriesLoading } = useInstitutionSeries(id);
  const { data: lessons = [], isLoading: lessonsLoading } = useInstitutionLessons(id);

  const currentLesson = useWebPlayerStore((s) => s.currentLesson);
  const playLesson = useWebPlayerStore((s) => s.playLesson);

  if (instLoading) return <div style={C.loading}>טוען...</div>;
  if (!inst) return <div style={C.loading}>מוסד לא נמצא</div>;

  const playableLessons = lessons.filter((l) => l.link);
  const isLoading = tab === 'series' ? seriesLoading : lessonsLoading;
  const items = tab === 'series' ? series : lessons;

  return (
    <div style={C.page}>
      {/* Header */}
      <div style={C.header}>
        <div style={C.avatar}>🏛</div>
        <div style={C.name}>{inst.full_name || inst.name}</div>
        {inst.full_name && inst.name !== inst.full_name && (
          <div style={C.shortName}>{inst.name}</div>
        )}
        <div style={C.stats}>
          <div style={C.badge}>
            <span style={C.badgeValue}>{inst.lesson_count}</span>
            <span style={C.badgeLabel}>שיעורים</span>
          </div>
          {inst.series_count > 0 && (
            <div style={C.badge}>
              <span style={C.badgeValue}>{inst.series_count}</span>
              <span style={C.badgeLabel}>סדרות</span>
            </div>
          )}
        </div>
        {inst.website && (
          <a href={inst.website} target="_blank" rel="noreferrer" style={C.website}>{inst.website}</a>
        )}
        {playableLessons.length > 0 && (
          <button style={C.playAllBtn} onClick={() => playLesson(playableLessons[0], playableLessons)}>
            ▶ השמע הכל ({playableLessons.length})
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={C.tabs}>
        {TABS.map((t) => (
          <button key={t.key} style={C.tab(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.label} {t.key === 'series' ? `(${series.length})` : `(${lessons.length})`}
          </button>
        ))}
      </div>

      {isLoading && <div style={C.loading}>טוען...</div>}

      {/* Series list */}
      {tab === 'series' && !seriesLoading && series.map((item) => (
        <div
          key={item.id}
          style={C.row}
          onClick={() => router.push(`/series/${item.id}`)}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0f2a1a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0a1f14'; }}
        >
          <div style={C.rowIcon}>📚</div>
          <div style={C.rowInfo}>
            <div style={C.rowTitle}>{item.name}</div>
            {item.teacher_name && (
              <div style={C.rowMeta}>
                <span
                  style={C.metaLink}
                  onClick={(e) => { e.stopPropagation(); router.push(`/teacher/${item.teacher_id}`); }}
                >
                  {item.teacher_name}
                </span>
              </div>
            )}
          </div>
          <div style={C.countWrap}>
            <span style={C.countNum}>{item.lesson_count}</span>
            <span style={C.countLabel}>שיעורים</span>
          </div>
        </div>
      ))}

      {/* Lessons list */}
      {tab === 'lessons' && !lessonsLoading && lessons.map((lesson) => {
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
            <div style={{ ...C.rowIcon, ...(isActive ? C.rowIconActive : {}) }}>
              {isActive ? '▶' : lesson.has_audio ? '🎵' : '▶️'}
            </div>
            <div style={C.rowInfo}>
              <div style={C.rowTitle}>{lesson.title ?? lesson.name}</div>
              <div style={C.rowMeta}>
                {lesson.teacher_name && (
                  <span
                    style={C.metaLink}
                    onClick={(e) => { e.stopPropagation(); router.push(`/teacher/${lesson.teacher_id}`); }}
                  >
                    {lesson.teacher_name}
                  </span>
                )}
                {lesson.series_name && (
                  <span
                    style={C.metaLink}
                    onClick={(e) => { e.stopPropagation(); router.push(`/series/${lesson.series_id}`); }}
                  >
                    {lesson.series_name}
                  </span>
                )}
                {date && <span style={C.metaDate}>{date}</span>}
              </div>
            </div>
            <button
              style={C.infoBtn}
              onClick={(e) => { e.stopPropagation(); router.push(`/lesson/${lesson.id}`); }}
            >ℹ</button>
          </div>
        );
      })}

      {!isLoading && items.length === 0 && (
        <div style={C.empty}>אין {tab === 'series' ? 'סדרות' : 'שיעורים'}</div>
      )}
    </div>
  );
}
