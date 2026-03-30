import { query, rawQuery } from './connection.js';

export async function getAllTeachers({ search = '', limit = 200, offset = 0 } = {}) {
  if (search) {
    return rawQuery(
      `SELECT id, name, en_name, honorific, gender
       FROM teachers
       WHERE name LIKE ? OR en_name LIKE ?
       ORDER BY name
       LIMIT ? OFFSET ?`,
      [`%${search}%`, `%${search}%`, limit, offset]
    );
  }
  return rawQuery(
    `SELECT id, name, en_name, honorific, gender
     FROM teachers
     ORDER BY name
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

export async function getLessonsByTeacher(id, { limit = 50, offset = 0 } = {}) {
  return rawQuery(
    `SELECT l.id, ANY_VALUE(l.name) AS name, ANY_VALUE(l.title) AS title,
       ANY_VALUE(l.date) AS date, ANY_VALUE(l.link) AS link,
       ANY_VALUE(l.has_audio) AS has_audio, ANY_VALUE(l.series_id) AS series_id,
       ANY_VALUE(s.name) AS series_name,
       ANY_VALUE(t.id) AS teacher_id,
       ANY_VALUE(t.name) AS teacher_name,
       ANY_VALUE(i.name) AS institution_name
     FROM lessons l
     JOIN lessons_teachers lt ON lt.item_id = l.id AND lt.item_type = 1
     JOIN teachers t ON t.id = lt.teacher_id
     LEFT JOIN series s ON s.id = l.series_id
     LEFT JOIN institutions i ON i.id = l.institution_id
     WHERE lt.teacher_id = ? AND l.approved = 1
     GROUP BY l.id
     ORDER BY l.date DESC, l.id DESC
     LIMIT ? OFFSET ?`,
    [id, limit, offset]
  );
}

export async function getTeacherById(id) {
  const rows = await query(
    `SELECT t.id, t.name, t.en_name, t.description, t.image, t.honorific, t.gender,
       COUNT(DISTINCT l.id) AS lesson_count,
       COUNT(DISTINCT l.series_id) AS series_count
     FROM teachers t
     LEFT JOIN lessons_teachers lt ON lt.teacher_id = t.id AND lt.item_type = 1
     LEFT JOIN lessons l ON l.id = lt.item_id AND l.approved = 1
     WHERE t.id = ?
     GROUP BY t.id`,
    [id]
  );
  return rows[0] ?? null;
}
