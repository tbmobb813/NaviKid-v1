import path from 'path';
import fs from 'fs';
import { query } from './connection';
import { logger } from '../utils/logger';

async function runSeeds(): Promise<void> {
  const seedsDir = path.join(__dirname, '..', 'database', 'seeds');
  if (!fs.existsSync(seedsDir)) {
    logger.info('No seeds directory found, skipping seeding');
    return;
  }

  const files = fs.readdirSync(seedsDir).filter((f) => f.endsWith('.sql'));
  if (!files.length) {
    logger.info('No seed files found, skipping');
    return;
  }

  logger.info({ count: files.length }, 'Running database seeds');

  for (const file of files.sort()) {
    const filePath = path.join(seedsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    try {
      await query(sql);
      logger.info({ seed: file }, 'Seed executed');
    } catch (err) {
      logger.error({ err, seed: file }, 'Seed failed');
      throw err;
    }
  }

  logger.info('All seeds executed successfully');
}

(async () => {
  try {
    await runSeeds();
    process.exit(0);
  } catch (e) {
    logger.error({ e }, 'Seeding failed');
    process.exit(1);
  }
})();
