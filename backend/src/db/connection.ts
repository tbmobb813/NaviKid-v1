import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

/**
 * Get or create PostgreSQL connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: config.database.url,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : undefined,
      min: config.database.poolMin,
      max: config.database.poolMax,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected database pool error');
    });

    pool.on('connect', () => {
      logger.debug('New database connection established');
    });

    pool.on('remove', () => {
      logger.debug('Database connection removed from pool');
    });

    logger.info('Database connection pool created');
  }

  return pool;
}

/**
 * Execute a query with automatic connection management
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    logger.debug(
      {
        query: text.substring(0, 100),
        duration,
        rows: result.rowCount,
      },
      'Query executed'
    );

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(
      {
        error,
        query: text.substring(0, 100),
        duration,
      },
      'Query error'
    );
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}

/**
 * Execute a function within a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Check database connectivity
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as now');
    logger.info({ serverTime: result.rows[0].now }, 'Database connection verified');
    return true;
  } catch (error) {
    logger.error({ error }, 'Database connection check failed');
    return false;
  }
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection pool closed');
  }
}

/**
 * Run database migrations
 */
export async function runMigrations(): Promise<void> {
  const fs = require('fs');
  const path = require('path');

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f: string) => f.endsWith('.sql'));

  logger.info({ count: files.length }, 'Running database migrations');

  for (const file of files.sort()) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      await query(sql);
      logger.info({ migration: file }, 'Migration completed');
    } catch (error) {
      logger.error({ error, migration: file }, 'Migration failed');
      throw error;
    }
  }

  logger.info('All migrations completed successfully');
}
