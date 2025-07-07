import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { tasks } from './schema/tasks';
import { projects } from './schema/projects';
import { users } from './schema/users';
import { sessions } from './schema/sessions';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection configuration
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/renexus';

// Create connection pool
const pool = new Pool({
  connectionString,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000,
});

// Initialize Drizzle with the connection and schema
export const db = drizzle(pool, {
  schema: {
    tasks,
    projects,
    users,
    sessions
  },
});

// Export types
export type Database = typeof db;
export type Task = typeof tasks.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;

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
