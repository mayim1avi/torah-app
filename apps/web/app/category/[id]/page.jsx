'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCategory, useCategoryContent, useDebounce } from '@torah-app/api-client';
import { useWebPlayerStore } from '../../../src/lib/webPlayerStore.js';

const C = {
  page: { maxWidth: 960, margin: '0 auto', padding: '24px 16px' },
  breadcrumb: { display: 'flex', gap: 6, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' },
  crumb: { color: '#4caf50', fontSize: 14, cursor: 'pointer', textDecoration: 'underline' },
  sep: { color: '#4a7c59' },
  currentCrumb: { color: '#e8f5e9', fontSize: 14, fontWeight: 700 },
  sectionTitle: { color: '#81c784', fontSize: 12, fontWeight: 700, marginBottom: 12, letterSpacing: 0.4, marginTop: 8 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, marginBottom: 20 },
  card: {
    backgroundColor: '#0a1f14', border: '1px solid #1a3a2a',
    borderRadius: 10, padding: '10px', cursor: 'pointer', textAlign: 'center',
  },
  cardName: { color: '#e8f5e9', fontSize: 13, fontWeight: 600 },
  cardSub: { color: '#4a7c59', fontSize: 11, marginTop: 2 },
  divider: { borderTop: '1px solid #1a3a2a', marginBottom: 20 },
  controls: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  searchInput: {
    flex: 1, minWidth: 200,
    backgroundColor: '#1a3a2a', border: '1px solid #2d5c40',
    borderRadius: 10, padding: '9px 14px', color: '#e8f5e9',
    fontSize: 14, direction: 'rtl', outline: 'none',
  },
  typeBtn: (active) => ({
    padding: '8px 16px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
    backgroundColor: active ? '#4caf50' : '#1a3a2a',
    color: active ? '#0a1f14' : '#81c784',
    border: `1px solid ${active ? '#4caf50' : '#2d5c40'}`,
    fontWeight: active ? 700 : 400,
  }),
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderBottom: '1px solid #1a3a2a',
    cursor: 'pointer', backgroundColor: '#0a1f14',
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: '#1a3a2a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0,
  },
  rowInfo: { flex: 1, textAlign: 'right', minWidth: 0 },
  rowTitle: { color: '#e8f5e9', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowMeta: { color: '#81c784', fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badge: { color: '#4a7c59', fontSize: 11, backgroundColor: '#1a3a2a', padding: '2px 8px', borderRadius: 10, flexShrink: 0 },
  loading: { color: '#81c784', padding: 24, textAlign: 'center' },
  empty: { color: '#4a7c59', padding: 32, textAlign: 'center' },
};

export default function CategoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const debouncedQ = useDebounce(q, 300);
  const playLesson = useWebPlayerStore((s) => s.playLesson);

  const { data: category } = useCategory(id);
  const { data: content, isLoading } = useCategoryContent(id, {
    type, limit: 50, offset: 0,
    ...(debouncedQ ? { q: debouncedQ } : {}),
  });

  const ancestors = category?.ancestors ?? [];
  const subcategories = category?.children ?? [];
  const series = content?.series ?? [];
  const lessons = content?.lessons ?? [];

  return (
    <div style={C.page}>
      {/* Breadcrumb */}
      <div style={C.breadcrumb}>
        <span style={C.crumb} onClick={() => router.push('/')}>בית</span>
        {ancestors.map((a) => (
          <span key={a.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={C.sep}>›</span>
            <span style={C.crumb} onClick={() => router.push(`/category/${a.id}`)}>{a.name}</span>
          </span>
        ))}
        {category && (
          <>
            <span style={C.sep}>›</span>
            <span style={C.currentCrumb}>{category.name}</span>
          </>
        )}
      </div>

      {/* Subcategories (real children + virtual) */}
      {subcategories.length > 0 && (
        <>
          <div style={C.sectionTitle}>
            {category?.subcategory_type_id === 1 ? 'פרקים' : category?.subcategory_type_id === 2 ? 'דפים' : 'תת-קטגוריות'}
          </div>
          <div style={C.grid}>
            {subcategories.map((sub) => (
              <div
                key={sub.id}
                style={C.card}
                onClick={() => router.push(`/category/${sub.id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4caf50'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1a3a2a'; }}
              >
                <div style={C.cardName}>{sub.name}</div>
                {!sub.virtual && sub.child_count > 0 && <div style={C.cardSub}>{sub.child_count} תת-קטגוריות</div>}
                {!sub.virtual && sub.lesson_count > 0 && <div style={C.cardSub}>{sub.lesson_count} שיעורים</div>}
              </div>
            ))}
          </div>
          {(series.length > 0 || lessons.length > 0 || isLoading) && (
            <div style={C.divider} />
          )}
        </>
      )}

      {/* Search + type filters */}
      <div style={C.controls}>
        <input
          style={C.searchInput}
          placeholder="חיפוש בקטגוריה..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {['all', 'series', 'lessons'].map((t) => (
          <button key={t} style={C.typeBtn(type === t)} onClick={() => setType(t)}>
            {t === 'all' ? 'הכל' : t === 'series' ? 'סדרות' : 'שיעורים'}
          </button>
        ))}
      </div>

      {isLoading && <div style={C.loading}>טוען...</div>}

      {/* Series */}
      {series.length > 0 && (
        <>
          <div style={C.sectionTitle}>סדרות</div>
          {series.map((s) => (
            <div
              key={s.id}
              style={C.row}
              onClick={() => router.push(`/series/${s.id}`)}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0f2a1a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0a1f14'; }}
            >
              <div style={C.rowIcon}>📚</div>
              <div style={C.rowInfo}>
                <div style={C.rowTitle}>{s.name}</div>
                {s.teacher_name && <div style={C.rowMeta}>{s.teacher_name}</div>}
              </div>
              <span style={C.badge}>{s.lesson_count} שיעורים</span>
            </div>
          ))}
        </>
      )}

      {/* Lessons */}
      {lessons.length > 0 && (
        <>
          <div style={{ ...C.sectionTitle, marginTop: series.length > 0 ? 20 : 8 }}>שיעורים</div>
          {lessons.map((l, idx) => (
            <div
              key={l.id}
              style={C.row}
              onClick={() => l.link ? playLesson(l, lessons.filter(x => x.link)) : router.push(`/lesson/${l.id}`)}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0f2a1a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0a1f14'; }}
            >
              <div style={{ ...C.rowIcon, fontSize: 13, color: '#4a7c59', fontWeight: 700 }}>{idx + 1}</div>
              <div style={C.rowInfo}>
                <div style={C.rowTitle}>{l.title ?? l.name}</div>
                <div style={C.rowMeta}>
                  {[l.teacher_name, l.institution_name].filter(Boolean).join(' • ')}
                </div>
              </div>
              {l.has_audio && <span style={{ fontSize: 16 }}>🎵</span>}
              <span
                style={{ ...C.badge, cursor: 'pointer', color: '#4caf50' }}
                onClick={(e) => { e.stopPropagation(); router.push(`/lesson/${l.id}`); }}
              >ℹ</span>
            </div>
          ))}
        </>
      )}

      {!isLoading && series.length === 0 && lessons.length === 0 && (
        <div style={C.empty}>
          {subcategories.length > 0 ? 'אין תוכן ישיר בקטגוריה זו' : 'לא נמצאו תוצאות'}
        </div>
      )}
    </div>
  );
}
