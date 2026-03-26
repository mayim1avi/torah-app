const BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

// Token provider — set by the app at startup
let _getToken = () => null;
export function setTokenProvider(fn) { _getToken = fn; }

async function apiFetch(path, options = {}) {
  const token = _getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function buildParams(obj) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    p.set(k, Array.isArray(v) ? v.join(',') : String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

export const api = {
  // Auth
  register: ({ name, email, password }) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  login: ({ email, password }) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () =>
    apiFetch('/auth/me'),

  // Categories
  getCategories: () => apiFetch('/api/categories'),
  getCategory: (id) => apiFetch(`/api/categories/${id}`),
  getCategoryContent: (id, { teacherIds = [], institutionIds = [], type = 'all', limit = 50, offset = 0 } = {}) =>
    apiFetch(`/api/categories/${id}/content${buildParams({ teacherIds, institutionIds, type, limit, offset })}`),

  // Series
  getSeries: (id) => apiFetch(`/api/series/${id}`),
  getSeriesLessons: (id, { limit = 100, offset = 0 } = {}) =>
    apiFetch(`/api/series/${id}/lessons${buildParams({ limit, offset })}`),

  // Lessons
  getLesson: (id) => apiFetch(`/api/lessons/${id}`),

  // Teachers
  getTeachers: ({ search = '', limit = 200 } = {}) =>
    apiFetch(`/api/teachers${buildParams({ search, limit })}`),
  getTeacher: (id) => apiFetch(`/api/teachers/${id}`),

  // Institutions
  getInstitutions: ({ search = '', limit = 200 } = {}) =>
    apiFetch(`/api/institutions${buildParams({ search, limit })}`),
  getInstitution: (id) => apiFetch(`/api/institutions/${id}`),

  // Search
  search: ({ q, categoryId, teacherIds = [], institutionIds = [], type = 'all', limit = 30, offset = 0 } = {}) =>
    apiFetch(`/api/search${buildParams({ q, categoryId, teacherIds, institutionIds, type, limit, offset })}`),

  // User library
  getLibrary: () => apiFetch('/api/user/library'),
  isLessonSaved: (lessonId) => apiFetch(`/api/user/library/${lessonId}`),
  saveLesson: (lessonId) =>
    apiFetch(`/api/user/library/${lessonId}`, { method: 'POST' }),
  unsaveLesson: (lessonId) =>
    apiFetch(`/api/user/library/${lessonId}`, { method: 'DELETE' }),

  // User progress
  saveProgress: ({ lessonId, positionMs, durationMs }) =>
    apiFetch('/api/user/progress', {
      method: 'POST',
      body: JSON.stringify({ lessonId, positionMs, durationMs }),
    }),
  getProgress: (lessonId) => apiFetch(`/api/user/progress/${lessonId}`),
  getHistory: ({ limit = 30 } = {}) =>
    apiFetch(`/api/user/history${buildParams({ limit })}`),
};
