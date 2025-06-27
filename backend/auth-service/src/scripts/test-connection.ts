import { testDatabaseConnection } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Script to test database connection
 */
async function main() {
  try {
    logger.info('Testing database connection...');
    const isConnected = await testDatabaseConnection();
    
    if (isConnected) {
      logger.info('Database connection successful');
    } else {
      logger.error('Database connection failed');
    }
    
    process.exit(isConnected ? 0 : 1);
  } catch (error) {
    logger.error('Error testing database connection', { error });
    process.exit(1);
  }
}

main();
