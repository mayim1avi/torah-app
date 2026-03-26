import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';

/**
 * A single category tile shown in the grid.
 * Props:
 *   category: { id, name, child_count, lesson_count }
 *   onPress: (category) => void
 */
export function CategoryCard({ category, onPress }) {
  const subtitle = category.child_count > 0
    ? `${category.child_count} תתי-קטגוריות`
    : `${category.lesson_count ?? 0} שיעורים`;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(category)} activeOpacity={0.7}>
      <View style={styles.inner}>
        <Text style={styles.name} numberOfLines={2}>{category.name}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    minHeight: 90,
    borderRadius: 12,
    backgroundColor: '#1a3a2a',
    borderWidth: 1,
    borderColor: '#2d5c40',
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e8f5e9',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: 12,
    color: '#81c784',
    textAlign: 'right',
    marginTop: 6,
  },
});
