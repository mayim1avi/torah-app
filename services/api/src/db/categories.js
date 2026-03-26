import { query } from './connection.js';

export async function getRootCategories() {
  return query(
    `SELECT id, name, parent,
       (SELECT COUNT(*) FROM categories c2 WHERE c2.parent = c.id) AS child_count,
       (SELECT COUNT(DISTINCT lc.item_id) FROM lessons_categories lc WHERE lc.category_id = c.id AND lc.item_type = 1) AS lesson_count
     FROM categories c
     WHERE parent IS NULL
     ORDER BY id`
  );
}

export async function getCategoryById(id) {
  const rows = await query(
    `SELECT id, name, parent,
       (SELECT COUNT(*) FROM categories c2 WHERE c2.parent = c.id) AS child_count,
       (SELECT COUNT(DISTINCT lc.item_id) FROM lessons_categories lc WHERE lc.category_id = c.id AND lc.item_type = 1) AS lesson_count
     FROM categories c
     WHERE id = ?`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getChildren(parentId) {
  return query(
    `SELECT id, name, parent,
       (SELECT COUNT(*) FROM categories c2 WHERE c2.parent = c.id) AS child_count,
       (SELECT COUNT(DISTINCT lc.item_id) FROM lessons_categories lc WHERE lc.category_id = c.id AND lc.item_type = 1) AS lesson_count
     FROM categories c
     WHERE parent = ?
     ORDER BY id`,
    [parentId]
  );
}

/** Walk up the parent chain to build breadcrumb ancestors array (root → current) */
export async function getAncestors(categoryId) {
  const ancestors = [];
  let currentId = categoryId;

  while (currentId != null) {
    const rows = await query(
      'SELECT id, name, parent FROM categories WHERE id = ?',
      [currentId]
    );
    if (!rows[0]) break;
    ancestors.unshift(rows[0]);
    currentId = rows[0].parent;
  }

  return ancestors;
}
