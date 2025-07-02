import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { logger } from "../../shared/utils/logger";

// Database connection string
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:root@localhost:5432/renexus';

// Create postgres client
const client = postgres(connectionString, {
  max: 10, // Max number of connections
  idle_timeout: 20, // Idle connection timeout in seconds
  connect_timeout: 10, // Connect timeout in seconds
  onnotice: (notice) => {
    logger.info('Postgres notice:', notice);
  },
  onparameter: (parameterStatus) => {
    logger.debug('Postgres parameter status:', parameterStatus);
  },
});

// Create drizzle database instance
export const db = drizzle(client);

// Function to test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    // Execute a simple query to test connection
    await client`SELECT 1`;
    logger.info('Database connection successful');
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error });
    return false;
  }
}

