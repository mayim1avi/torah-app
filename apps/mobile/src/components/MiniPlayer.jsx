import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Pressable,
} from 'react-native';
import { usePlayerStore } from '@torah-app/store';
import { PlayerModal } from './PlayerModal.jsx';

export function MiniPlayer() {
  const [modalVisible, setModalVisible] = useState(false);

  const currentLesson = usePlayerStore((s) => s.currentLesson);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const positionMs = usePlayerStore((s) => s.positionMs);
  const durationMs = usePlayerStore((s) => s.durationMs);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const stop = usePlayerStore((s) => s.stop);

  if (!currentLesson) return null;

  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const title = currentLesson.title ?? currentLesson.name ?? '';

  return (
    <>
      <Pressable style={styles.container} onPress={() => setModalVisible(true)}>
        {/* Thin progress bar at top */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
        </View>

        <View style={styles.row}>
          {/* Icon */}
          <View style={styles.iconWrap}>
            <Text style={styles.icon}>🎵</Text>
          </View>

          {/* Title + teacher */}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {currentLesson.teacher_name ? (
              <Text style={styles.teacher} numberOfLines={1}>{currentLesson.teacher_name}</Text>
            ) : null}
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); togglePlayPause(); }}
              style={styles.playBtn}
              hitSlop={8}
            >
              <Text style={styles.playBtnText}>
                {isLoading ? '⋯' : isPlaying ? '⏸' : '▶'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); stop(); }}
              style={styles.stopBtn}
              hitSlop={8}
            >
              <Text style={styles.stopBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>

      <PlayerModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a1f14',
    borderTopWidth: 1,
    borderTopColor: '#1a3a2a',
  },
  progressBar: {
    height: 2,
    backgroundColor: '#1a3a2a',
  },
  progressFill: {
    height: 2,
    backgroundColor: '#4caf50',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#1a3a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: { fontSize: 18 },
  info: { flex: 1 },
  title: { color: '#e8f5e9', fontSize: 13, fontWeight: '600' },
  teacher: { color: '#81c784', fontSize: 11, marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnText: { color: '#0a1f14', fontSize: 16, fontWeight: '800' },
  stopBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopBtnText: { color: '#4a7c59', fontSize: 16 },
});
