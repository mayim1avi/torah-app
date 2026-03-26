import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useCategories } from '@torah-app/api-client';
import { CategoryGrid } from '@torah-app/ui';

export default function HomeScreen() {
  const router = useRouter();
  const { data: categories, isLoading, error } = useCategories();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4caf50" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>שגיאה בטעינת הנתונים</Text>
        <Text style={styles.errorDetail}>{error.message}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CategoryGrid
        categories={categories ?? []}
        onSelect={(category) => router.push(`/category/${category.id}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d2618',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0d2618',
  },
  errorText: {
    color: '#ef9a9a',
    fontSize: 16,
    fontWeight: '700',
  },
  errorDetail: {
    color: '#81c784',
    fontSize: 12,
    marginTop: 8,
  },
});
