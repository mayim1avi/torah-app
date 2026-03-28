import { query, rawQuery } from './connection.js';

/**
 * Returns the given category ID plus all descendant IDs using a recursive CTE.
 * When page is provided (virtual subcategory), skips recursion — only the direct category matters.
 */
async function getCategoryIds(categoryId, page) {
  if (page != null) return [categoryId];
  const rows = await rawQuery(
    `WITH RECURSIVE descendants AS (
       SELECT id FROM categories WHERE id = ?
       UNION ALL
       SELECT c.id FROM categories c JOIN descendants d ON c.parent = d.id
     )
     SELECT id FROM descendants`,
    [categoryId]
  );
  return rows.map(r => r.id);
}

function inClause(ids) {
  return ids.map(() => '?').join(',');
}

export async function getLessonsByCategory(categoryId, { teacherIds = [], institutionIds = [], q = '', page = null, limit = 50, offset = 0 } = {}) {
  const categoryIds = await getCategoryIds(categoryId, page);
  const pageFilter = page != null ? 'AND lc.page = ?' : '';
  const params = page != null ? [...categoryIds, page] : [...categoryIds];
  let teacherJoin = '';
  let institutionFilter = '';
  let searchFilter = '';

  if (teacherIds.length > 0) {
    teacherJoin = `JOIN lessons_teachers lt_filter
        ON lt_filter.item_id = l.id AND lt_filter.item_type = 1
        AND lt_filter.teacher_id IN (${inClause(teacherIds)})`;
    params.push(...teacherIds);
  }

  if (institutionIds.length > 0) {
    institutionFilter = `AND l.institution_id IN (${inClause(institutionIds)})`;
    params.push(...institutionIds);
  }

  if (q) {
    searchFilter = 'AND (l.title LIKE ? OR l.name LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  params.push(limit, offset);

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
    `JOIN lessons_categories lc ON lc.item_id = l.id AND lc.item_type = 1 AND lc.category_id IN (${inClause(categoryIds)}) ${pageFilter}`,
    teacherJoin,
    'LEFT JOIN institutions i ON i.id = l.institution_id',
    'LEFT JOIN lessons_teachers lt ON lt.item_id = l.id AND lt.item_type = 1',
    'LEFT JOIN teachers t ON t.id = lt.teacher_id',
    institutionFilter,
    'WHERE l.approved = 1',
    searchFilter,
    'GROUP BY l.id',
    'ORDER BY ANY_VALUE(l.date) DESC, l.id DESC',
    'LIMIT ? OFFSET ?',
  ].join(' ');

  return rawQuery(sql, params);
}

export async function getSeriesByCategory(categoryId, { teacherIds = [], institutionIds = [], q = '', page = null, limit = 50, offset = 0 } = {}) {
  const categoryIds = await getCategoryIds(categoryId, page);
  const pageFilter = page != null ? 'AND lc.page = ?' : '';
  const params = page != null ? [...categoryIds, page] : [...categoryIds];
  let teacherFilter = '';
  let institutionFilter = '';
  let searchFilter = '';

  if (teacherIds.length > 0) {
    teacherFilter = `AND lt.teacher_id IN (${inClause(teacherIds)})`;
    params.push(...teacherIds);
  }

  if (institutionIds.length > 0) {
    institutionFilter = `AND s.institution_id IN (${inClause(institutionIds)})`;
    params.push(...institutionIds);
  }

  if (q) {
    searchFilter = 'AND s.name LIKE ?';
    params.push(`%${q}%`);
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
    `JOIN lessons_categories lc ON lc.item_id = l.id AND lc.item_type = 1 AND lc.category_id IN (${inClause(categoryIds)}) ${pageFilter}`,
    'LEFT JOIN institutions i ON i.id = s.institution_id',
    'LEFT JOIN lessons_teachers lt ON lt.item_id = l.id AND lt.item_type = 1',
    teacherFilter,
    institutionFilter,
    'WHERE s.approved = 1',
    searchFilter,
    'GROUP BY s.id',
    'ORDER BY lesson_count DESC',
    'LIMIT ? OFFSET ?',
  ].join(' ');

  return rawQuery(sql, params);
}

/** Teachers that have lessons in this category or any descendant */
export async function getTeachersByCategory(categoryId) {
  return rawQuery(
    `WITH RECURSIVE descendants AS (
       SELECT id FROM categories WHERE id = ?
       UNION ALL
       SELECT c.id FROM categories c JOIN descendants d ON c.parent = d.id
     )
     SELECT DISTINCT t.id, t.name, t.honorific
     FROM teachers t
     JOIN lessons_teachers lt ON lt.teacher_id = t.id AND lt.item_type = 1
     JOIN lessons l ON l.id = lt.item_id AND l.approved = 1
     JOIN lessons_categories lc ON lc.item_id = l.id AND lc.item_type = 1
     JOIN descendants dc ON dc.id = lc.category_id
     ORDER BY t.name`,
    [categoryId]
  );
}

/** Institutions that have lessons in this category or any descendant */
export async function getInstitutionsByCategory(categoryId) {
  return rawQuery(
    `WITH RECURSIVE descendants AS (
       SELECT id FROM categories WHERE id = ?
       UNION ALL
       SELECT c.id FROM categories c JOIN descendants d ON c.parent = d.id
     )
     SELECT DISTINCT i.id, i.name, i.full_name
     FROM institutions i
     JOIN lessons l ON l.institution_id = i.id AND l.approved = 1
     JOIN lessons_categories lc ON lc.item_id = l.id AND lc.item_type = 1
     JOIN descendants dc ON dc.id = lc.category_id
     ORDER BY i.name`,
    [categoryId]
  );
}
