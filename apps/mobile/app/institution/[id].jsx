import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, SectionList,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useInstitution, useInstitutionSeries, useInstitutionLessons } from '@torah-app/api-client';
import { usePlayerStore } from '@torah-app/store';

const TABS = [
  { key: 'series', label: 'סדרות' },
  { key: 'lessons', label: 'שיעורים' },
];

export default function InstitutionScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [tab, setTab] = useState('series');

  const { data: inst, isLoading: instLoading } = useInstitution(id);
  const { data: series = [], isLoading: seriesLoading } = useInstitutionSeries(id);
  const { data: lessons = [], isLoading: lessonsLoading } = useInstitutionLessons(id);

  const currentLesson = usePlayerStore((s) => s.currentLesson);
  const playLesson = usePlayerStore((s) => s.playLesson);

  useEffect(() => {
    if (inst?.name) navigation.setOptions({ title: inst.name });
  }, [inst?.name]);

  if (instLoading) {
    return <View style={s.center}><ActivityIndicator color="#4caf50" size="large" /></View>;
  }
  if (!inst) {
    return <View style={s.center}><Text style={s.errorText}>מוסד לא נמצא</Text></View>;
  }

  const playableLessons = lessons.filter((l) => l.link);
  const isLoading = tab === 'series' ? seriesLoading : lessonsLoading;
  const items = tab === 'series' ? series : lessons;

  return (
    <SectionList
      style={s.container}
      sections={[{ data: items }]}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={
        <Header
          inst={inst}
          tab={tab}
          onTabChange={setTab}
          canPlayAll={playableLessons.length > 0}
          onPlayAll={() => playLesson(playableLessons[0], playableLessons)}
          isLoading={isLoading}
        />
      }
      renderItem={({ item }) =>
        tab === 'series' ? (
          <SeriesRow
            series={item}
            onPress={() => router.push(`/series/${item.id}`)}
            onTeacherPress={item.teacher_id ? () => router.push(`/teacher/${item.teacher_id}`) : null}
          />
        ) : (
          <LessonRow
            lesson={item}
            isActive={currentLesson?.id === item.id}
            onPress={() => item.link ? playLesson(item, playableLessons) : router.push(`/lesson/${item.id}`)}
            onNavigate={() => router.push(`/lesson/${item.id}`)}
            onTeacherPress={item.teacher_id ? () => router.push(`/teacher/${item.teacher_id}`) : null}
            onSeriesPress={item.series_id ? () => router.push(`/series/${item.series_id}`) : null}
          />
        )
      }
      ListEmptyComponent={
        !isLoading && (
          <View style={s.empty}>
            <Text style={s.emptyText}>אין {tab === 'series' ? 'סדרות' : 'שיעורים'}</Text>
          </View>
        )
      }
      contentContainerStyle={s.list}
    />
  );
}

function Header({ inst, tab, onTabChange, canPlayAll, onPlayAll, isLoading }) {
  return (
    <View>
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>🏛</Text>
        </View>
        <Text style={s.name}>{inst.full_name || inst.name}</Text>
        {inst.full_name && inst.name !== inst.full_name && (
          <Text style={s.shortName}>{inst.name}</Text>
        )}

        <View style={s.stats}>
          <StatBadge value={inst.lesson_count} label="שיעורים" />
          {inst.series_count > 0 && <StatBadge value={inst.series_count} label="סדרות" />}
        </View>

        {inst.website ? (
          <Text style={s.website}>{inst.website}</Text>
        ) : null}

        {canPlayAll && (
          <TouchableOpacity style={s.playAllBtn} onPress={onPlayAll}>
            <Text style={s.playAllText}>▶ השמע הכל</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => onTabChange(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading && (
        <View style={s.center}><ActivityIndicator color="#4caf50" size="small" /></View>
      )}
    </View>
  );
}

function StatBadge({ value, label }) {
  return (
    <View style={s.badge}>
      <Text style={s.badgeValue}>{value}</Text>
      <Text style={s.badgeLabel}>{label}</Text>
    </View>
  );
}

function SeriesRow({ series, onPress, onTeacherPress }) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <View style={s.rowIcon}>
        <Text style={s.rowIconText}>📚</Text>
      </View>
      <View style={s.rowInfo}>
        <Text style={s.rowTitle} numberOfLines={2}>{series.name}</Text>
        {series.teacher_name && (
          <TouchableOpacity onPress={onTeacherPress} disabled={!onTeacherPress}>
            <Text style={[s.rowMeta, onTeacherPress && s.link]}>{series.teacher_name}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={s.rowCount}>
        <Text style={s.rowCountText}>{series.lesson_count}</Text>
        <Text style={s.rowCountLabel}>שיעורים</Text>
      </View>
    </TouchableOpacity>
  );
}

function LessonRow({ lesson, isActive, onPress, onNavigate, onTeacherPress, onSeriesPress }) {
  const date = lesson.date
    ? new Date(lesson.date).toLocaleDateString('he-IL', { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  return (
    <TouchableOpacity style={[s.row, isActive && s.rowActive]} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.rowIcon, isActive && s.rowIconActive]}>
        <Text style={s.rowIconText}>{isActive ? '▶' : lesson.has_audio ? '🎵' : '▶️'}</Text>
      </View>
      <View style={s.rowInfo}>
        <Text style={s.rowTitle} numberOfLines={2}>{lesson.title ?? lesson.name}</Text>
        <View style={s.rowMeta2}>
          {lesson.teacher_name && (
            <TouchableOpacity onPress={onTeacherPress} disabled={!onTeacherPress}>
              <Text style={[s.rowMeta, onTeacherPress && s.link]}>{lesson.teacher_name}</Text>
            </TouchableOpacity>
          )}
          {lesson.series_name && (
            <TouchableOpacity onPress={onSeriesPress} disabled={!onSeriesPress}>
              <Text style={[s.rowMeta, onSeriesPress && s.link]} numberOfLines={1}>{lesson.series_name}</Text>
            </TouchableOpacity>
          )}
          {date && <Text style={s.rowDate}>{date}</Text>}
        </View>
      </View>
      <TouchableOpacity onPress={onNavigate} hitSlop={8}>
        <Text style={s.infoIcon}>ℹ</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d2618' },
  list: { paddingBottom: 80 },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#ef9a9a', fontSize: 16 },
  empty: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { color: '#4a7c59', fontSize: 15 },

  header: {
    backgroundColor: '#0a1f14',
    borderBottomWidth: 1, borderBottomColor: '#1a3a2a',
    padding: 24, alignItems: 'center', gap: 8,
  },
  avatar: {
    width: 90, height: 90, borderRadius: 18,
    backgroundColor: '#1a3a2a', borderWidth: 1, borderColor: '#2d5c40',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  avatarText: { fontSize: 44 },
  name: { color: '#e8f5e9', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  shortName: { color: '#81c784', fontSize: 13, textAlign: 'center' },
  website: { color: '#4caf50', fontSize: 12, textDecorationLine: 'underline' },
  stats: { flexDirection: 'row', gap: 12, marginTop: 4 },
  badge: {
    backgroundColor: '#1a3a2a', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 6, alignItems: 'center',
  },
  badgeValue: { color: '#4caf50', fontSize: 18, fontWeight: '800' },
  badgeLabel: { color: '#4a7c59', fontSize: 11, marginTop: 1 },
  playAllBtn: {
    marginTop: 8, paddingHorizontal: 36, paddingVertical: 11,
    borderRadius: 24, backgroundColor: '#4caf50',
  },
  playAllText: { color: '#0a1f14', fontSize: 15, fontWeight: '800' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#0a1f14',
    borderBottomWidth: 1, borderBottomColor: '#1a3a2a',
  },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#4caf50' },
  tabText: { color: '#4a7c59', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#4caf50' },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a3a2a',
    gap: 10, backgroundColor: '#0a1f14',
  },
  rowActive: { borderRightWidth: 3, borderRightColor: '#4caf50' },
  rowIcon: {
    width: 38, height: 38, borderRadius: 8, backgroundColor: '#1a3a2a',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  rowIconActive: { backgroundColor: '#4caf5033' },
  rowIconText: { fontSize: 18 },
  rowInfo: { flex: 1 },
  rowTitle: { color: '#e8f5e9', fontSize: 13, fontWeight: '600', textAlign: 'right' },
  rowMeta2: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6, marginTop: 3 },
  rowMeta: { color: '#81c784', fontSize: 11 },
  rowDate: { color: '#4a7c59', fontSize: 11 },
  link: { textDecorationLine: 'underline', color: '#4caf50' },
  rowCount: { alignItems: 'center', flexShrink: 0 },
  rowCountText: { color: '#4caf50', fontSize: 15, fontWeight: '800' },
  rowCountLabel: { color: '#4a7c59', fontSize: 10 },
  infoIcon: { color: '#4a7c59', fontSize: 16 },
});
