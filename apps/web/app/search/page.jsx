'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch, useTeachers, useInstitutions, useDebounce } from '@torah-app/api-client';
import { useWebPlayerStore } from '../../src/lib/webPlayerStore.js';

const C = {
  page: { maxWidth: 900, margin: '0 auto', padding: '24px 16px' },
  heading: { color: '#e8f5e9', fontSize: 24, fontWeight: 800, marginBottom: 20 },
  searchBar: {
    backgroundColor: '#1a3a2a', border: '1px solid #2d5c40',
    borderRadius: 12, padding: '12px 16px', color: '#e8f5e9',
    fontSize: 16, direction: 'rtl', outline: 'none', width: '100%',
    marginBottom: 12,
  },
  filterRow: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'flex-start' },
  filterWrap: { position: 'relative', flex: '1 1 200px' },
  filterInput: {
    backgroundColor: '#1a3a2a', border: '1px solid #2d5c40',
    borderRadius: 10, padding: '9px 12px', color: '#e8f5e9',
    fontSize: 13, direction: 'rtl', outline: 'none', width: '100%',
  },
  dropdown: {
    position: 'absolute', top: '100%', right: 0, left: 0, zIndex: 50,
    backgroundColor: '#0a1f14', border: '1px solid #2d5c40', borderRadius: 10,
    maxHeight: 200, overflowY: 'auto', marginTop: 2,
  },
  dropdownItem: {
    padding: '8px 12px', cursor: 'pointer', color: '#e8f5e9', fontSize: 13,
    textAlign: 'right', borderBottom: '1px solid #1a3a2a',
  },
  pills: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 },
  pill: {
    display: 'flex', alignItems: 'center', gap: 4,
    backgroundColor: '#1a3a2a', border: '1px solid #2d5c40',
    borderRadius: 16, padding: '4px 10px', fontSize: 12, color: '#81c784',
  },
  pillX: { cursor: 'pointer', color: '#4a7c59', fontWeight: 700, marginRight: 2 },
  typeRow: { display: 'flex', gap: 8, marginBottom: 20 },
  typeBtn: (active) => ({
    padding: '7px 16px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
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
  rowMeta: { color: '#81c784', fontSize: 12, marginTop: 2 },
  tag: { color: '#4a7c59', fontSize: 11, backgroundColor: '#1a3a2a', padding: '2px 8px', borderRadius: 10, flexShrink: 0 },
  empty: { color: '#4a7c59', padding: 40, textAlign: 'center' },
  hint: { color: '#4a7c59', padding: 40, textAlign: 'center', fontSize: 14 },
};

export default function SearchPage() {
  const router = useRouter();
  const playLesson = useWebPlayerStore((s) => s.playLesson);

  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [instSearch, setInstSearch] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [selectedInstIds, setSelectedInstIds] = useState([]);
  const [teacherNames, setTeacherNames] = useState({});
  const [showTeachers, setShowTeachers] = useState(false);
  const [showInsts, setShowInsts] = useState(false);
  const teacherRef = useRef(null);
  const instRef = useRef(null);

  const debouncedQ = useDebounce(q, 300);
  const debouncedTeacher = useDebounce(teacherSearch, 250);

  const { data: teacherResults = [] } = useTeachers(
    showTeachers && debouncedTeacher ? { search: debouncedTeacher, limit: 50 } : { limit: 0 }
  );
  const { data: institutions = [] } = useInstitutions({ limit: 200 });
  const filteredInsts = instSearch
    ? institutions.filter((i) => i.name?.includes(instSearch))
    : institutions;

  const { data: results = [], isFetching } = useSearch({
    q: debouncedQ,
    type,
    teacherIds: selectedTeacherIds,
    institutionIds: selectedInstIds,
    limit: 40,
  });

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e) {
      if (teacherRef.current && !teacherRef.current.contains(e.target)) setShowTeachers(false);
      if (instRef.current && !instRef.current.contains(e.target)) setShowInsts(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function addTeacher(t) {
    setSelectedTeacherIds((ids) => ids.includes(t.id) ? ids : [...ids, t.id]);
    setTeacherNames((n) => ({ ...n, [t.id]: t.name }));
    setTeacherSearch('');
    setShowTeachers(false);
  }

  function addInst(i) {
    setSelectedInstIds((ids) => ids.includes(i.id) ? ids : [...ids, i.id]);
    setInstSearch('');
    setShowInsts(false);
  }

  return (
    <div style={C.page}>
      <h1 style={C.heading}>חיפוש</h1>

      <input
        style={C.searchBar}
        placeholder="חיפוש חופשי..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus
      />

      <div style={C.filterRow}>
        {/* Teacher filter */}
        <div style={C.filterWrap} ref={teacherRef}>
          <input
            style={C.filterInput}
            placeholder="סנן לפי מרצה..."
            value={teacherSearch}
            onChange={(e) => { setTeacherSearch(e.target.value); setShowTeachers(true); }}
            onFocus={() => setShowTeachers(true)}
          />
          {showTeachers && teacherResults.length > 0 && (
            <div style={C.dropdown}>
              {teacherResults.map((t) => (
                <div
                  key={t.id}
                  style={C.dropdownItem}
                  onMouseDown={() => addTeacher(t)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a3a2a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {t.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Institution filter */}
        <div style={C.filterWrap} ref={instRef}>
          <input
            style={C.filterInput}
            placeholder="סנן לפי מוסד..."
            value={instSearch}
            onChange={(e) => { setInstSearch(e.target.value); setShowInsts(true); }}
            onFocus={() => setShowInsts(true)}
          />
          {showInsts && filteredInsts.length > 0 && (
            <div style={C.dropdown}>
              {filteredInsts.slice(0, 50).map((i) => (
                <div
                  key={i.id}
                  style={C.dropdownItem}
                  onMouseDown={() => addInst(i)}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1a3a2a'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {i.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active filter pills */}
      {(selectedTeacherIds.length > 0 || selectedInstIds.length > 0) && (
        <div style={C.pills}>
          {selectedTeacherIds.map((id) => (
            <span key={id} style={C.pill}>
              <span style={C.pillX} onClick={() => setSelectedTeacherIds((ids) => ids.filter((x) => x !== id))}>✕</span>
              {teacherNames[id] ?? `מרצה ${id}`}
            </span>
          ))}
          {selectedInstIds.map((id) => (
            <span key={id} style={C.pill}>
              <span style={C.pillX} onClick={() => setSelectedInstIds((ids) => ids.filter((x) => x !== id))}>✕</span>
              {institutions.find((i) => i.id === id)?.name ?? `מוסד ${id}`}
            </span>
          ))}
        </div>
      )}

      {/* Type tabs */}
      <div style={C.typeRow}>
        {['all', 'series', 'lessons'].map((t) => (
          <button key={t} style={C.typeBtn(type === t)} onClick={() => setType(t)}>
            {t === 'all' ? 'הכל' : t === 'series' ? 'סדרות' : 'שיעורים'}
          </button>
        ))}
      </div>

      {!debouncedQ && selectedTeacherIds.length === 0 && selectedInstIds.length === 0 && (
        <div style={C.hint}>הזן מילות חיפוש או בחר פילטר</div>
      )}

      {results.map((item) => (
        <div
          key={`${item.type}-${item.id}`}
          style={C.row}
          onClick={() => {
            if (item.type === 'series') router.push(`/series/${item.id}`);
            else if (item.link) playLesson(item);
            else router.push(`/lesson/${item.id}`);
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0f2a1a'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0a1f14'; }}
        >
          <div style={C.rowIcon}>
            {item.type === 'series' ? '📚' : item.has_audio ? '🎵' : '▶️'}
          </div>
          <div style={C.rowInfo}>
            <div style={C.rowTitle}>{item.title ?? item.name}</div>
            {item.teacher_name && <div style={C.rowMeta}>{item.teacher_name}</div>}
          </div>
          <span style={C.tag}>{item.type === 'series' ? 'סדרה' : 'שיעור'}</span>
        </div>
      ))}

      {debouncedQ && !isFetching && results.length === 0 && (
        <div style={C.empty}>לא נמצאו תוצאות עבור "{debouncedQ}"</div>
      )}
    </div>
  );
}
