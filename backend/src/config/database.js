import mysql from 'mysql2/promise';

let pool = null;

export function getPool() {
  if (!pool) {
    const user = String(process.env.DB_USER || '').trim();
    if (!user) {
      throw new Error('DB_USER must be set (e.g. in backend/.env)');
    }
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user,
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME || 'event_tickets',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
    });
  }
  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
