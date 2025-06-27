import { runMigrations } from '../migrations/0001_initial_schema';
import { logger } from '../utils/logger';

/**
 * Script to run database migrations
 */
async function main() {
  try {
    logger.info('Starting database migration process');
    await runMigrations();
    logger.info('Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database migration failed', { error });
    process.exit(1);
  }
}

main();
