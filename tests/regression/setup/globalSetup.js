/**
 * Global Setup for Regression Tests
 * Phase 5.2.3 - Regression Testing
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');

// Convert exec to Promise-based
const execPromise = util.promisify(exec);

/**
 * Setup function to initialize the test environment
 * before running regression tests
 */
module.exports = async function globalSetup() {
  console.log('🔧 Setting up regression test environment...');
  
  try {
    // Start MongoDB memory server for regression tests
    const mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'renexus_regression',
      }
    });
    
    // Store MongoDB URI in global for later use
    process.env.MONGODB_URI = mongoServer.getUri();
    global.__MONGO_URI__ = mongoServer.getUri();
    global.__MONGO_SERVER__ = mongoServer;
    
    console.log(`✓ MongoDB Memory Server started at ${mongoServer.getUri()}`);

    // Setup SQL test database schema for regression tests
    console.log('🔧 Setting up SQL test schema...');
    
    // Set up environment variables for testing
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgres://postgres:postgres@localhost:5432/renexus_regression';
    process.env.JWT_SECRET = 'regression-test-jwt-secret';
    process.env.REFRESH_TOKEN_SECRET = 'regression-test-refresh-secret';
    process.env.PORT = '9001'; // Use different port than integration tests
    
    // Create clean database schema
    try {
      await execPromise('npm run db:reset:regression');
      console.log('✓ Database schema created successfully');
    } catch (error) {
      console.log('Failed to create database schema, attempting to continue...');
      console.error(error);
    }
    
    // Seed regression test data
    try {
      console.log('🔧 Seeding test data...');
      const seedSqlPath = path.join(__dirname, '..', '..', 'regression', 'fixtures', 'seed-regression-data.sql');
      
      if (fs.existsSync(seedSqlPath)) {
        await execPromise(`psql ${process.env.DATABASE_URL} -f ${seedSqlPath}`);
        console.log('✓ Test data seeded successfully');
      } else {
        console.warn('⚠️ Seed SQL file not found, skipping data seeding');
      }
    } catch (error) {
      console.error('Failed to seed test data:', error);
    }
    
    // Track regression test start time
    global.__REGRESSION_START_TIME__ = new Date();
    
    // Create regression log directory
    const regressionLogsDir = path.join(__dirname, '..', '..', '..', 'logs', 'regression');
    if (!fs.existsSync(regressionLogsDir)) {
      fs.mkdirSync(regressionLogsDir, { recursive: true });
    }
    
    // Initialize regression tracking file
    const regressionTrackingFile = path.join(regressionLogsDir, `regression-run-${new Date().toISOString().replace(/:/g, '-')}.log`);
    fs.writeFileSync(regressionTrackingFile, `Regression test started at ${global.__REGRESSION_START_TIME__}\n`);
    global.__REGRESSION_LOG_FILE__ = regressionTrackingFile;
    
    // Setup snapshot tracking for changes
    console.log('🔧 Initializing regression snapshot comparison...');
    try {
      const snapshotDir = path.join(__dirname, '..', 'snapshots');
      if (!fs.existsSync(snapshotDir)) {
        fs.mkdirSync(snapshotDir, { recursive: true });
      }
      
      console.log('✓ Snapshot directory initialized');
    } catch (error) {
      console.error('Failed to initialize snapshot directory:', error);
    }
    
    console.log('✅ Regression test environment setup complete');
  } catch (error) {
    console.error('❌ Failed to set up regression test environment:', error);
    process.exit(1);
  }
};
