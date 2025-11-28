import fs from 'fs';
import path from 'path';
import db from '../database';
import logger from '../utils/logger';

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');

    // Create migrations table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get list of migration files. Prefer compiled `dist` location when running
    // from the built distribution, but fall back to the source `src/...` path
    // which is present during development and Docker builds that copy source.
    const candidates = [
      path.join(__dirname, '../database/migrations'),
      path.join(process.cwd(), 'src', 'database', 'migrations'),
    ];

    let migrationsDir: string | null = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        migrationsDir = c;
        break;
      }
    }

    if (!migrationsDir) {
      throw new Error(
        `Migrations directory not found. Checked: ${candidates.join(', ')}`
      );
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      // Check if migration already executed
      const { rows } = await db.query('SELECT id FROM migrations WHERE name = $1', [
        file,
      ]);

      if (rows.length > 0) {
        logger.info({ migration: file }, 'Migration already executed, skipping');
        continue;
      }

      // Read and execute migration
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      logger.info({ migration: file }, 'Executing migration');
      await db.query(sql);

      // Record migration
      await db.query('INSERT INTO migrations (name) VALUES ($1)', [file]);

      logger.info({ migration: file }, 'Migration completed successfully');
    }

    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Migration failed');
    process.exit(1);
  }
}

runMigrations();
