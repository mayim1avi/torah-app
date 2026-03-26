import { query, rawQuery } from './connection.js';

export async function getSeriesById(id) {
  const rows = await query(
    `SELECT
       s.id, s.name, s.url, s.institution_id,
       i.name AS institution_name, i.full_name AS institution_full_name,
       COUNT(DISTINCT l.id) AS lesson_count
     FROM series s
     LEFT JOIN institutions i ON i.id = s.institution_id
     LEFT JOIN lessons l ON l.series_id = s.id AND l.approved = 1
     WHERE s.id = ?
     GROUP BY s.id, s.name, s.url, s.institution_id, i.name, i.full_name`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getLessonsBySeries(seriesId, { limit = 100, offset = 0 } = {}) {
  const rows = await rawQuery(
    `SELECT
       l.id, ANY_VALUE(l.title) AS title, ANY_VALUE(l.name) AS name,
       ANY_VALUE(l.description) AS description, ANY_VALUE(l.link) AS link,
       ANY_VALUE(l.date) AS date, ANY_VALUE(l.has_audio) AS has_audio,
       l.\`order\`,
       ANY_VALUE(t.id) AS teacher_id,
       ANY_VALUE(t.name) AS teacher_name,
       ANY_VALUE(t.honorific) AS teacher_honorific
     FROM lessons l
     LEFT JOIN lessons_teachers lt ON lt.item_id = l.id AND lt.item_type = 1
     LEFT JOIN teachers t ON t.id = lt.teacher_id
     WHERE l.series_id = ? AND l.approved = 1
     GROUP BY l.id, l.\`order\`
     ORDER BY l.\`order\` ASC, l.id ASC
     LIMIT ? OFFSET ?`,
    [seriesId, limit, offset]
  );
  return rows;
}

/** Teachers associated with a series (via its lessons) */
export async function getTeachersBySeries(seriesId) {
  return query(
    `SELECT DISTINCT t.id, t.name, t.honorific
     FROM teachers t
     JOIN lessons_teachers lt ON lt.teacher_id = t.id AND lt.item_type = 1
     JOIN lessons l ON l.id = lt.item_id AND l.series_id = ? AND l.approved = 1
     ORDER BY t.name`,
    [seriesId]
  );
}
