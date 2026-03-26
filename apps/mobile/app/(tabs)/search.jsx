import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useSearch, useInstitutions, useTeachers, useDebounce,
} from '@torah-app/api-client';

// ── Search screen ────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([]);
  const [selectedInstitutionIds, setSelectedInstitutionIds] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'teacher' | 'institution' | null
  // name cache so pill labels work after dropdown closes
  const [teacherNames, setTeacherNames] = useState({}); // id → name

  const debouncedQuery = useDebounce(query, 300);

  const { data: results, isLoading: searching, isFetching } = useSearch({
    q: debouncedQuery,
    teacherIds: selectedTeacherIds,
    institutionIds: selectedInstitutionIds,
  });

  const { data: institutions = [] } = useInstitutions();

  const toggleTeacher = useCallback((id, name) => {
    if (name) setTeacherNames((prev) => ({ ...prev, [id]: name }));
    setSelectedTeacherIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleInstitution = useCallback((id) =>
    setSelectedInstitutionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    ), []);

  const clearAll = () => {
    setSelectedTeacherIds([]);
    setSelectedInstitutionIds([]);
  };

  const hasFilters = selectedTeacherIds.length > 0 || selectedInstitutionIds.length > 0;
  const hasResults = results && (results.series?.length > 0 || results.lessons?.length > 0);
  const showEmpty = debouncedQuery.trim() && !searching && !isFetching && !hasResults;

  return (
    <View style={styles.container}>
      {/* ── Search bar ── */}
      <View style={styles.searchBarRow}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="חיפוש שיעורים, סדרות, מרצים..."
            placeholderTextColor="#4a7c59"
            value={query}
            onChangeText={(t) => { setQuery(t); setActiveDropdown(null); }}
            returnKeyType="search"
            textAlign="right"
            autoCorrect={false}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ── Filter chips ── */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.chip, selectedTeacherIds.length > 0 && styles.chipActive]}
          onPress={() => setActiveDropdown(activeDropdown === 'teacher' ? null : 'teacher')}
        >
          <Text style={styles.chipText}>
            מרצים {selectedTeacherIds.length > 0 ? `(${selectedTeacherIds.length})` : '▾'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, selectedInstitutionIds.length > 0 && styles.chipActive]}
          onPress={() => setActiveDropdown(activeDropdown === 'institution' ? null : 'institution')}
        >
          <Text style={styles.chipText}>
            מוסדות {selectedInstitutionIds.length > 0 ? `(${selectedInstitutionIds.length})` : '▾'}
          </Text>
        </TouchableOpacity>
        {hasFilters && (
          <TouchableOpacity onPress={clearAll} hitSlop={8}>
            <Text style={styles.clearFilters}>✕ נקה</Text>
          </TouchableOpacity>
        )}
        {(searching || isFetching) && <ActivityIndicator color="#4caf50" size="small" />}
      </View>

      {/* Active filter chips summary */}
      {hasFilters && (
        <ActiveFilterPills
          teacherIds={selectedTeacherIds}
          institutionIds={selectedInstitutionIds}
          institutions={institutions}
          teacherNames={teacherNames}
          onRemoveTeacher={toggleTeacher}
          onRemoveInstitution={toggleInstitution}
        />
      )}

      {/* ── Dropdowns ── */}
      {activeDropdown === 'teacher' && (
        <TeacherDropdown
          selectedIds={selectedTeacherIds}
          onToggle={toggleTeacher}
          onClose={() => setActiveDropdown(null)}
          nameCache={teacherNames}
        />
      )}
      {activeDropdown === 'institution' && (
        <InstitutionDropdown
          institutions={institutions}
          selectedIds={selectedInstitutionIds}
          onToggle={toggleInstitution}
          onClose={() => setActiveDropdown(null)}
        />
      )}

      {/* ── Results ── */}
      {!debouncedQuery.trim() ? (
        <HintState />
      ) : showEmpty ? (
        <EmptyState query={debouncedQuery} />
      ) : (
        <ResultsList
          results={results}
          onSelectSeries={(s) => router.push(`/series/${s.id}`)}
          onSelectLesson={(l) => router.push(`/lesson/${l.id}`)}
        />
      )}
    </View>
  );
}

// ── Results list ─────────────────────────────────────────────────────────────

function ResultsList({ results, onSelectSeries, onSelectLesson }) {
  const rows = buildRows(results);
  return (
    <FlatList
      data={rows}
      keyExtractor={(item) => item.key}
      renderItem={({ item }) => (
        <ResultRow item={item} onSelectSeries={onSelectSeries} onSelectLesson={onSelectLesson} />
      )}
      contentContainerStyle={styles.resultsList}
      keyboardShouldPersistTaps="handled"
    />
  );
}

function buildRows(results) {
  if (!results) return [];
  const rows = [];
  if (results.series?.length > 0) {
    rows.push({ key: 'h-series', type: 'header', label: `סדרות (${results.series.length})` });
    results.series.forEach((s) => rows.push({ key: `s-${s.id}`, type: 'series', data: s }));
  }
  if (results.lessons?.length > 0) {
    rows.push({ key: 'h-lessons', type: 'header', label: `שיעורים (${results.lessons.length})` });
    results.lessons.forEach((l) => rows.push({ key: `l-${l.id}`, type: 'lesson', data: l }));
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
  const sub = isSeries
    ? `${data.lesson_count} שיעורים • ${data.institution_name ?? ''}`
    : `${data.teacher_name ?? ''} • ${data.institution_name ?? ''}`;

  return (
    <TouchableOpacity
      style={styles.resultRow}
      onPress={() => isSeries ? onSelectSeries(data) : onSelectLesson(data)}
      activeOpacity={0.7}
    >
      <Text style={styles.resultIcon}>{isSeries ? '📚' : '🎵'}</Text>
      <View style={styles.resultText}>
        <Text style={styles.resultTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.resultSub} numberOfLines={1}>{sub}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Teacher dropdown with typeahead ──────────────────────────────────────────

function TeacherDropdown({ selectedIds, onToggle, onClose, nameCache = {} }) {
  const [teacherSearch, setTeacherSearch] = useState('');
  const debouncedTeacherSearch = useDebounce(teacherSearch, 250);

  const { data: teachers = [], isLoading } = useTeachers({
    search: debouncedTeacherSearch,
    limit: 50,
  });

  return (
    <View style={styles.dropdown}>
      <View style={styles.dropdownSearch}>
        <TextInput
          style={styles.dropdownInput}
          placeholder="חיפוש מרצה..."
          placeholderTextColor="#4a7c59"
          value={teacherSearch}
          onChangeText={setTeacherSearch}
          textAlign="right"
          autoFocus
        />
        {isLoading && <ActivityIndicator color="#4caf50" size="small" />}
      </View>
      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {teachers.map((t) => {
          const sel = selectedIds.includes(t.id);
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.dropdownItem, sel && styles.dropdownItemSel]}
              onPress={() => onToggle(t.id, t.name)}
            >
              <Text style={[styles.dropdownLabel, sel && styles.dropdownLabelSel]}>
                {sel ? '✓  ' : '    '}{t.name}
              </Text>
            </TouchableOpacity>
          );
        })}
        {!isLoading && teachers.length === 0 && (
          <Text style={styles.dropdownEmpty}>לא נמצאו מרצים</Text>
        )}
      </ScrollView>
      <TouchableOpacity style={styles.dropdownClose} onPress={onClose}>
        <Text style={styles.dropdownCloseText}>סגור</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Institution dropdown ──────────────────────────────────────────────────────

function InstitutionDropdown({ institutions, selectedIds, onToggle, onClose }) {
  return (
    <View style={styles.dropdown}>
      <ScrollView style={styles.dropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {institutions.map((i) => {
          const sel = selectedIds.includes(i.id);
          return (
            <TouchableOpacity
              key={i.id}
              style={[styles.dropdownItem, sel && styles.dropdownItemSel]}
              onPress={() => onToggle(i.id)}
            >
              <Text style={[styles.dropdownLabel, sel && styles.dropdownLabelSel]}>
                {sel ? '✓  ' : '    '}{i.name}
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

// ── Active filter pills ───────────────────────────────────────────────────────

function ActiveFilterPills({ teacherIds, institutionIds, institutions, teacherNames = {}, onRemoveTeacher, onRemoveInstitution }) {
  const instMap = Object.fromEntries(institutions.map((i) => [i.id, i.name]));
  if (teacherIds.length === 0 && institutionIds.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.pillsRow}
      keyboardShouldPersistTaps="handled"
    >
      {institutionIds.map((id) => (
        <TouchableOpacity key={id} style={styles.pill} onPress={() => onRemoveInstitution(id)}>
          <Text style={styles.pillText}>{instMap[id] ?? id}  ✕</Text>
        </TouchableOpacity>
      ))}
      {teacherIds.map((id) => (
        <TouchableOpacity key={id} style={styles.pill} onPress={() => onRemoveTeacher(id)}>
          <Text style={styles.pillText}>{teacherNames[id] ?? `מרצה #${id}`}  ✕</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ── Empty / hint states ───────────────────────────────────────────────────────

function HintState() {
  return (
    <View style={styles.hintContainer}>
      <Text style={styles.hintIcon}>🔍</Text>
      <Text style={styles.hintTitle}>חיפוש חופשי</Text>
      <Text style={styles.hintBody}>
        חפש לפי שם שיעור, שם סדרה, או נושא.{'\n'}
        סנן לפי מרצה או מוסד.
      </Text>
    </View>
  );
}

function EmptyState({ query }) {
  return (
    <View style={styles.hintContainer}>
      <Text style={styles.hintIcon}>🙁</Text>
      <Text style={styles.hintTitle}>לא נמצאו תוצאות</Text>
      <Text style={styles.hintBody}>לא מצאנו תוצאות עבור "{query}"</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d2618' },

  searchBarRow: {
    padding: 12,
    backgroundColor: '#0a1f14',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a2a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, color: '#e8f5e9', fontSize: 15 },
  clearBtn: { color: '#4a7c59', fontSize: 17 },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: '#0a1f14',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#1a3a2a',
    borderWidth: 1,
    borderColor: '#2d5c40',
  },
  chipActive: { backgroundColor: '#2d5c40', borderColor: '#4caf50' },
  chipText: { color: '#e8f5e9', fontSize: 13 },
  clearFilters: { color: '#ef9a9a', fontSize: 13 },

  pillsRow: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    backgroundColor: '#0a1f14',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#2d5c40',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  pillText: { color: '#e8f5e9', fontSize: 12 },

  dropdown: {
    backgroundColor: '#0a1f14',
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
    maxHeight: 260,
  },
  dropdownSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
    gap: 8,
  },
  dropdownInput: {
    flex: 1,
    color: '#e8f5e9',
    fontSize: 14,
    paddingVertical: 4,
  },
  dropdownScroll: { maxHeight: 190 },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
  },
  dropdownItemSel: { backgroundColor: '#1a3a2a' },
  dropdownLabel: { color: '#b2dfdb', fontSize: 14, textAlign: 'right' },
  dropdownLabelSel: { color: '#4caf50', fontWeight: '700' },
  dropdownEmpty: { color: '#4a7c59', textAlign: 'center', padding: 14, fontSize: 13 },
  dropdownClose: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#1a3a2a',
  },
  dropdownCloseText: { color: '#81c784', fontWeight: '700' },

  sectionHeader: {
    color: '#81c784',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    textAlign: 'right',
    letterSpacing: 0.4,
  },
  resultsList: { paddingBottom: 100 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#1a3a2a',
    gap: 10,
  },
  resultIcon: { fontSize: 20, width: 28, textAlign: 'center' },
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
  chevron: { color: '#4a7c59', fontSize: 20 },

  hintContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  hintIcon: { fontSize: 48 },
  hintTitle: { color: '#e8f5e9', fontSize: 18, fontWeight: '700' },
  hintBody: { color: '#4a7c59', fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
