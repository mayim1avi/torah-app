import { query, rawQuery } from './connection.js';

export async function upsertProgress(userId, lessonId, positionMs, durationMs) {
  const completed = durationMs > 0 && positionMs / durationMs >= 0.9 ? 1 : 0;
  await query(
    `INSERT INTO user_progress (user_id, lesson_id, position_ms, duration_ms, completed, last_played_at)
     VALUES (?, ?, ?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       position_ms = VALUES(position_ms),
       duration_ms = VALUES(duration_ms),
       completed = VALUES(completed),
       last_played_at = NOW()`,
    [userId, lessonId, positionMs, durationMs, completed]
  );
}

export async function getProgress(userId, lessonId) {
  const rows = await query(
    'SELECT position_ms, duration_ms, completed FROM user_progress WHERE user_id = ? AND lesson_id = ? LIMIT 1',
    [userId, lessonId]
  );
  return rows[0] ?? null;
}

export async function getHistory(userId, { limit = 30 } = {}) {
  return rawQuery(
    `SELECT
       l.id, ANY_VALUE(l.title) AS title, ANY_VALUE(l.name) AS name,
       ANY_VALUE(l.link) AS link,
       ANY_VALUE(l.has_audio) AS has_audio,
       ANY_VALUE(l.series_id) AS series_id,
       ANY_VALUE(i.name) AS institution_name,
       ANY_VALUE(t.id) AS teacher_id,
       ANY_VALUE(t.name) AS teacher_name,
       up.position_ms, up.duration_ms, up.completed, up.last_played_at
     FROM user_progress up
     JOIN lessons l ON l.id = up.lesson_id AND l.approved = 1
     LEFT JOIN institutions i ON i.id = l.institution_id
     LEFT JOIN lessons_teachers lt ON lt.item_id = l.id AND lt.item_type = 1
     LEFT JOIN teachers t ON t.id = lt.teacher_id
     WHERE up.user_id = ?
     GROUP BY l.id, up.position_ms, up.duration_ms, up.completed, up.last_played_at
     ORDER BY up.last_played_at DESC
     LIMIT ?`,
    [userId, limit]
  );
}
