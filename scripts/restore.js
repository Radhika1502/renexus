/**
 * Database Restore Script
 * 
 * This script restores a database from a SQL backup file.
 * Usage: node scripts/restore.js --input=path/to/backup.sql
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
let inputFile = null;

args.forEach(arg => {
  if (arg.startsWith('--input=')) {
    inputFile = arg.split('=')[1];
  }
});

if (!inputFile) {
  console.error('Error: No input file specified. Use --input=path/to/backup.sql');
  process.exit(1);
}

// Check if the backup file exists
if (!fs.existsSync(inputFile)) {
  console.error(`Error: Backup file not found: ${inputFile}`);
  process.exit(1);
}

// Database connection details from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  database: process.env.DB_NAME || 'renexus',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

console.log(`Restoring database from backup: ${inputFile}`);

try {
  // For PostgreSQL
  if (process.env.DB_TYPE === 'postgres' || process.env.DB_TYPE === 'postgresql') {
    // First, drop and recreate the database to ensure a clean restore
    const dropCommand = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -c "DROP DATABASE IF EXISTS ${dbConfig.database};"`;
    const createCommand = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -c "CREATE DATABASE ${dbConfig.database};"`;
    const restoreCommand = `psql -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${inputFile}"`;
    
    // Set PGPASSWORD environment variable for password
    const env = { ...process.env, PGPASSWORD: dbConfig.password };
    
    execSync(dropCommand, { env });
    execSync(createCommand, { env });
    execSync(restoreCommand, { env });
  }
  // For MySQL/MariaDB
  else if (process.env.DB_TYPE === 'mysql' || process.env.DB_TYPE === 'mariadb') {
    const dropCommand = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p${dbConfig.password} -e "DROP DATABASE IF EXISTS ${dbConfig.database};"`;
    const createCommand = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p${dbConfig.password} -e "CREATE DATABASE ${dbConfig.database};"`;
    const restoreCommand = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.database} < "${inputFile}"`;
    
    execSync(dropCommand);
    execSync(createCommand);
    execSync(restoreCommand);
  }
  // For SQLite
  else if (process.env.DB_TYPE === 'sqlite') {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'renexus.db');
    
    // Backup the current database file
    if (fs.existsSync(dbPath)) {
      const backupPath = `${dbPath}.bak`;
      fs.copyFileSync(dbPath, backupPath);
      console.log(`Existing database backed up to: ${backupPath}`);
    }
    
    // Remove the current database file
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    
    // Restore from backup
    const restoreCommand = `sqlite3 "${dbPath}" < "${inputFile}"`;
    execSync(restoreCommand);
  }
  // Mock restore for testing
  else if (process.env.NODE_ENV === 'test') {
    console.log('Running in test mode - performing mock restore');
    
    // Read the backup file
    const backupContent = fs.readFileSync(inputFile, 'utf8');
    console.log(`Read ${backupContent.length} bytes from backup file`);
    
    // In a real implementation, this would parse the SQL and execute it
    // For testing, we'll just simulate a successful restore
    console.log('Mock restore completed successfully');
  }
  else {
    console.error('Unsupported database type. Set DB_TYPE in your environment variables.');
    process.exit(1);
  }
  
  console.log('Database restore completed successfully!');
} catch (error) {
  console.error('Database restore failed:', error.message);
  process.exit(1);
}
