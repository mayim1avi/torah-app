import { query, rawQuery } from './connection.js';

export async function getSavedLessons(userId) {
  return query(
    `SELECT
       l.id, ANY_VALUE(l.title) AS title, ANY_VALUE(l.name) AS name,
       ANY_VALUE(l.link) AS link,
       ANY_VALUE(l.date) AS date, ANY_VALUE(l.has_audio) AS has_audio,
       ANY_VALUE(l.series_id) AS series_id,
       ANY_VALUE(i.name) AS institution_name,
       ANY_VALUE(t.id) AS teacher_id,
       ANY_VALUE(t.name) AS teacher_name,
       ul.created_at AS saved_at,
       up.position_ms, up.duration_ms, up.completed
     FROM user_library ul
     JOIN lessons l ON l.id = ul.lesson_id
     LEFT JOIN institutions i ON i.id = l.institution_id
     LEFT JOIN lessons_teachers lt ON lt.item_id = l.id AND lt.item_type = 1
     LEFT JOIN teachers t ON t.id = lt.teacher_id
     LEFT JOIN user_progress up ON up.lesson_id = l.id AND up.user_id = ul.user_id
     WHERE ul.user_id = ? AND l.approved = 1
     GROUP BY l.id, ul.created_at, up.position_ms, up.duration_ms, up.completed
     ORDER BY ul.created_at DESC`,
    [userId]
  );
}

export async function isLessonSaved(userId, lessonId) {
  const rows = await query(
    'SELECT id FROM user_library WHERE user_id = ? AND lesson_id = ? LIMIT 1',
    [userId, lessonId]
  );
  return rows.length > 0;
}

export async function saveLesson(userId, lessonId) {
  await query(
    'INSERT IGNORE INTO user_library (user_id, lesson_id) VALUES (?, ?)',
    [userId, lessonId]
  );
}

export async function unsaveLesson(userId, lessonId) {
  await query(
    'DELETE FROM user_library WHERE user_id = ? AND lesson_id = ?',
    [userId, lessonId]
  );
}

export async function saveLessonsBatch(userId, lessonIds) {
  if (!lessonIds.length) return;
  const placeholders = lessonIds.map(() => '(?, ?)').join(', ');
  await query(
    `INSERT IGNORE INTO user_library (user_id, lesson_id) VALUES ${placeholders}`,
    lessonIds.flatMap((id) => [userId, id])
  );
}
