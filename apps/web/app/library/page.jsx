'use client';
import { useRouter } from 'next/navigation';
import { useWebAuthStore } from '../../src/lib/webAuthStore.js';
import { useWebPlayerStore } from '../../src/lib/webPlayerStore.js';
import { useLibrary, useHistory, useSaveLessonMutation } from '@torah-app/api-client';

const C = {
  page: { maxWidth: 860, margin: '0 auto', padding: '24px 16px' },
  userHeader: {
    backgroundColor: '#0a1f14', border: '1px solid #1a3a2a',
    borderRadius: 14, padding: '16px 20px', marginBottom: 24,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  userName: { color: '#e8f5e9', fontSize: 16, fontWeight: 700 },
  userEmail: { color: '#4a7c59', fontSize: 13, marginTop: 2 },
  logoutBtn: {
    padding: '7px 16px', borderRadius: 10, border: '1px solid #2d5c40',
    backgroundColor: '#1a3a2a', color: '#ef9a9a', fontSize: 13, cursor: 'pointer',
  },
  sectionTitle: {
    color: '#81c784', fontSize: 12, fontWeight: 700, letterSpacing: 0.4,
    padding: '14px 16px 6px', backgroundColor: '#0d2618',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', borderBottom: '1px solid #1a3a2a',
    cursor: 'pointer', backgroundColor: '#0a1f14',
  },
  rowIcon: {
    width: 38, height: 38, borderRadius: 8, backgroundColor: '#1a3a2a',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 18, flexShrink: 0, position: 'relative',
  },
  completedDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4caf50',
  },
  rowInfo: { flex: 1, textAlign: 'right', minWidth: 0 },
  rowTitle: { color: '#e8f5e9', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  rowMeta: { color: '#81c784', fontSize: 11, marginTop: 2 },
  progressTrack: { height: 2, backgroundColor: '#1a3a2a', borderRadius: 1, marginTop: 5 },
  progressFill: { height: 2, backgroundColor: '#4caf50', borderRadius: 1 },
  actions: { display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 },
  infoBtn: { background: 'none', border: 'none', color: '#4a7c59', fontSize: 16, cursor: 'pointer', padding: 4 },
  unsaveBtn: { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: 4 },
  center: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '64px 32px', gap: 12, textAlign: 'center',
  },
  bigIcon: { fontSize: 56 },
  bigTitle: { color: '#e8f5e9', fontSize: 20, fontWeight: 700 },
  body: { color: '#4a7c59', fontSize: 14, lineHeight: 1.6 },
  loginBtn: {
    padding: '12px 32px', borderRadius: 14, backgroundColor: '#4caf50',
    color: '#0a1f14', fontWeight: 800, fontSize: 15, border: 'none', cursor: 'pointer', marginTop: 8,
  },
  loading: { color: '#81c784', padding: 40, textAlign: 'center' },
};

export default function LibraryPage() {
  const router = useRouter();
  const user = useWebAuthStore((s) => s.user);
  const logout = useWebAuthStore((s) => s.logout);

  if (!user) {
    return (
      <div style={C.page}>
        <div style={C.center}>
          <span style={C.bigIcon}>📚</span>
          <div style={C.bigTitle}>ספריה אישית</div>
          <div style={C.body}>כנס לחשבון כדי לשמור שיעורים ולעקוב אחרי ההיסטוריה שלך.</div>
          <button style={C.loginBtn} onClick={() => router.push('/auth')}>כניסה / הרשמה</button>
        </div>
      </div>
    );
  }

  return <LibraryContent user={user} onLogout={logout} router={router} />;
}

function LibraryContent({ user, onLogout, router }) {
  const playLesson = useWebPlayerStore((s) => s.playLesson);
  const { data: saved = [], isLoading: loadingSaved } = useLibrary(true);
  const { data: history = [], isLoading: loadingHistory } = useHistory(true);
  const { mutate: toggleSave } = useSaveLessonMutation();

  if (loadingSaved && loadingHistory) return <div style={C.loading}>טוען...</div>;

  return (
    <div style={C.page}>
      <div style={C.userHeader}>
        <div>
          <div style={C.userName}>{user.name || user.email}</div>
          <div style={C.userEmail}>{user.email}</div>
        </div>
        <button style={C.logoutBtn} onClick={onLogout}>יציאה</button>
      </div>

      {/* Saved */}
      <div style={C.sectionTitle}>שמורים ({saved.length})</div>
      {saved.length === 0 && (
        <div style={{ color: '#4a7c59', padding: '16px', textAlign: 'right', borderBottom: '1px solid #1a3a2a' }}>
          אין שיעורים שמורים עדיין
        </div>
      )}
      {saved.map((item) => (
        <LibraryRow
          key={item.id}
          lesson={item}
          showSaveBtn
          onPress={() => item.has_audio && item.link ? playLesson(item) : router.push(`/lesson/${item.id}`)}
          onUnsave={() => toggleSave({ lessonId: item.id, save: false })}
          onNavigate={() => router.push(`/lesson/${item.id}`)}
        />
      ))}

      {/* History */}
      {history.length > 0 && (
        <>
          <div style={{ ...C.sectionTitle, marginTop: 8 }}>היסטוריה ({history.length})</div>
          {history.map((item) => (
            <LibraryRow
              key={item.id}
              lesson={item}
              showSaveBtn={false}
              onPress={() => item.has_audio && item.link ? playLesson(item) : router.push(`/lesson/${item.id}`)}
              onUnsave={() => {}}
              onNavigate={() => router.push(`/lesson/${item.id}`)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function LibraryRow({ lesson, showSaveBtn, onPress, onUnsave, onNavigate }) {
  const resumePct = lesson.duration_ms > 0
    ? Math.min((lesson.position_ms / lesson.duration_ms) * 100, 100)
    : 0;
  const isCompleted = lesson.completed === 1;

  return (
    <div
      style={C.row}
      onClick={onPress}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0f2a1a'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#0a1f14'; }}
    >
      <div style={C.rowIcon}>
        {lesson.has_audio ? '🎵' : '▶️'}
        {isCompleted && <div style={C.completedDot} />}
      </div>
      <div style={C.rowInfo}>
        <div style={C.rowTitle}>{lesson.title ?? lesson.name}</div>
        <div style={C.rowMeta}>
          {[lesson.teacher_name, lesson.institution_name].filter(Boolean).join(' • ')}
        </div>
        {resumePct > 0 && !isCompleted && (
          <div style={C.progressTrack}>
            <div style={{ ...C.progressFill, width: `${resumePct}%` }} />
          </div>
        )}
      </div>
      <div style={C.actions}>
        <button style={C.infoBtn} onClick={(e) => { e.stopPropagation(); onNavigate(); }}>ℹ</button>
        {showSaveBtn && (
          <button style={C.unsaveBtn} onClick={(e) => { e.stopPropagation(); onUnsave(); }}>🔖</button>
        )}
      </div>
    </div>
  );
}
