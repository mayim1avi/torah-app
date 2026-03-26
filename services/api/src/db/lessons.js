import { query } from './connection.js';

export async function getLessonById(id) {
  const rows = await query(
    `SELECT
       l.id, l.title, l.name, l.description, l.link, l.link_location,
       l.series_id, l.institution_id, l.date, l.has_audio, l.transcript,
       l.\`order\`,
       i.name AS institution_name, i.full_name AS institution_full_name,
       t.id AS teacher_id, t.name AS teacher_name,
       t.honorific AS teacher_honorific, t.en_name AS teacher_en_name,
       s.name AS series_name
     FROM lessons l
     LEFT JOIN institutions i ON i.id = l.institution_id
     LEFT JOIN lessons_teachers lt ON lt.item_id = l.id AND lt.item_type = 1
     LEFT JOIN teachers t ON t.id = lt.teacher_id
     LEFT JOIN series s ON s.id = l.series_id
     WHERE l.id = ? AND l.approved = 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getCategoriesByLesson(lessonId) {
  return query(
    `SELECT c.id, c.name
     FROM categories c
     JOIN lessons_categories lc ON lc.category_id = c.id AND lc.item_id = ? AND lc.item_type = 1
     ORDER BY c.id`,
    [lessonId]
  );
}
