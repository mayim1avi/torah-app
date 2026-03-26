import { View, Text, TouchableOpacity, StyleSheet, Modal, PanResponder, useWindowDimensions } from 'react-native';
import { useRef, useMemo } from 'react';
import { usePlayerStore } from '@torah-app/store';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

function formatTime(ms) {
  if (!ms || ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function PlayerModal({ visible, onClose }) {
  const { width } = useWindowDimensions();

  const currentLesson = usePlayerStore((s) => s.currentLesson);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const isLoading = usePlayerStore((s) => s.isLoading);
  const positionMs = usePlayerStore((s) => s.positionMs);
  const durationMs = usePlayerStore((s) => s.durationMs);
  const speed = usePlayerStore((s) => s.speed);
  const queue = usePlayerStore((s) => s.queue);
  const queueIndex = usePlayerStore((s) => s.queueIndex);
  const togglePlayPause = usePlayerStore((s) => s.togglePlayPause);
  const seek = usePlayerStore((s) => s.seek);
  const playNext = usePlayerStore((s) => s.playNext);
  const playPrev = usePlayerStore((s) => s.playPrev);
  const setSpeed = usePlayerStore((s) => s.setSpeed);

  const progressBarRef = useRef(null);
  const progressBarWidth = useRef(width - 48);

  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  // Swipe down to close
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 10 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderRelease: (_, g) => { if (g.dy > 60) onClose(); },
  }), [onClose]);

  if (!currentLesson) return null;

  const title = currentLesson.title ?? currentLesson.name ?? '';
  const hasPrev = queueIndex > 0;
  const hasNext = queueIndex < queue.length - 1;

  function handleProgressTap(e) {
    const x = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, x / progressBarWidth.current));
    seek(Math.floor(ratio * durationMs));
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container} {...panResponder.panHandlers}>
        {/* Drag handle */}
        <TouchableOpacity style={styles.handle} onPress={onClose} hitSlop={16}>
          <View style={styles.handleBar} />
        </TouchableOpacity>

        {/* Artwork */}
        <View style={styles.artwork}>
          <Text style={styles.artworkIcon}>🎵</Text>
        </View>

        {/* Title & teacher */}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
          {currentLesson.teacher_name ? (
            <Text style={styles.teacher}>{currentLesson.teacher_name}</Text>
          ) : null}
          {currentLesson.institution_name ? (
            <Text style={styles.institution}>{currentLesson.institution_name}</Text>
          ) : null}
          {queue.length > 1 && (
            <Text style={styles.queueInfo}>{queueIndex + 1} / {queue.length}</Text>
          )}
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <TouchableOpacity
            style={styles.progressBarTouchable}
            onPress={handleProgressTap}
            ref={progressBarRef}
            onLayout={(e) => { progressBarWidth.current = e.nativeEvent.layout.width; }}
          >
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
              <View style={[styles.progressThumb, { left: `${Math.min(progress * 100, 100)}%` }]} />
            </View>
          </TouchableOpacity>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(positionMs)}</Text>
            <Text style={styles.timeText}>{formatTime(durationMs)}</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.skipBtn, !hasPrev && styles.disabled]}
            onPress={playPrev}
            disabled={!hasPrev}
          >
            <Text style={styles.skipBtnText}>⏮</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.playBtn} onPress={togglePlayPause}>
            <Text style={styles.playBtnText}>
              {isLoading ? '⋯' : isPlaying ? '⏸' : '▶'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.skipBtn, !hasNext && styles.disabled]}
            onPress={playNext}
            disabled={!hasNext}
          >
            <Text style={styles.skipBtnText}>⏭</Text>
          </TouchableOpacity>
        </View>

        {/* Speed selector */}
        <View style={styles.speedRow}>
          {SPEEDS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.speedChip, speed === s && styles.speedChipActive]}
              onPress={() => setSpeed(s)}
            >
              <Text style={[styles.speedText, speed === s && styles.speedTextActive]}>
                {s}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d2618',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  handle: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2d5c40',
  },
  artwork: {
    width: 200,
    height: 200,
    borderRadius: 24,
    backgroundColor: '#1a3a2a',
    borderWidth: 1,
    borderColor: '#2d5c40',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 28,
  },
  artworkIcon: { fontSize: 80 },
  titleBlock: { width: '100%', alignItems: 'center', gap: 6, marginBottom: 28 },
  title: {
    color: '#e8f5e9',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },
  teacher: { color: '#81c784', fontSize: 15 },
  institution: { color: '#4a7c59', fontSize: 13 },
  queueInfo: { color: '#2d5c40', fontSize: 12, marginTop: 4 },

  progressSection: { width: '100%', marginBottom: 28 },
  progressBarTouchable: { width: '100%', paddingVertical: 12 },
  progressTrack: {
    height: 4,
    backgroundColor: '#1a3a2a',
    borderRadius: 2,
    position: 'relative',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#4caf50',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -5,
    marginLeft: -7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4caf50',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: { color: '#4a7c59', fontSize: 12 },

  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 36,
  },
  skipBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipBtnText: { color: '#81c784', fontSize: 28 },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtnText: { color: '#0a1f14', fontSize: 32, fontWeight: '800' },
  disabled: { opacity: 0.3 },

  speedRow: {
    flexDirection: 'row',
    gap: 10,
  },
  speedChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1a3a2a',
    borderWidth: 1,
    borderColor: '#2d5c40',
  },
  speedChipActive: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  speedText: { color: '#81c784', fontSize: 13, fontWeight: '600' },
  speedTextActive: { color: '#0a1f14' },
});
