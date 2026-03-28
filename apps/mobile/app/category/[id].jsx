import { useState } from 'react';
import {
  View, Text, ActivityIndicator, TouchableOpacity,
  FlatList, StyleSheet, ScrollView, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { useCategory, useCategoryContent, useDebounce } from '@torah-app/api-client';
import { useFilterStore } from '@torah-app/store';
import { Breadcrumb } from '@torah-app/ui';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showTeacherFilter, setShowTeacherFilter] = useState(false);
  const [showInstitutionFilter, setShowInstitutionFilter] = useState(false);
  const debouncedQ = useDebounce(searchQuery, 300);

  const { selectedTeacherIds, selectedInstitutionIds, toggleTeacher, toggleInstitution, clearFilters } = useFilterStore();

  const { data: category, isLoading: loadingCategory } = useCategory(id);
  const { data: content, isLoading: loadingContent } = useCategoryContent(id, {
    teacherIds: selectedTeacherIds,
    institutionIds: selectedInstitutionIds,
    ...(debouncedQ ? { q: debouncedQ } : {}),
  });

  useEffect(() => {
    if (category?.name) navigation.setOptions({ title: category.name });
  }, [category?.name]);

  if (loadingCategory) {
    return <View style={styles.center}><ActivityIndicator color="#4caf50" size="large" /></View>;
  }
  if (!category) {
    return <View style={styles.center}><Text style={styles.errorText}>קטגוריה לא נמצאה</Text></View>;
  }

  const subcategories = category.children ?? [];
  const series = content?.series ?? [];
  const lessons = content?.lessons ?? [];
  const filters = content?.filters ?? { teachers: [], institutions: [] };
  const hasActiveFilters = selectedTeacherIds.length > 0 || selectedInstitutionIds.length > 0;

  const listData = buildResultsList(series, lessons);

  const ListHeader = (
    <>
      {/* Subcategories grid */}
      {subcategories.length > 0 && (
        <View style={styles.subcatSection}>
          <Text style={styles.sectionLabel}>תת-קטגוריות</Text>
          <View style={styles.subcatGrid}>
            {subcategories.map((sub) => (
              <TouchableOpacity
                key={sub.id}
                style={styles.subcatCard}
                onPress={() => router.push(`/category/${sub.id}`)}
                activeOpacity={0.7}
              >
                <Text style={styles.subcatName} numberOfLines={2}>{sub.name}</Text>
                <Text style={styles.subcatSub}>
                  {sub.child_count > 0 ? `${sub.child_count} תתי-קטגוריות` : `${sub.lesson_count ?? 0} שיעורים`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {(series.length > 0 || lessons.length > 0 || loadingContent) && (
            <View style={styles.divider} />
          )}
        </View>
      )}

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchBarWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="חיפוש בקטגוריה..."
            placeholderTextColor="#4a7c59"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            textAlign="right"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterChip, selectedTeacherIds.length > 0 && styles.activeChip]}
          onPress={() => { setShowTeacherFilter(!showTeacherFilter); setShowInstitutionFilter(false); }}
        >
          <Text style={styles.chipText}>
            מרצים {selectedTeacherIds.length > 0 ? `(${selectedTeacherIds.length}) ▾` : '▾'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedInstitutionIds.length > 0 && styles.activeChip]}
          onPress={() => { setShowInstitutionFilter(!showInstitutionFilter); setShowTeacherFilter(false); }}
        >
          <Text style={styles.chipText}>
            מוסדות {selectedInstitutionIds.length > 0 ? `(${selectedInstitutionIds.length}) ▾` : '▾'}
          </Text>
        </TouchableOpacity>
        {hasActiveFilters && (
          <TouchableOpacity onPress={clearFilters}>
            <Text style={styles.clearText}>✕ נקה</Text>
          </TouchableOpacity>
        )}
      </View>

      {showTeacherFilter && (
        <FilterDropdown
          items={filters.teachers}
          selectedIds={selectedTeacherIds}
          onToggle={toggleTeacher}
          onClose={() => setShowTeacherFilter(false)}
        />
      )}
      {showInstitutionFilter && (
        <FilterDropdown
          items={filters.institutions}
          selectedIds={selectedInstitutionIds}
          onToggle={toggleInstitution}
          onClose={() => setShowInstitutionFilter(false)}
        />
      )}

      {loadingContent && <View style={styles.loadingRow}><ActivityIndicator color="#4caf50" /></View>}
    </>
  );

  return (
    <View style={styles.container}>
      {/* Breadcrumb */}
      <View style={styles.breadcrumbContainer}>
        <Breadcrumb
          ancestors={category.ancestors ?? []}
          onNavigate={(cat) =>
            cat.parent === null ? router.replace('/') : router.push(`/category/${cat.id}`)
          }
        />
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => (
          <ResultRow
            item={item}
            onSelectSeries={(s) => router.push(`/series/${s.id}`)}
            onSelectLesson={(l) => router.push(`/lesson/${l.id}`)}
          />
        )}
        contentContainerStyle={styles.resultsList}
        ListEmptyComponent={
          !loadingContent ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                {subcategories.length > 0 ? 'אין תוכן ישיר בקטגוריה זו' : 'לא נמצאו תוצאות'}
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function buildResultsList(series = [], lessons = []) {
  const rows = [];
  if (series.length > 0) {
    rows.push({ key: 'header-series', type: 'header', label: `סדרות (${series.length})` });
    series.forEach((s) => rows.push({ key: `series-${s.id}`, type: 'series', data: s }));
  }
  if (lessons.length > 0) {
    rows.push({ key: 'header-lessons', type: 'header', label: `שיעורים (${lessons.length})` });
    lessons.forEach((l) => rows.push({ key: `lesson-${l.id}`, type: 'lesson', data: l }));
  }
  return rows;
}

function ResultRow({ item, onSelectSeries, onSelectLesson }) {
  if (item.type === 'header') {
    return <Text style={styles.sectionHeader}>{item.label}</Text>;
  }

  const { data } = item;
  const isSeries = item.type === 'series';
  const title = isSeries ? data.name : (data.title ?? data.name);
  const sub1 = isSeries ? `${data.lesson_count} שיעורים` : data.teacher_name ?? '';
  const sub2 = data.institution_name ?? '';

  return (
    <TouchableOpacity
      style={styles.resultRow}
      onPress={() => isSeries ? onSelectSeries(data) : onSelectLesson(data)}
      activeOpacity={0.7}
    >
      <View style={styles.resultIconWrap}>
        <Text style={styles.resultIconText}>{isSeries ? '📚' : '🎵'}</Text>
      </View>
      <View style={styles.resultText}>
        <Text style={styles.resultTitle} numberOfLines={2}>{title}</Text>
        {sub1 ? <Text style={styles.resultSub}>{sub1}</Text> : null}
        {sub2 ? <Text style={styles.resultInst}>{sub2}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

function FilterDropdown({ items, selectedIds, onToggle, onClose }) {
  if (!items?.length) {
    return (
      <View style={styles.dropdown}>
        <Text style={styles.emptyFilterText}>אין אפשרויות לסינון</Text>
        <TouchableOpacity style={styles.dropdownClose} onPress={onClose}>
          <Text style={styles.dropdownCloseText}>סגור</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View style={styles.dropdown}>
      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
        {items.map((item) => {
          const selected = selectedIds.includes(item.id);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.dropdownItem, selected && styles.dropdownItemSelected]}
              onPress={() => onToggle(item.id)}
            >
              <Text style={[styles.dropdownLabel, selected && styles.dropdownLabelSelected]}>
                {selected ? '✓  ' : '    '}{item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <TouchableOpacity style={styles.dropdownClose} onPress={onClose}>
        <Text style={styles.dropdownCloseText}>סגור</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d2618' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  breadcrumbContainer: {
    backgroundColor: '#0a1f14',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
  },
  subcatSection: { paddingTop: 8 },
  sectionLabel: {
    color: '#81c784',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingBottom: 8,
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  subcatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    gap: 8,
  },
  subcatCard: {
    width: '30%',
    minHeight: 62,
    backgroundColor: '#1a3a2a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2d5c40',
    padding: 10,
    justifyContent: 'space-between',
  },
  subcatName: {
    color: '#e8f5e9',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  subcatSub: {
    color: '#81c784',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: '#1a3a2a',
    marginTop: 12,
    marginBottom: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#0a1f14',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
  },
  searchBarWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a2a',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  searchIcon: { fontSize: 14 },
  searchInput: { flex: 1, color: '#e8f5e9', fontSize: 14 },
  clearSearch: { color: '#4a7c59', fontSize: 16 },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#0a1f14',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#1a3a2a',
    borderWidth: 1,
    borderColor: '#2d5c40',
  },
  activeChip: { backgroundColor: '#2d5c40', borderColor: '#4caf50' },
  chipText: { color: '#e8f5e9', fontSize: 13 },
  clearText: { color: '#ef9a9a', fontSize: 13 },
  loadingRow: { padding: 24, alignItems: 'center' },
  sectionHeader: {
    color: '#81c784',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  resultsList: { paddingBottom: 24 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
    gap: 10,
  },
  resultIconWrap: { width: 34, alignItems: 'center' },
  resultIconText: { fontSize: 20 },
  resultText: { flex: 1 },
  resultTitle: {
    color: '#e8f5e9',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  resultSub: {
    color: '#81c784',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
  resultInst: {
    color: '#4a7c59',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 1,
  },
  chevron: { color: '#4a7c59', fontSize: 20 },
  emptyWrap: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#4a7c59', fontSize: 14, textAlign: 'center' },
  errorText: { color: '#ef9a9a', fontSize: 16 },
  dropdown: {
    backgroundColor: '#0a1f14',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
    maxHeight: 230,
  },
  dropdownScroll: { maxHeight: 180 },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
  },
  dropdownItemSelected: { backgroundColor: '#1a3a2a' },
  dropdownLabel: { color: '#b2dfdb', fontSize: 14, textAlign: 'right' },
  dropdownLabelSelected: { color: '#4caf50', fontWeight: '700' },
  emptyFilterText: { color: '#4a7c59', fontSize: 13, textAlign: 'center', padding: 12 },
  dropdownClose: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#1a3a2a',
  },
  dropdownCloseText: { color: '#81c784', fontWeight: '700' },
});
