import { query, rawQuery } from './connection.js';
import bcrypt from 'bcryptjs';

export async function findUserByEmail(email) {
  const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] ?? null;
}

export async function findUserById(id) {
  const rows = await query(
    'SELECT id, name, email, created_at FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] ?? null;
}

export async function createUser({ name, email, password }) {
  const hash = await bcrypt.hash(password, 10);
  const result = await query(
    'INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
    [name, email, hash]
  );
  return { id: result.insertId, name, email };
}

export async function verifyPassword(plaintext, hash) {
  return bcrypt.compare(plaintext, hash);
}
