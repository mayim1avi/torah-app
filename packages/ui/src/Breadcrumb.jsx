import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

/**
 * Horizontal scrollable breadcrumb showing the category path.
 * Props:
 *   ancestors: Category[]  (root → current, inclusive)
 *   onNavigate: (category) => void
 */
export function Breadcrumb({ ancestors, onNavigate }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {ancestors.map((cat, index) => (
        <View key={cat.id} style={styles.item}>
          {index > 0 && <Text style={styles.separator}>›</Text>}
          <TouchableOpacity onPress={() => onNavigate(cat)}>
            <Text
              style={[
                styles.crumb,
                index === ancestors.length - 1 && styles.current,
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    color: '#81c784',
    marginHorizontal: 4,
    fontSize: 14,
  },
  crumb: {
    color: '#81c784',
    fontSize: 13,
  },
  current: {
    color: '#e8f5e9',
    fontWeight: '700',
  },
});
