import { query, rawQuery } from './connection.js';

/**
 * Get lessons in a category with optional teacher/institution filters.
 */
export async function getLessonsByCategory(categoryId, { teacherIds = [], institutionIds = [], limit = 50, offset = 0 } = {}) {
  const params = [categoryId];
  let teacherJoin = '';
  let institutionFilter = '';

  if (teacherIds.length > 0) {
    teacherJoin = `JOIN lessons_teachers lt_filter
        ON lt_filter.item_id = l.id AND lt_filter.item_type = 1
        AND lt_filter.teacher_id IN (${teacherIds.map(() => '?').join(',')})`;
    params.push(...teacherIds);
  }

  if (institutionIds.length > 0) {
    institutionFilter = `AND l.institution_id IN (${institutionIds.map(() => '?').join(',')})`;
    params.push(...institutionIds);
  }

  params.push(limit, offset);

  // Use ANY_VALUE for non-grouped columns to avoid ONLY_FULL_GROUP_BY issues
  const sql = [
    'SELECT l.id,',
    '  ANY_VALUE(l.title) AS title,',
    '  ANY_VALUE(l.name) AS name,',
    '  ANY_VALUE(l.description) AS description,',
    '  ANY_VALUE(l.link) AS link,',
    '  ANY_VALUE(l.series_id) AS series_id,',
    '  ANY_VALUE(l.institution_id) AS institution_id,',
    '  ANY_VALUE(l.date) AS date,',
    '  ANY_VALUE(l.has_audio) AS has_audio,',
    '  ANY_VALUE(i.name) AS institution_name,',
    '  ANY_VALUE(t.id) AS teacher_id,',
    '  ANY_VALUE(t.name) AS teacher_name,',
    '  ANY_VALUE(t.honorific) AS teacher_honorific',
    'FROM lessons l',
    'JOIN lessons_categories lc ON lc.item_id = l.id AND lc.item_type = 1 AND lc.category_id = ?',
    teacherJoin,
    'LEFT JOIN institutions i ON i.id = l.institution_id',
    'LEFT JOIN lessons_teachers lt ON lt.item_id = l.id AND lt.item_type = 1',
    'LEFT JOIN teachers t ON t.id = lt.teacher_id',
    institutionFilter,
    'WHERE l.approved = 1',
    'GROUP BY l.id',
    'ORDER BY ANY_VALUE(l.date) DESC, l.id DESC',
    'LIMIT ? OFFSET ?',
  ].join(' ');

  return rawQuery(sql, params);
}

/**
 * Get series that have at least one lesson in this category.
 */
export async function getSeriesByCategory(categoryId, { teacherIds = [], institutionIds = [], limit = 50, offset = 0 } = {}) {
  const params = [categoryId];
  let teacherFilter = '';
  let institutionFilter = '';

  if (teacherIds.length > 0) {
    teacherFilter = `AND lt.teacher_id IN (${teacherIds.map(() => '?').join(',')})`;
    params.push(...teacherIds);
  }

  if (institutionIds.length > 0) {
    institutionFilter = `AND s.institution_id IN (${institutionIds.map(() => '?').join(',')})`;
    params.push(...institutionIds);
  }

  params.push(limit, offset);

  const sql = [
    'SELECT s.id,',
    '  ANY_VALUE(s.name) AS name,',
    '  ANY_VALUE(s.url) AS url,',
    '  ANY_VALUE(s.institution_id) AS institution_id,',
    '  ANY_VALUE(i.name) AS institution_name,',
    '  COUNT(DISTINCT l.id) AS lesson_count',
    'FROM series s',
    'JOIN lessons l ON l.series_id = s.id AND l.approved = 1',
    'JOIN lessons_categories lc ON lc.item_id = l.id AND lc.item_type = 1 AND lc.category_id = ?',
    'LEFT JOIN institutions i ON i.id = s.institution_id',
    'LEFT JOIN lessons_teachers lt ON lt.item_id = l.id AND lt.item_type = 1',
    teacherFilter,
    institutionFilter,
    'WHERE s.approved = 1',
    'GROUP BY s.id',
    'ORDER BY lesson_count DESC',
    'LIMIT ? OFFSET ?',
  ].join(' ');

  return rawQuery(sql, params);
}

/** Teachers that have lessons in a given category (for filter dropdown) */
export async function getTeachersByCategory(categoryId) {
  return query(
    `SELECT DISTINCT t.id, t.name, t.honorific
     FROM teachers t
     JOIN lessons_teachers lt ON lt.teacher_id = t.id AND lt.item_type = 1
     JOIN lessons l ON l.id = lt.item_id AND l.approved = 1
     JOIN lessons_categories lc ON lc.item_id = l.id AND lc.item_type = 1 AND lc.category_id = ?
     ORDER BY t.name`,
    [categoryId]
  );
}

/** Institutions that have lessons in a given category (for filter dropdown) */
export async function getInstitutionsByCategory(categoryId) {
  return query(
    `SELECT DISTINCT i.id, i.name, i.full_name
     FROM institutions i
     JOIN lessons l ON l.institution_id = i.id AND l.approved = 1
     JOIN lessons_categories lc ON lc.item_id = l.id AND lc.item_type = 1 AND lc.category_id = ?
     ORDER BY i.name`,
    [categoryId]
  );
}
