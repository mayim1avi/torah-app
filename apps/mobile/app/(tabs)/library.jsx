import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, SectionList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore, usePlayerStore as playerStore } from '@torah-app/store';
import { useLibrary, useHistory, useSaveLessonMutation } from '@torah-app/api-client';

export default function LibraryScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) {
    return <NotLoggedIn onLogin={() => router.push('/auth')} />;
  }

  return <LibraryContent router={router} user={user} onLogout={logout} />;
}

function LibraryContent({ router, user, onLogout }) {
  const playLesson = playerStore((s) => s.playLesson);
  const { data: saved = [], isLoading: loadingSaved } = useLibrary(true);
  const { data: history = [], isLoading: loadingHistory } = useHistory(true);
  const { mutate: toggleSave } = useSaveLessonMutation();

  const sections = [
    { title: `שמורים (${saved.length})`, data: saved, type: 'saved' },
    { title: `היסטוריה (${history.length})`, data: history, type: 'history' },
  ].filter((s) => s.data.length > 0 || s.type === 'saved');

  if (loadingSaved && loadingHistory) {
    return <View style={styles.center}><ActivityIndicator color="#4caf50" size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      {/* User header */}
      <View style={styles.userHeader}>
        <View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>יציאה</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item, section }) => (
          <LibraryRow
            lesson={item}
            showSaveBtn={section.type === 'saved'}
            onPress={() => {
              if (item.has_audio && item.link) {
                playLesson(item);
              } else {
                router.push(`/lesson/${item.id}`);
              }
            }}
            onUnsave={() => toggleSave({ lessonId: item.id, save: false })}
            onNavigate={() => router.push(`/lesson/${item.id}`)}
          />
        )}
        ListEmptyComponent={<EmptyLibrary onBrowse={() => router.replace('/')} />}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

function LibraryRow({ lesson, showSaveBtn, onPress, onUnsave, onNavigate }) {
  const resumePercent = lesson.duration_ms > 0
    ? Math.min((lesson.position_ms / lesson.duration_ms) * 100, 100)
    : 0;
  const isCompleted = lesson.completed === 1;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{lesson.has_audio ? '🎵' : '▶️'}</Text>
        {isCompleted && <View style={styles.completedDot} />}
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {lesson.title ?? lesson.name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {[lesson.teacher_name, lesson.institution_name].filter(Boolean).join(' • ')}
        </Text>
        {/* Resume progress bar */}
        {resumePercent > 0 && !isCompleted && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${resumePercent}%` }]} />
          </View>
        )}
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity onPress={onNavigate} hitSlop={8}>
          <Text style={styles.infoIcon}>ℹ</Text>
        </TouchableOpacity>
        {showSaveBtn && (
          <TouchableOpacity onPress={onUnsave} hitSlop={8}>
            <Text style={styles.unsaveIcon}>🔖</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function NotLoggedIn({ onLogin }) {
  return (
    <View style={styles.center}>
      <Text style={styles.notLoggedIcon}>📚</Text>
      <Text style={styles.notLoggedTitle}>ספריה אישית</Text>
      <Text style={styles.notLoggedBody}>
        כנס לחשבון כדי לשמור שיעורים{'\n'}ולעקוב אחרי ההיסטוריה שלך.
      </Text>
      <TouchableOpacity style={styles.loginBtn} onPress={onLogin}>
        <Text style={styles.loginBtnText}>כניסה / הרשמה</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyLibrary({ onBrowse }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyIcon}>🔖</Text>
      <Text style={styles.emptyTitle}>הספריה ריקה</Text>
      <Text style={styles.emptyBody}>שמור שיעורים מאהובים כדי למצוא אותם כאן.</Text>
      <TouchableOpacity style={styles.browseBtn} onPress={onBrowse}>
        <Text style={styles.browseBtnText}>עיין בשיעורים</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d2618' },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, gap: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0a1f14',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
  },
  userName: { color: '#e8f5e9', fontSize: 15, fontWeight: '700' },
  userEmail: { color: '#4a7c59', fontSize: 12, marginTop: 2 },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1a3a2a',
    borderWidth: 1,
    borderColor: '#2d5c40',
  },
  logoutText: { color: '#ef9a9a', fontSize: 13 },
  sectionHeader: {
    color: '#81c784',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    textAlign: 'right',
    letterSpacing: 0.4,
    backgroundColor: '#0d2618',
  },
  list: { paddingBottom: 100 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
    gap: 10,
  },
  rowIcon: {
    width: 38, height: 38,
    borderRadius: 8,
    backgroundColor: '#1a3a2a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  rowIconText: { fontSize: 18 },
  completedDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#4caf50',
  },
  rowInfo: { flex: 1 },
  rowTitle: { color: '#e8f5e9', fontSize: 13, fontWeight: '600', textAlign: 'right' },
  rowMeta: { color: '#81c784', fontSize: 11, textAlign: 'right', marginTop: 2 },
  progressTrack: {
    height: 2, backgroundColor: '#1a3a2a',
    borderRadius: 1, marginTop: 5,
  },
  progressFill: { height: 2, backgroundColor: '#4caf50', borderRadius: 1 },
  rowActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  infoIcon: { color: '#4a7c59', fontSize: 16 },
  unsaveIcon: { fontSize: 18 },

  notLoggedIcon: { fontSize: 56 },
  notLoggedTitle: { color: '#e8f5e9', fontSize: 20, fontWeight: '700' },
  notLoggedBody: { color: '#4a7c59', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  loginBtn: {
    paddingHorizontal: 32, paddingVertical: 12,
    borderRadius: 14, backgroundColor: '#4caf50', marginTop: 8,
  },
  loginBtnText: { color: '#0a1f14', fontSize: 15, fontWeight: '800' },

  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: '#e8f5e9', fontSize: 18, fontWeight: '700' },
  emptyBody: { color: '#4a7c59', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  browseBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 12, backgroundColor: '#1a3a2a',
    borderWidth: 1, borderColor: '#2d5c40', marginTop: 4,
  },
  browseBtnText: { color: '#81c784', fontSize: 14 },
});
