#!/usr/bin/env node

/**
 * Database Migration Runner Script
 * 
 * This script executes all database migrations in the migrations directory
 * using Drizzle ORM. It connects to the database specified in the .env file
 * and applies all pending migrations.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Validate environment variables
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set');
  console.error('Please create a .env file with DATABASE_URL=your_postgres_connection_string');
  process.exit(1);
}

// Paths
const ROOT_DIR = path.resolve(__dirname, '..');
const MIGRATIONS_DIR = path.join(ROOT_DIR, 'database', 'migrations');

// Check if migrations directory exists
if (!fs.existsSync(MIGRATIONS_DIR)) {
  console.error(`Error: Migrations directory not found at ${MIGRATIONS_DIR}`);
  process.exit(1);
}

// Check if there are migration files
const migrationFiles = fs.readdirSync(MIGRATIONS_DIR).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
if (migrationFiles.length === 0) {
  console.error('No migration files found. Please create migration files in the migrations directory.');
  process.exit(1);
}

console.log('Starting database migration process...');
console.log(`Found ${migrationFiles.length} migration files`);

try {
  // Run the migrate.ts script using ts-node
  console.log('Executing migrations...');
  execSync('npx ts-node database/migrate.ts', { 
    stdio: 'inherit',
    cwd: ROOT_DIR
  });
  
  console.log('\n✅ Database migrations completed successfully!');
  console.log('The following migrations were applied:');
  migrationFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
  
} catch (error) {
  console.error('\n❌ Migration failed with the following error:');
  console.error(error.message);
  process.exit(1);
}

console.log('\nNext steps:');
console.log('1. Verify the database schema using a database client');
console.log('2. Run the API server with: npm start');
console.log('3. Test the API endpoints using the provided integration tests');
