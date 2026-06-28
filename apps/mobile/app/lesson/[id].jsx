import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useLesson, useIsLessonSaved, useSaveLessonMutation, api } from '@torah-app/api-client';
import { usePlayerStore, useAuthStore } from '@torah-app/store';

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [showTranscript, setShowTranscript] = useState(false);

  const { data: lesson, isLoading } = useLesson(id);

  const playLesson = usePlayerStore((s) => s.playLesson);
  const currentLesson = usePlayerStore((s) => s.currentLesson);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const addToQueue = usePlayerStore((s) => s.addToQueue);

  const isThisLesson = currentLesson?.id === Number(id);
  const isLoggedIn = !!useAuthStore((s) => s.token);
  const { data: savedData } = useIsLessonSaved(id, isLoggedIn);
  const isSaved = savedData?.saved ?? false;
  const { mutate: toggleSave } = useSaveLessonMutation();

  useEffect(() => {
    if (lesson?.title) navigation.setOptions({ title: lesson.title });
  }, [lesson?.title]);

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color="#4caf50" size="large" /></View>;
  }

  if (!lesson) {
    return <View style={styles.center}><Text style={styles.errorText}>שיעור לא נמצא</Text></View>;
  }

  const formattedDate = lesson.date
    ? new Date(lesson.date).toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const canPlay = !!lesson.link;

  function handlePlay() {
    if (!canPlay) return;
    if (isThisLesson) {
      togglePlayPause();
    } else {
      playLesson(lesson);
    }
  }

  const playLabel = !canPlay
    ? 'אין קישור'
    : isThisLesson && isPlaying
      ? '⏸  השהה'
      : isThisLesson
        ? '▶  המשך'
        : '▶  השמע';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Player card */}
      <View style={styles.playerCard}>
        <View style={styles.artwork}>
          <Text style={styles.artworkIcon}>{lesson.has_audio ? '🎵' : '▶️'}</Text>
          {isThisLesson && isPlaying && (
            <View style={styles.nowPlayingBadge}>
              <Text style={styles.nowPlayingText}>מנגן ▶</Text>
            </View>
          )}
        </View>

        <Text style={styles.lessonTitle}>{lesson.title ?? lesson.name}</Text>
        {lesson.teacher_name && (
          <TouchableOpacity onPress={() => lesson.teacher_id && router.push(`/teacher/${lesson.teacher_id}`)}>
            <Text style={[styles.teacherName, lesson.teacher_id && styles.teacherLink]}>{lesson.teacher_name}</Text>
          </TouchableOpacity>
        )}
        {lesson.institution_name && (
          <TouchableOpacity onPress={() => lesson.institution_id && router.push(`/institution/${lesson.institution_id}`)}>
            <Text style={[styles.institutionName, lesson.institution_id && styles.teacherLink]}>{lesson.institution_name}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.playButton, !canPlay && styles.playButtonDisabled]}
          onPress={handlePlay}
          disabled={!canPlay}
        >
          <Text style={styles.playButtonText}>{playLabel}</Text>
        </TouchableOpacity>

        {isLoggedIn && (
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={() => toggleSave({ lessonId: Number(id), save: !isSaved })}
          >
            <Text style={styles.saveBtnText}>{isSaved ? '🔖 שמור' : '🔖 שמור לספריה'}</Text>
          </TouchableOpacity>
        )}
        {canPlay && (
          <TouchableOpacity
            style={styles.queueBtn}
            onPress={() => {
              addToQueue([lesson]);
              if (isLoggedIn && !isSaved) toggleSave({ lessonId: Number(id), save: true });
            }}
          >
            <Text style={styles.queueBtnText}>+ הוסף לתור</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Metadata */}
      <View style={styles.section}>
        {formattedDate && <MetaRow label="תאריך" value={formattedDate} />}
        {lesson.series_name && (
          <MetaRow
            label="סדרה"
            value={lesson.series_name}
            onPress={() => router.push(`/series/${lesson.series_id}`)}
          />
        )}
        {lesson.institution_full_name && (
          <MetaRow label="מוסד" value={lesson.institution_full_name} />
        )}
        {lesson.categories?.length > 0 && (
          <MetaRow label="קטגוריות" value={lesson.categories.map((c) => c.name).join(' • ')} />
        )}
      </View>

      {lesson.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>תיאור</Text>
          <Text style={styles.description}>{lesson.description}</Text>
        </View>
      ) : null}

      {lesson.transcript ? (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.transcriptToggle}
            onPress={() => setShowTranscript((v) => !v)}
          >
            <Text style={styles.transcriptToggleText}>
              {showTranscript ? '▲ הסתר תמליל' : '▼ הצג תמליל'}
            </Text>
          </TouchableOpacity>
          {showTranscript && (
            <Text style={styles.transcript}>{lesson.transcript}</Text>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

function MetaRow({ label, value, onPress }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      {onPress ? (
        <TouchableOpacity onPress={onPress}>
          <Text style={[styles.metaValue, styles.metaLink]}>{value}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.metaValue}>{value}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d2618' },
  content: { paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#ef9a9a', fontSize: 16 },

  playerCard: {
    backgroundColor: '#0a1f14',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
    gap: 8,
  },
  artwork: {
    width: 110,
    height: 110,
    borderRadius: 18,
    backgroundColor: '#1a3a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2d5c40',
  },
  artworkIcon: { fontSize: 52 },
  nowPlayingBadge: {
    position: 'absolute',
    bottom: 6,
    backgroundColor: '#4caf5088',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  nowPlayingText: { color: '#e8f5e9', fontSize: 10, fontWeight: '700' },
  lessonTitle: {
    color: '#e8f5e9',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
  },
  teacherName: { color: '#81c784', fontSize: 14, textAlign: 'center' },
  teacherLink: { textDecorationLine: 'underline' },
  institutionName: { color: '#4a7c59', fontSize: 13, textAlign: 'center' },
  playButton: {
    marginTop: 14,
    paddingHorizontal: 44,
    paddingVertical: 13,
    borderRadius: 30,
    backgroundColor: '#4caf50',
  },
  playButtonDisabled: { backgroundColor: '#2d5c40' },
  playButtonText: { color: '#0a1f14', fontSize: 16, fontWeight: '800' },
  saveBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2d5c40',
  },
  saveBtnText: { color: '#81c784', fontSize: 13 },
  queueBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2d5c40',
  },
  queueBtnText: { color: '#4a7c59', fontSize: 13 },

  section: {
    marginTop: 16,
    backgroundColor: '#0a1f14',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1a3a2a',
  },
  sectionTitle: {
    color: '#81c784',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
  },
  metaLabel: { color: '#4a7c59', fontSize: 13, flex: 1 },
  metaValue: { color: '#e8f5e9', fontSize: 13, flex: 2, textAlign: 'right' },
  metaLink: { color: '#4caf50', textDecorationLine: 'underline' },
  description: {
    color: '#b2dfdb',
    fontSize: 14,
    lineHeight: 22,
    padding: 16,
    textAlign: 'right',
  },
  transcriptToggle: { padding: 14, alignItems: 'center' },
  transcriptToggleText: { color: '#4caf50', fontWeight: '700', fontSize: 14 },
  transcript: {
    color: '#b2dfdb',
    fontSize: 13,
    lineHeight: 22,
    padding: 16,
    textAlign: 'right',
    borderTopWidth: 1,
    borderTopColor: '#1a3a2a',
  },
});
