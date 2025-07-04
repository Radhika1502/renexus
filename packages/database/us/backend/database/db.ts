import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/unified_schema';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection configuration
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/renexus';

// Create connection pool
export const pool = new Pool({
  connectionString,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
});

// Initialize Drizzle with the connection and schema
export const db = drizzle(pool, { schema });

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  console.log('Database pool has ended');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  console.log('Database pool has ended');
  process.exit(0);
});
