import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import config from '../config';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { URL } from 'url';

class Database {
  private pool: Pool;
  private poolOptions: any;
  private static instance: Database;

  private constructor() {
    // Prefer a full DATABASE_URL when available; fall back to individual fields for backwards compatibility
    const poolOptions: any = {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    if (config.database.url) {
      poolOptions.connectionString = config.database.url;
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
          poolOptions.ssl = config.database.ssl
            ? { rejectUnauthorized: false }
            : undefined;
        }
      } else {
        poolOptions.ssl = config.database.ssl ? { rejectUnauthorized: false } : undefined;
      }

      // IPv4 fallback: try to resolve an A record for the DB hostname using
      // the system resolver and prefer connecting to the IPv4 address while
      // preserving TLS servername for verification.
      try {
        const parsed = new URL(config.database.url);
        const hostname = parsed.hostname;
        try {
          const out = child_process.execSync(`getent hosts ${hostname}`, {
            encoding: 'utf8',
            stdio: ['pipe', 'pipe', 'ignore'],
          });
          const m = out.match(/(\d{1,3}(?:\.\d{1,3}){3})/);
          if (m) {
            const ipv4 = m[1];
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
            if (!poolOptions.ssl) poolOptions.ssl = { rejectUnauthorized: false };
            poolOptions.ssl.servername = hostname;
            delete poolOptions.connectionString;
            logger.info(
              { host: ipv4 },
              `Using IPv4 fallback for database host ${hostname}`
            );
          }
        } catch {
          // ignore failures — keep using connectionString
        }
      } catch {
        // ignore URL parse errors
      }
    } else {
      poolOptions.host = config.database.host;
      poolOptions.port = config.database.port;
      poolOptions.database = config.database.name;
      poolOptions.user = config.database.user;
      poolOptions.password = config.database.password;
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
          poolOptions.ssl = config.database.ssl
            ? { rejectUnauthorized: false }
            : undefined;
        }
      } else {
        poolOptions.ssl = config.database.ssl ? { rejectUnauthorized: false } : undefined;
      }
    }

    this.poolOptions = poolOptions;
    this.pool = new Pool(this.poolOptions);

    this.pool.on('error', (err) => {
      logger.error({ error: err }, 'Unexpected database pool error');
    });

    this.pool.on('connect', () => {
      logger.debug('New database connection established');
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      logger.debug({ text, duration, rows: result.rowCount }, 'Query executed');
      return result;
    } catch (error) {
      // If the server reports it does not support SSL, retry once with SSL disabled.
      const msg = (error as any)?.message || String(error);
      if (typeof msg === 'string' && msg.includes('does not support SSL')) {
        logger.info(
          { text },
          'Database reported no-SSL support; retrying query with SSL disabled'
        );
        try {
          // recreate pool without ssl and retry
          this.pool = new Pool({ ...this.poolOptions, ssl: false });
          this.pool.on('error', (err) => {
            logger.error({ error: err }, 'Unexpected database pool error');
          });
          this.pool.on('connect', () => {
            logger.debug('New database connection established (no-ssl fallback)');
          });
          const retryResult = await this.pool.query<T>(text, params);
          const duration = Date.now() - start;
          logger.debug(
            { text, duration, rows: retryResult.rowCount },
            'Query executed (no-ssl fallback)'
          );
          return retryResult;
        } catch (e2) {
          logger.error({ text, error: e2 }, 'Query error after no-ssl fallback');
          throw e2;
        }
      }

      logger.error({ text, error }, 'Query error');
      throw error;
    }
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error({ error }, 'Transaction rolled back');
      throw error;
    } finally {
      client.release();
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error({ error }, 'Database health check failed');
      return false;
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database pool closed');
  }
}

export default Database.getInstance();
