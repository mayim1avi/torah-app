import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client.js';

// ── Browse ────────────────────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: () => api.getCategories() });
}

export function useCategory(id) {
  return useQuery({ queryKey: ['category', id], queryFn: () => api.getCategory(id), enabled: !!id });
}

export function useCategoryContent(id, filters = {}) {
  return useQuery({
    queryKey: ['category-content', id, filters],
    queryFn: () => api.getCategoryContent(id, filters),
    enabled: !!id,
  });
}

export function useSeries(id) {
  return useQuery({ queryKey: ['series', id], queryFn: () => api.getSeries(id), enabled: !!id });
}

export function useSeriesLessons(id) {
  return useQuery({ queryKey: ['series-lessons', id], queryFn: () => api.getSeriesLessons(id), enabled: !!id });
}

export function useLesson(id) {
  return useQuery({ queryKey: ['lesson', id], queryFn: () => api.getLesson(id), enabled: !!id });
}

export function useTeachers(opts = {}) {
  return useQuery({ queryKey: ['teachers', opts], queryFn: () => api.getTeachers(opts), staleTime: 60_000 * 10 });
}

export function useTeacher(id) {
  return useQuery({ queryKey: ['teacher', id], queryFn: () => api.getTeacher(id), enabled: !!id });
}

export function useTeacherLessons(id, opts = {}) {
  return useQuery({ queryKey: ['teacher-lessons', id, opts], queryFn: () => api.getTeacherLessons(id, opts), enabled: !!id });
}

export function useInstitutions(opts = {}) {
  return useQuery({ queryKey: ['institutions', opts], queryFn: () => api.getInstitutions(opts), staleTime: 60_000 * 10 });
}

export function useSearch(params) {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => api.search(params),
    enabled: !!(params?.q?.trim()),
  });
}

// ── User library ──────────────────────────────────────────────────────────────

export function useLibrary(enabled = true) {
  return useQuery({ queryKey: ['library'], queryFn: () => api.getLibrary(), enabled });
}

export function useIsLessonSaved(lessonId, enabled = true) {
  return useQuery({
    queryKey: ['lesson-saved', lessonId],
    queryFn: () => api.isLessonSaved(lessonId),
    enabled: enabled && !!lessonId,
  });
}

export function useSaveLessonMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ lessonId, save }) =>
      save ? api.saveLesson(lessonId) : api.unsaveLesson(lessonId),
    onSuccess: (_, { lessonId }) => {
      qc.invalidateQueries({ queryKey: ['library'] });
      qc.invalidateQueries({ queryKey: ['lesson-saved', lessonId] });
    },
  });
}

// ── User history ──────────────────────────────────────────────────────────────

export function useHistory(enabled = true) {
  return useQuery({ queryKey: ['history'], queryFn: () => api.getHistory(), enabled });
}

export function useLessonProgress(lessonId, enabled = true) {
  return useQuery({
    queryKey: ['progress', lessonId],
    queryFn: () => api.getProgress(lessonId),
    enabled: enabled && !!lessonId,
  });
}
