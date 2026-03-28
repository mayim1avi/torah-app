import { query } from './connection.js';

function numberToHebrew(n) {
  if (n <= 0) return '';
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  let result = '';
  while (n >= 400) { result += 'ת'; n -= 400; }
  if (n >= 300) { result += 'ש'; n -= 300; }
  if (n >= 200) { result += 'ר'; n -= 200; }
  if (n >= 100) { result += 'ק'; n -= 100; }
  if (n === 15) return result + 'טו';
  if (n === 16) return result + 'טז';
  if (n >= 10) { result += tens[Math.floor(n / 10)]; n %= 10; }
  result += ones[n];
  return result;
}

export function generateVirtualChildren(category) {
  const count = category.subcategory_nmber;
  if (!count || count <= 0) return [];
  const isType2 = category.subcategory_type_id === 2;
  const isType3 = category.subcategory_type_id === 3;
  const virtual = [];
  for (let i = 1; i <= count; i++) {
    let name;
    if (isType2) {
      const hebrewNum = numberToHebrew(Math.ceil(i / 2));
      name = hebrewNum + (i % 2 === 1 ? '.' : ':');
    } else if (isType3) {
      name = String(i);
    } else {
      name = numberToHebrew(i);
    }
    virtual.push({ id: `${category.id}_${i}`, name, parent: category.id, virtual: true });
  }
  return virtual;
}

const CAT_SELECT = `SELECT id, name, parent, subcategory_nmber, subcategory_type_id,
  (SELECT COUNT(*) FROM categories c2 WHERE c2.parent = c.id) AS child_count,
  (SELECT COUNT(DISTINCT lc.item_id) FROM lessons_categories lc WHERE lc.category_id = c.id AND lc.item_type = 1) AS lesson_count`;

export async function getRootCategories() {
  return query(`${CAT_SELECT} FROM categories c WHERE parent IS NULL ORDER BY id`);
}

export async function getCategoryById(id) {
  const rows = await query(`${CAT_SELECT} FROM categories c WHERE id = ?`, [id]);
  return rows[0] ?? null;
}

export async function getChildren(parentId) {
  return query(`${CAT_SELECT} FROM categories c WHERE parent = ? ORDER BY id`, [parentId]);
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

  // Remove the current category itself — breadcrumb shows it separately
  ancestors.pop();
  return ancestors;
}
