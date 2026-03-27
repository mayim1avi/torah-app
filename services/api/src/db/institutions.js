import { query, rawQuery } from './connection.js';

export async function getAllInstitutions({ search = '', limit = 200, offset = 0 } = {}) {
  if (search) {
    return rawQuery(
      `SELECT id, name, full_name, website
       FROM institutions
       WHERE name LIKE ? OR full_name LIKE ?
       ORDER BY name
       LIMIT ? OFFSET ?`,
      [`%${search}%`, `%${search}%`, limit, offset]
    );
  }
  return rawQuery(
    `SELECT id, name, full_name, website
     FROM institutions
     ORDER BY name
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

export async function getSeriesByInstitution(id, { limit = 50, offset = 0 } = {}) {
  return rawQuery(
    `SELECT s.id, ANY_VALUE(s.name) AS name,
       COUNT(DISTINCT l.id) AS lesson_count,
       ANY_VALUE(t.name) AS teacher_name,
       ANY_VALUE(t.id) AS teacher_id
     FROM series s
     JOIN lessons l ON l.series_id = s.id AND l.institution_id = ? AND l.approved = 1
     LEFT JOIN lessons_teachers lt ON lt.item_id = l.id AND lt.item_type = 1
     LEFT JOIN teachers t ON t.id = lt.teacher_id
     GROUP BY s.id
     ORDER BY ANY_VALUE(s.name)
     LIMIT ? OFFSET ?`,
    [id, limit, offset]
  );
}

export async function getLessonsByInstitution(id, { limit = 50, offset = 0 } = {}) {
  return rawQuery(
    `SELECT l.id, ANY_VALUE(l.name) AS name, ANY_VALUE(l.title) AS title,
       ANY_VALUE(l.date) AS date, ANY_VALUE(l.link) AS link,
       ANY_VALUE(l.has_audio) AS has_audio, ANY_VALUE(l.series_id) AS series_id,
       ANY_VALUE(s.name) AS series_name,
       ANY_VALUE(t.name) AS teacher_name,
       ANY_VALUE(t.id) AS teacher_id
     FROM lessons l
     LEFT JOIN series s ON s.id = l.series_id
     LEFT JOIN lessons_teachers lt ON lt.item_id = l.id AND lt.item_type = 1
     LEFT JOIN teachers t ON t.id = lt.teacher_id
     WHERE l.institution_id = ? AND l.approved = 1
     GROUP BY l.id
     ORDER BY l.date DESC, l.id DESC
     LIMIT ? OFFSET ?`,
    [id, limit, offset]
  );
}

export async function getInstitutionById(id) {
  const rows = await query(
    `SELECT i.id, i.name, i.full_name, i.website, i.address, i.phone,
       COUNT(DISTINCT l.id) AS lesson_count,
       COUNT(DISTINCT l.series_id) AS series_count
     FROM institutions i
     LEFT JOIN lessons l ON l.institution_id = i.id AND l.approved = 1
     WHERE i.id = ?
     GROUP BY i.id`,
    [id]
  );
  return rows[0] ?? null;
}
