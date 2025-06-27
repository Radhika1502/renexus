/**
 * Database Backup Script
 * 
 * This script creates a backup of the database in SQL format.
 * Usage: node scripts/backup.js --output=path/to/backup.sql
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = process.argv.slice(2);
let outputFile = null;

args.forEach(arg => {
  if (arg.startsWith('--output=')) {
    outputFile = arg.split('=')[1];
  }
});

if (!outputFile) {
  // Default backup file name with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  outputFile = path.join(__dirname, '..', 'backups', `backup-${timestamp}.sql`);
}

// Ensure the backups directory exists
const backupDir = path.dirname(outputFile);
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Database connection details from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  database: process.env.DB_NAME || 'renexus',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres'
};

console.log(`Creating backup at: ${outputFile}`);

try {
  // For PostgreSQL
  if (process.env.DB_TYPE === 'postgres' || process.env.DB_TYPE === 'postgresql') {
    const command = `pg_dump -h ${dbConfig.host} -p ${dbConfig.port} -U ${dbConfig.user} -d ${dbConfig.database} -f "${outputFile}"`;
    
    // Set PGPASSWORD environment variable for password
    const env = { ...process.env, PGPASSWORD: dbConfig.password };
    
    execSync(command, { env });
  }
  // For MySQL/MariaDB
  else if (process.env.DB_TYPE === 'mysql' || process.env.DB_TYPE === 'mariadb') {
    const command = `mysqldump -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.database} > "${outputFile}"`;
    
    execSync(command);
  }
  // For SQLite
  else if (process.env.DB_TYPE === 'sqlite') {
    const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'database', 'renexus.db');
    const command = `sqlite3 "${dbPath}" .dump > "${outputFile}"`;
    
    execSync(command);
  }
  // Mock backup for testing
  else if (process.env.NODE_ENV === 'test') {
    // Create a mock backup file with table structure and sample data
    const mockBackup = `
-- Mock backup for testing purposes
-- Generated at ${new Date().toISOString()}

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects_Users table
CREATE TABLE IF NOT EXISTS projects_users (
  project_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Sample data for testing
INSERT INTO users (id, email, first_name, last_name, password_hash, created_at, updated_at)
VALUES ('test-user-id', 'test@example.com', 'Test', 'User', 'hash', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO projects (id, name, description, created_at, updated_at)
VALUES ('test-project-id', 'Test Project', 'Test project description', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO projects_users (project_id, user_id, role, created_at, updated_at)
VALUES ('test-project-id', 'test-user-id', 'owner', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
`;
    
    fs.writeFileSync(outputFile, mockBackup);
  }
  else {
    console.error('Unsupported database type. Set DB_TYPE in your environment variables.');
    process.exit(1);
  }
  
  console.log('Backup completed successfully!');
  console.log(`Backup saved to: ${outputFile}`);
} catch (error) {
  console.error('Backup failed:', error.message);
  process.exit(1);
}
