import db from '../database';
import logger from '../utils/logger';

/**
 * Simple Postgres-backed session store used when Redis is disabled.
 * Methods mirror the subset of Redis usage in the app.
 */
export async function setSession(
  userId: string,
  token: string,
  expiresIn: number,
  data: unknown = {}
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    const sql = `
      INSERT INTO sessions (user_id, token, data, expires_at, created_at)
      VALUES ($1, $2, $3::jsonb, $4, now())
      ON CONFLICT (user_id, token) DO UPDATE
      SET data = EXCLUDED.data, expires_at = EXCLUDED.expires_at
    `;
    await db.query(sql, [userId, token, JSON.stringify(data), expiresAt]);
  } catch (error) {
    logger.error({ error }, 'sessionStore.setSession error');
    throw error;
  }
}

export async function getSession(userId: string, token: string): Promise<unknown | null> {
  try {
    const sql = `SELECT data, expires_at FROM sessions WHERE user_id=$1 AND token=$2 LIMIT 1`;
    const res = await db.query(sql, [userId, token]);
    if (!res.rowCount) return null;
    const row = res.rows[0];
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      await db.query('DELETE FROM sessions WHERE user_id=$1 AND token=$2', [
        userId,
        token,
      ]);
      return null;
    }
  return row.data;
  } catch (error) {
    logger.error({ error }, 'sessionStore.getSession error');
    return null;
  }
}

export async function deleteSession(userId: string, token: string): Promise<void> {
  try {
    await db.query('DELETE FROM sessions WHERE user_id=$1 AND token=$2', [userId, token]);
  } catch (error) {
    logger.error({ error }, 'sessionStore.deleteSession error');
  }
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  try {
    await db.query('DELETE FROM sessions WHERE user_id=$1', [userId]);
  } catch (error) {
    logger.error({ error }, 'sessionStore.deleteAllUserSessions error');
  }
}

// Minimal cache-like fallbacks (no-op or simple DB-backed implementations could be added)
export async function get(_key: string): Promise<unknown | null> {
  return null;
}

export async function set(_key: string, _value: unknown, _expiresIn?: number): Promise<void> {
  // no-op
}

export async function deleteKey(_key: string): Promise<void> {
  // no-op
}

export async function exists(_key: string): Promise<boolean> {
  return false;
}

export async function healthCheck(): Promise<boolean> {
  // Use DB health check
  try {
    await db.healthCheck();
    return true;
  } catch (e) {
    logger.error({ e }, 'sessionStore.healthCheck failed');
    return false;
  }
}

export async function close(): Promise<void> {
  // nothing to close here
}

export default {
  setSession,
  getSession,
  deleteSession,
  deleteAllUserSessions,
  get,
  set,
  delete: deleteKey,
  exists,
  healthCheck,
  close,
};
