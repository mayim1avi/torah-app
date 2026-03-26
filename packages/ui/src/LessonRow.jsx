import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

/**
 * Reusable lesson list row with optional episode number.
 * Props:
 *   lesson: { id, title, name, teacher_name, date, has_audio, order }
 *   index: number (fallback for order)
 *   onPress: (lesson) => void
 *   showIndex: boolean (default true)
 */
export function LessonRow({ lesson, index, onPress, showIndex = true }) {
  const formattedDate = lesson.date
    ? new Date(lesson.date).toLocaleDateString('he-IL', { month: 'short', year: 'numeric' })
    : null;

  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(lesson)} activeOpacity={0.7}>
      {showIndex && (
        <View style={styles.indexBadge}>
          <Text style={styles.indexText}>{lesson.order ?? index + 1}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{lesson.title ?? lesson.name}</Text>
        <View style={styles.meta}>
          {lesson.teacher_name ? <Text style={styles.metaText}>{lesson.teacher_name}</Text> : null}
          {formattedDate ? <Text style={styles.metaDate}>{formattedDate}</Text> : null}
        </View>
      </View>
      <View style={styles.right}>
        {lesson.has_audio ? <Text style={styles.audioIcon}>🎵</Text> : null}
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
    gap: 12,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a3a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: { color: '#81c784', fontSize: 11, fontWeight: '700' },
  info: { flex: 1 },
  title: {
    color: '#e8f5e9',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 3,
  },
  meta: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  metaText: { color: '#81c784', fontSize: 12 },
  metaDate: { color: '#4a7c59', fontSize: 11 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  audioIcon: { fontSize: 13 },
  chevron: { color: '#4a7c59', fontSize: 20 },
});
