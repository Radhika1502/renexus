/**
 * Database Migration Runner Script
 * 
 * This script runs database migrations from the migrations directory.
 * Usage: node scripts/migrate.js [--rollback] [--steps=N]
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { db } = require('../database/db');

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
let isRollback = false;
let steps = Infinity;

args.forEach(arg => {
  if (arg === '--rollback') {
    isRollback = true;
  } else if (arg.startsWith('--steps=')) {
    steps = parseInt(arg.split('=')[1], 10);
    if (isNaN(steps)) {
      steps = Infinity;
    }
  }
});

// Migration directory
const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');

// Migration tracking table
async function ensureMigrationsTable() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// Get applied migrations from database
async function getAppliedMigrations() {
  const result = await db.execute('SELECT name FROM migrations ORDER BY id ASC');
  return result.rows.map(row => row.name);
}

// Get all migration files
function getMigrationFiles() {
  return fs.readdirSync(migrationsDir)
    .filter(file => file.match(/^\d{14}_.*\.(js|ts)$/))
    .sort();
}

// Run migrations
async function runMigrations() {
  await ensureMigrationsTable();
  
  const appliedMigrations = await getAppliedMigrations();
  const migrationFiles = getMigrationFiles();
  
  if (isRollback) {
    // Rollback migrations
    console.log('Rolling back migrations...');
    
    // Get migrations to rollback
    const migrationsToRollback = appliedMigrations
      .slice(-Math.min(steps, appliedMigrations.length))
      .reverse();
    
    for (const migrationName of migrationsToRollback) {
      console.log(`Rolling back: ${migrationName}`);
      
      const migrationFile = migrationFiles.find(file => file === migrationName);
      if (!migrationFile) {
        console.error(`Error: Migration file not found for ${migrationName}`);
        continue;
      }
      
      const migrationPath = path.join(migrationsDir, migrationFile);
      const migration = require(migrationPath);
      
      if (typeof migration.down !== 'function') {
        console.error(`Error: Migration ${migrationName} does not have a down function`);
        continue;
      }
      
      try {
        await migration.down(db);
        await db.execute('DELETE FROM migrations WHERE name = $1', [migrationName]);
        console.log(`Rolled back: ${migrationName}`);
      } catch (error) {
        console.error(`Error rolling back migration ${migrationName}:`, error);
        process.exit(1);
      }
    }
    
    console.log('Rollback completed!');
  } else {
    // Apply migrations
    console.log('Applying migrations...');
    
    // Get migrations to apply
    const migrationsToApply = migrationFiles.filter(file => !appliedMigrations.includes(file));
    
    if (migrationsToApply.length === 0) {
      console.log('No migrations to apply. Database is up to date.');
      return;
    }
    
    // Apply only the specified number of steps
    const limitedMigrations = migrationsToApply.slice(0, steps);
    
    for (const migrationFile of limitedMigrations) {
      console.log(`Applying: ${migrationFile}`);
      
      const migrationPath = path.join(migrationsDir, migrationFile);
      const migration = require(migrationPath);
      
      if (typeof migration.up !== 'function') {
        console.error(`Error: Migration ${migrationFile} does not have an up function`);
        continue;
      }
      
      try {
        await migration.up(db);
        await db.execute('INSERT INTO migrations (name) VALUES ($1)', [migrationFile]);
        console.log(`Applied: ${migrationFile}`);
      } catch (error) {
        console.error(`Error applying migration ${migrationFile}:`, error);
        process.exit(1);
      }
    }
    
    console.log('Migrations completed!');
  }
}

// Run the migrations
runMigrations()
  .then(() => {
    console.log('Migration process finished successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration process failed:', error);
    process.exit(1);
  });
