import mysql from 'mysql2/promise';
import 'dotenv/config';

let pool = null;

export function getPool() {
  if (pool) return pool;
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 9030,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'torha',
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
  });
  return pool;
}

/** Prepared statement — use for fixed-shape queries */
export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

/** Non-prepared query — use when SQL shape varies (dynamic filters, LIMIT/OFFSET as params) */
export async function rawQuery(sql, params = []) {
  const [rows] = await getPool().query(sql, params);
  return rows;
}
