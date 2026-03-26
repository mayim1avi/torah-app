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
