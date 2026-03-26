import { useState, useCallback } from 'react';
import {
  View, Text, ActivityIndicator, TouchableOpacity,
  FlatList, StyleSheet, ScrollView, TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useCategory, useCategoryContent, useSearch } from '@torah-app/api-client';
import { useFilterStore } from '@torah-app/store';
import { CategoryGrid, Breadcrumb } from '@torah-app/ui';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [showContent, setShowContent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { selectedTeacherIds, selectedInstitutionIds, toggleTeacher, toggleInstitution, clearFilters } = useFilterStore();

  const { data: category, isLoading: loadingCategory } = useCategory(id);
  const { data: content, isLoading: loadingContent } = useCategoryContent(
    showContent && !searchQuery ? id : null,
    { teacherIds: selectedTeacherIds, institutionIds: selectedInstitutionIds }
  );
  const { data: searchResults, isLoading: loadingSearch } = useSearch(
    searchQuery
      ? { q: searchQuery, categoryId: id, teacherIds: selectedTeacherIds, institutionIds: selectedInstitutionIds }
      : null
  );

  useEffect(() => {
    if (category?.name) navigation.setOptions({ title: category.name });
  }, [category?.name]);

  useEffect(() => {
    if (category && category.child_count === 0) setShowContent(true);
  }, [category]);

  if (loadingCategory) {
    return <View style={styles.center}><ActivityIndicator color="#4caf50" size="large" /></View>;
  }
  if (!category) {
    return <View style={styles.center}><Text style={styles.errorText}>קטגוריה לא נמצאה</Text></View>;
  }

  const hasChildren = category.child_count > 0;
  const filterOptions = content?.filters ?? { teachers: [], institutions: [] };

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

      {/* Category grid — if has children and not yet in browse mode */}
      {hasChildren && !showContent && (
        <>
          <CategoryGrid
            categories={category.children ?? []}
            onSelect={(child) => router.push(`/category/${child.id}`)}
          />
          <TouchableOpacity style={styles.browseButton} onPress={() => setShowContent(true)}>
            <Text style={styles.browseButtonText}>🔍 עיון בשיעורים</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Content / search view */}
      {showContent && (
        <ContentView
          content={searchQuery ? searchResults : content}
          loading={searchQuery ? loadingSearch : loadingContent}
          filters={filterOptions}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTeacherIds={selectedTeacherIds}
          selectedInstitutionIds={selectedInstitutionIds}
          onToggleTeacher={toggleTeacher}
          onToggleInstitution={toggleInstitution}
          onClearFilters={clearFilters}
          onBack={hasChildren ? () => setShowContent(false) : null}
          onSelectSeries={(s) => router.push(`/series/${s.id}`)}
          onSelectLesson={(l) => router.push(`/lesson/${l.id}`)}
        />
      )}
    </View>
  );
}

function ContentView({
  content, loading, filters,
  searchQuery, onSearchChange,
  selectedTeacherIds, selectedInstitutionIds,
  onToggleTeacher, onToggleInstitution, onClearFilters,
  onBack, onSelectSeries, onSelectLesson,
}) {
  const [showTeacherFilter, setShowTeacherFilter] = useState(false);
  const [showInstitutionFilter, setShowInstitutionFilter] = useState(false);
  const hasActiveFilters = selectedTeacherIds.length > 0 || selectedInstitutionIds.length > 0;

  // Merge category content and search results into one list
  const series = searchQuery ? (content?.series ?? []) : (content?.series ?? []);
  const lessons = searchQuery ? (content?.lessons ?? []) : (content?.lessons ?? []);

  return (
    <View style={styles.contentContainer}>
      {/* Search bar */}
      <View style={styles.searchRow}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        <View style={styles.searchBarWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="חיפוש חופשי..."
            placeholderTextColor="#4a7c59"
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
            textAlign="right"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => onSearchChange('')}>
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
          <TouchableOpacity onPress={onClearFilters}>
            <Text style={styles.clearText}>✕ נקה</Text>
          </TouchableOpacity>
        )}
      </View>

      {showTeacherFilter && (
        <FilterDropdown
          items={filters.teachers}
          selectedIds={selectedTeacherIds}
          onToggle={onToggleTeacher}
          onClose={() => setShowTeacherFilter(false)}
        />
      )}
      {showInstitutionFilter && (
        <FilterDropdown
          items={filters.institutions}
          selectedIds={selectedInstitutionIds}
          onToggle={onToggleInstitution}
          onClose={() => setShowInstitutionFilter(false)}
        />
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#4caf50" /></View>
      ) : (
        <FlatList
          data={buildResultsList(series, lessons)}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <ResultRow
              item={item}
              onSelectSeries={onSelectSeries}
              onSelectLesson={onSelectLesson}
            />
          )}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'לא נמצאו תוצאות לחיפוש זה' : 'אין תוכן בקטגוריה זו'}
              </Text>
            </View>
          }
        />
      )}
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
  const sub1 = isSeries
    ? `${data.lesson_count} שיעורים`
    : data.teacher_name ?? '';
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
  browseButton: {
    margin: 16,
    padding: 14,
    backgroundColor: '#1a3a2a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2d5c40',
    alignItems: 'center',
  },
  browseButtonText: { color: '#4caf50', fontWeight: '700', fontSize: 15 },
  contentContainer: { flex: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#0a1f14',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
    gap: 8,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1a3a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: { color: '#e8f5e9', fontSize: 18 },
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
