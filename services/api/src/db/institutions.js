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
