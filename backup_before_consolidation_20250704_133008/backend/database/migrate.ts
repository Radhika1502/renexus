import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const runMigrations = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  try {
    console.log('Starting database migrations...');
    
    // Create a Postgres client
    const client = postgres(databaseUrl, { max: 1 });
    const db = drizzle(client);
    
    // Get migration directory
    const migrationsDir = path.join(__dirname, 'migrations');
    
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Migrations directory not found: ${migrationsDir}`);
      process.exit(1);
    }
    
    // Run migrations
    await migrate(db, { migrationsFolder: migrationsDir });
    
    console.log('Migrations completed successfully');
    
    // Close the database connection
    await client.end();
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

runMigrations();
