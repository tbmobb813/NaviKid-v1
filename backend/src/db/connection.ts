import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { URL } from 'url';

type SafeSSL = {
  ca?: string;
  rejectUnauthorized?: boolean;
  servername?: string;
};

type PoolOptionsLike = Record<string, unknown> & {
  ssl?: SafeSSL | boolean;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  connectionString?: string;
};

let pool: Pool | null = null;

/**
 * Get or create PostgreSQL connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    const poolOptions: PoolOptionsLike = {
      connectionString: config.database.url,
      min: config.database.poolMin,
      max: config.database.poolMax,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    };

    // Wire DB CA file into ssl options when provided. Fall back to a permissive
    // ssl.rejectUnauthorized=false only when DB_SSL is enabled and reading the
    // CA file fails (keeps previous dev behavior).
    if (config.database.caPath) {
      try {
        const caFullPath = path.isAbsolute(config.database.caPath)
          ? config.database.caPath
          : path.join(process.cwd(), config.database.caPath);
        poolOptions.ssl = {
          ca: fs.readFileSync(caFullPath).toString(),
          rejectUnauthorized: true,
        };
      } catch (e) {
        logger.error(
          { e },
          `Failed to read DB_CA_PATH at ${config.database.caPath} — falling back to rejectUnauthorized:false`
        );
        poolOptions.ssl = config.database.ssl ? { rejectUnauthorized: false } : undefined;
      }
    } else {
      poolOptions.ssl = config.database.ssl ? { rejectUnauthorized: false } : undefined;
    }

    // IPv4 fallback: if a DATABASE_URL is provided but resolves to IPv6 only
    // and the host is unreachable, try to locate an A record using the
    // system resolver (`getent hosts`) and connect to that IPv4 address while
    // preserving TLS servername for certificate verification.
    if (config.database.url) {
      try {
        const parsed = new URL(config.database.url);
        const hostname = parsed.hostname;

        // Attempt to find an IPv4 address via getent (works on many Linux systems).
        try {
          const out = child_process.execSync(`getent hosts ${hostname}`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
          });
          const m = out.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
          if (m) {
            const ipv4 = m[1];
            // Use host/port/user/password/database fields instead of connectionString
            poolOptions.host = ipv4;
            poolOptions.port = parsed.port ? Number(parsed.port) : 5432;
            poolOptions.user = parsed.username
              ? decodeURIComponent(parsed.username)
              : undefined;
            poolOptions.password = parsed.password
              ? decodeURIComponent(parsed.password)
              : undefined;
            poolOptions.database = parsed.pathname
              ? parsed.pathname.replace(/\//, '')
              : undefined;

            // Ensure ssl.servername is set so TLS verification uses the original hostname
            if (!poolOptions.ssl)
              poolOptions.ssl = { rejectUnauthorized: false } as SafeSSL;
            const ssl = poolOptions.ssl as SafeSSL;
            ssl.servername = hostname;
            // Remove connectionString so pg uses the explicit host instead
            delete poolOptions.connectionString;
            logger.info(
              { host: ipv4 },
              `Using IPv4 fallback for database host ${hostname}`
            );
          }
        } catch {
          // ignore failure to find IPv4 via getent — we'll fall back to connectionString
        }
      } catch {
        // ignore URL parsing errors
      }
    }

    pool = new Pool(poolOptions);

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
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
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
