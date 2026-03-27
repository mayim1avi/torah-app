import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet, FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { useTeacher, useTeacherLessons } from '@torah-app/api-client';
import { usePlayerStore } from '@torah-app/store';

export default function TeacherScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

  const { data: teacher, isLoading: teacherLoading } = useTeacher(id);
  const { data: lessons = [], isLoading: lessonsLoading } = useTeacherLessons(id);

  const currentLesson = usePlayerStore((s) => s.currentLesson);
  const playLesson = usePlayerStore((s) => s.playLesson);

  useEffect(() => {
    if (teacher?.name) navigation.setOptions({ title: teacher.name });
  }, [teacher?.name]);

  if (teacherLoading) {
    return <View style={s.center}><ActivityIndicator color="#4caf50" size="large" /></View>;
  }
  if (!teacher) {
    return <View style={s.center}><Text style={s.errorText}>מרצה לא נמצא</Text></View>;
  }

  const playableLessons = lessons.filter((l) => l.link);

  function handlePlayAll() {
    if (playableLessons.length === 0) return;
    playLesson(playableLessons[0], playableLessons);
  }

  return (
    <FlatList
      style={s.container}
      ListHeaderComponent={
        <Header
          teacher={teacher}
          canPlayAll={playableLessons.length > 0}
          onPlayAll={handlePlayAll}
        />
      }
      data={lessons}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item, index }) => (
        <LessonRow
          lesson={item}
          index={index}
          isActive={currentLesson?.id === item.id}
          onPress={() => item.link
            ? playLesson(item, playableLessons)
            : router.push(`/lesson/${item.id}`)
          }
          onNavigate={() => router.push(`/lesson/${item.id}`)}
          onSeriesPress={item.series_id ? () => router.push(`/series/${item.series_id}`) : null}
        />
      )}
      ListEmptyComponent={
        !lessonsLoading && (
          <View style={s.center}>
            <Text style={s.emptyText}>אין שיעורים</Text>
          </View>
        )
      }
      contentContainerStyle={s.list}
    />
  );
}

function Header({ teacher, canPlayAll, onPlayAll }) {
  const honorific = teacher.honorific ? `${teacher.honorific} ` : '';
  return (
    <View style={s.header}>
      <View style={s.avatar}>
        <Text style={s.avatarText}>👤</Text>
      </View>
      <Text style={s.name}>{honorific}{teacher.name}</Text>
      {teacher.en_name ? <Text style={s.enName}>{teacher.en_name}</Text> : null}

      <View style={s.stats}>
        <StatBadge value={teacher.lesson_count} label="שיעורים" />
        {teacher.series_count > 0 && (
          <StatBadge value={teacher.series_count} label="סדרות" />
        )}
      </View>

      {teacher.description ? (
        <Text style={s.description}>{teacher.description}</Text>
      ) : null}

      {canPlayAll && (
        <TouchableOpacity style={s.playAllBtn} onPress={onPlayAll}>
          <Text style={s.playAllText}>▶ השמע הכל</Text>
        </TouchableOpacity>
      )}

      <Text style={s.sectionTitle}>שיעורים</Text>
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

function LessonRow({ lesson, index, isActive, onPress, onNavigate, onSeriesPress }) {
  const date = lesson.date
    ? new Date(lesson.date).toLocaleDateString('he-IL', { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  return (
    <TouchableOpacity
      style={[s.row, isActive && s.rowActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[s.indexBadge, isActive && s.indexBadgeActive]}>
        <Text style={[s.indexText, isActive && s.indexTextActive]}>
          {isActive ? '▶' : index + 1}
        </Text>
      </View>
      <View style={s.rowInfo}>
        <Text style={s.rowTitle} numberOfLines={2}>{lesson.title ?? lesson.name}</Text>
        <View style={s.rowMeta}>
          {lesson.series_name && (
            <TouchableOpacity onPress={onSeriesPress} disabled={!onSeriesPress}>
              <Text style={s.seriesLink} numberOfLines={1}>{lesson.series_name}</Text>
            </TouchableOpacity>
          )}
          {date && <Text style={s.rowDate}>{date}</Text>}
        </View>
      </View>
      {lesson.has_audio ? <Text style={s.audioIcon}>🎵</Text> : null}
      <TouchableOpacity onPress={onNavigate} hitSlop={8}>
        <Text style={s.infoIcon}>ℹ</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d2618' },
  list: { paddingBottom: 80 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, minHeight: 120 },
  errorText: { color: '#ef9a9a', fontSize: 16 },
  emptyText: { color: '#4a7c59', fontSize: 15 },

  header: {
    backgroundColor: '#0a1f14',
    borderBottomWidth: 1, borderBottomColor: '#1a3a2a',
    padding: 24, alignItems: 'center', gap: 8,
  },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#1a3a2a', border: '1px solid #2d5c40',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  avatarText: { fontSize: 48 },
  name: { color: '#e8f5e9', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  enName: { color: '#4a7c59', fontSize: 14, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 12, marginTop: 4 },
  badge: {
    backgroundColor: '#1a3a2a', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 6, alignItems: 'center',
  },
  badgeValue: { color: '#4caf50', fontSize: 18, fontWeight: '800' },
  badgeLabel: { color: '#4a7c59', fontSize: 11, marginTop: 1 },
  description: {
    color: '#b2dfdb', fontSize: 13, lineHeight: 20,
    textAlign: 'center', paddingHorizontal: 8, marginTop: 4,
  },
  playAllBtn: {
    marginTop: 8, paddingHorizontal: 36, paddingVertical: 11,
    borderRadius: 24, backgroundColor: '#4caf50',
  },
  playAllText: { color: '#0a1f14', fontSize: 15, fontWeight: '800' },
  sectionTitle: {
    color: '#81c784', fontSize: 12, fontWeight: '700',
    alignSelf: 'flex-start', marginTop: 8, letterSpacing: 0.4,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1a3a2a',
    gap: 10, backgroundColor: '#0a1f14',
  },
  rowActive: { borderRightWidth: 3, borderRightColor: '#4caf50' },
  indexBadge: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#1a3a2a',
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  indexBadgeActive: { backgroundColor: '#4caf5033' },
  indexText: { color: '#4a7c59', fontSize: 12, fontWeight: '700' },
  indexTextActive: { color: '#4caf50' },
  rowInfo: { flex: 1 },
  rowTitle: { color: '#e8f5e9', fontSize: 13, fontWeight: '600', textAlign: 'right' },
  rowMeta: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 3, flexWrap: 'wrap' },
  seriesLink: { color: '#4caf50', fontSize: 11, textDecorationLine: 'underline' },
  rowDate: { color: '#4a7c59', fontSize: 11 },
  audioIcon: { fontSize: 16 },
  infoIcon: { color: '#4a7c59', fontSize: 16 },
});
