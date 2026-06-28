import { useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useSeries, useSeriesLessons, api } from '@torah-app/api-client';
import { usePlayerStore, useAuthStore } from '@torah-app/store';
import { LessonRow } from '@torah-app/ui';

export default function SeriesDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

  const { data: series, isLoading: loadingSeries } = useSeries(id);
  const { data: lessons = [], isLoading: loadingLessons } = useSeriesLessons(id);

  const playLesson = usePlayerStore((s) => s.playLesson);
  const currentLesson = usePlayerStore((s) => s.currentLesson);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const addToQueue = usePlayerStore((s) => s.addToQueue);
  const isLoggedIn = !!useAuthStore((s) => s.token);

  useEffect(() => {
    if (series?.name) navigation.setOptions({ title: series.name });
  }, [series?.name]);

  if (loadingSeries) {
    return <View style={styles.center}><ActivityIndicator color="#4caf50" size="large" /></View>;
  }

  if (!series) {
    return <View style={styles.center}><Text style={styles.errorText}>סדרה לא נמצאה</Text></View>;
  }

  const teacherNames = series.teachers?.map((t) => t.name).join(', ') ?? '';
  const playableLessons = lessons.filter((l) => l.link);
  const isSeriesPlaying =
    currentLesson && lessons.some((l) => l.id === currentLesson.id);

  function handlePlayAll() {
    if (playableLessons.length === 0) return;
    if (isSeriesPlaying) {
      togglePlayPause();
    } else {
      playLesson(playableLessons[0], playableLessons);
    }
  }

  function handleLessonPress(lesson) {
    if (lesson.link) {
      playLesson(lesson, playableLessons);
    } else {
      router.push(`/lesson/${lesson.id}`);
    }
  }

  return (
    <View style={styles.container}>
      {/* Series header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>📚</Text>
          </View>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.seriesName}>{series.name}</Text>
          {series.teachers?.map((t) => (
            <TouchableOpacity key={t.id} onPress={() => router.push(`/teacher/${t.id}`)}>
              <Text style={[styles.meta, styles.teacherLink]}>{t.name}</Text>
            </TouchableOpacity>
          ))}
          {series.institution_name ? <Text style={styles.meta}>{series.institution_name}</Text> : null}
          <Text style={styles.lessonCount}>{series.lesson_count} שיעורים</Text>
        </View>
      </View>

      {/* Play All button */}
      {playableLessons.length > 0 && (
        <TouchableOpacity style={styles.playAllBtn} onPress={handlePlayAll}>
          <Text style={styles.playAllText}>
            {isSeriesPlaying && isPlaying ? '⏸  השהה סדרה' : '▶  הפעל הכל'}
          </Text>
          <Text style={styles.playAllCount}>{playableLessons.length} שיעורים עם שמע</Text>
        </TouchableOpacity>
      )}
      {playableLessons.length > 0 && (
        <TouchableOpacity
          style={styles.queueBtn}
          onPress={() => {
            addToQueue(playableLessons);
            if (isLoggedIn) api.saveLessonsBatch(playableLessons.map((l) => l.id)).catch(() => {});
          }}
        >
          <Text style={styles.queueBtnText}>+ הוסף סדרה לתור</Text>
        </TouchableOpacity>
      )}

      {/* Lesson list */}
      {loadingLessons ? (
        <View style={styles.center}><ActivityIndicator color="#4caf50" /></View>
      ) : (
        <FlatList
          data={lessons}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <View>
              <LessonRow
                lesson={item}
                index={index}
                onPress={handleLessonPress}
              />
              {/* Now-playing indicator */}
              {currentLesson?.id === item.id && (
                <View style={styles.nowPlayingBar} />
              )}
            </View>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>אין שיעורים בסדרה זו</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d2618' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#ef9a9a', fontSize: 16 },
  header: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#0a1f14',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
    gap: 14,
  },
  headerLeft: {},
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: '#1a3a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconText: { fontSize: 26 },
  headerInfo: { flex: 1 },
  seriesName: {
    color: '#e8f5e9',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 4,
  },
  meta: { color: '#81c784', fontSize: 13, textAlign: 'right', marginBottom: 2 },
  teacherLink: { textDecorationLine: 'underline' },
  lessonCount: {
    color: '#4caf50',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginTop: 4,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#4caf50',
  },
  playAllText: { color: '#0a1f14', fontSize: 15, fontWeight: '800' },
  playAllCount: { color: '#0a1f1480', fontSize: 12 },
  queueBtn: {
    marginHorizontal: 12,
    marginTop: -4,
    marginBottom: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d5c40',
    alignItems: 'center',
  },
  queueBtnText: { color: '#81c784', fontSize: 14 },
  list: { paddingBottom: 32 },
  nowPlayingBar: {
    height: 2,
    backgroundColor: '#4caf50',
    marginHorizontal: 16,
  },
  emptyText: {
    color: '#4a7c59',
    fontSize: 15,
    textAlign: 'center',
    padding: 32,
  },
});
