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

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../database/migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      // Check if migration already executed
      const { rows } = await db.query(
        'SELECT id FROM migrations WHERE name = $1',
        [file]
      );

      if (rows.length > 0) {
        logger.info(`Migration ${file} already executed, skipping...`);
        continue;
      }

      // Read and execute migration
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      logger.info(`Executing migration: ${file}`);
      await db.query(sql);

      // Record migration
      await db.query('INSERT INTO migrations (name) VALUES ($1)', [file]);

      logger.info(`Migration ${file} completed successfully`);
    }

    logger.info('All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ error  }, 'Migration failed');
    process.exit(1);
  }
}

runMigrations();
