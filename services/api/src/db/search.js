import { rawQuery } from './connection.js';

/**
 * Full-text search across lessons and series using LIKE.
 * Phase 4 will upgrade this to Typesense for full faceted search.
 */
export async function searchContent({
  q = '',
  categoryId = null,
  teacherIds = [],
  institutionIds = [],
  type = 'all',
  limit = 30,
  offset = 0,
} = {}) {
  const results = { lessons: [], series: [] };
  if (!q.trim()) return results;

  const term = `%${q.trim()}%`;

  // ── Lessons ─────────────────────────────────────────────────────────────
  if (type !== 'series') {
    const parts = [
      'SELECT l.id,',
      '  ANY_VALUE(l.title) AS title,',
      '  ANY_VALUE(l.name) AS name,',
      '  ANY_VALUE(l.date) AS date,',
      '  ANY_VALUE(l.has_audio) AS has_audio,',
      '  ANY_VALUE(l.series_id) AS series_id,',
      '  ANY_VALUE(l.institution_id) AS institution_id,',
      '  ANY_VALUE(i.name) AS institution_name,',
      '  ANY_VALUE(t.id) AS teacher_id,',
      '  ANY_VALUE(t.name) AS teacher_name,',
      '  ANY_VALUE(t.honorific) AS teacher_honorific',
      'FROM lessons l',
    ];
    const params = [];

    if (categoryId) {
      parts.push('JOIN lessons_categories lc ON lc.item_id = l.id AND lc.item_type = 1 AND lc.category_id = ?');
      params.push(categoryId);
    }
    parts.push(
      'LEFT JOIN institutions i ON i.id = l.institution_id',
      'LEFT JOIN lessons_teachers lt ON lt.item_id = l.id AND lt.item_type = 1',
      'LEFT JOIN teachers t ON t.id = lt.teacher_id'
    );
    if (teacherIds.length > 0) {
      parts.push(`JOIN lessons_teachers lt_f ON lt_f.item_id = l.id AND lt_f.item_type = 1 AND lt_f.teacher_id IN (${teacherIds.map(() => '?').join(',')})`);
      params.push(...teacherIds);
    }
    parts.push('WHERE l.approved = 1 AND (l.title LIKE ? OR l.name LIKE ?)');
    params.push(term, term);
    if (institutionIds.length > 0) {
      parts.push(`AND l.institution_id IN (${institutionIds.map(() => '?').join(',')})`);
      params.push(...institutionIds);
    }
    parts.push('GROUP BY l.id', 'ORDER BY ANY_VALUE(l.date) DESC', 'LIMIT ?', 'OFFSET ?');
    params.push(limit, offset);

    results.lessons = await rawQuery(parts.join(' '), params);
  }

  // ── Series ───────────────────────────────────────────────────────────────
  if (type !== 'lessons') {
    const parts = [
      'SELECT s.id,',
      '  ANY_VALUE(s.name) AS name,',
      '  ANY_VALUE(s.url) AS url,',
      '  ANY_VALUE(s.institution_id) AS institution_id,',
      '  ANY_VALUE(i.name) AS institution_name,',
      '  COUNT(DISTINCT l.id) AS lesson_count',
      'FROM series s',
      'LEFT JOIN institutions i ON i.id = s.institution_id',
      'LEFT JOIN lessons l ON l.series_id = s.id AND l.approved = 1',
    ];
    const params = [];

    if (categoryId) {
      parts.push('JOIN lessons l_c ON l_c.series_id = s.id AND l_c.approved = 1');
      parts.push('JOIN lessons_categories lc ON lc.item_id = l_c.id AND lc.item_type = 1 AND lc.category_id = ?');
      params.push(categoryId);
    }
    if (institutionIds.length > 0) {
      parts.push(`AND s.institution_id IN (${institutionIds.map(() => '?').join(',')})`);
      params.push(...institutionIds);
    }
    parts.push('WHERE s.approved = 1 AND s.name LIKE ?');
    params.push(term);
    parts.push('GROUP BY s.id', 'ORDER BY lesson_count DESC', 'LIMIT ?', 'OFFSET ?');
    params.push(limit, offset);

    results.series = await rawQuery(parts.join(' '), params);
  }

  return results;
}
