import { FlatList, StyleSheet, View } from 'react-native';
import { CategoryCard } from './CategoryCard.jsx';

/**
 * Responsive 2-column grid of category cards.
 * Props:
 *   categories: Category[]
 *   onSelect: (category) => void
 *   ListHeaderComponent: optional header node
 */
export function CategoryGrid({ categories, onSelect, ListHeaderComponent }) {
  return (
    <FlatList
      data={categories}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      renderItem={({ item }) => (
        <CategoryCard category={item} onPress={onSelect} />
      )}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      ListHeaderComponent={ListHeaderComponent}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
});
