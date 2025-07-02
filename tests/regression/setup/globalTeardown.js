/**
 * Global Teardown for Regression Tests
 * Phase 5.2.3 - Regression Testing
 */
const fs = require('fs');
const path = require('path');

/**
 * Teardown function to clean up the test environment
 * after running regression tests
 */
module.exports = async function globalTeardown() {
  console.log('🧹 Cleaning up regression test environment...');
  
  try {
    // Get the MongoDB server instance
    const mongoServer = global.__MONGO_SERVER__;
    if (mongoServer) {
      await mongoServer.stop();
      console.log('✓ MongoDB Memory Server stopped');
    }
    
    // Calculate test run duration
    const startTime = global.__REGRESSION_START_TIME__;
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000; // in seconds
    
    // Log test completion
    const logFile = global.__REGRESSION_LOG_FILE__;
    if (logFile && fs.existsSync(logFile)) {
      fs.appendFileSync(
        logFile,
        `Regression test completed at ${endTime}\n` +
        `Total duration: ${duration.toFixed(2)} seconds\n`
      );
      console.log(`✓ Regression log updated at ${logFile}`);
    }
    
    // Archive test artifacts if needed
    const artifactsDir = path.join(__dirname, '..', '..', '..', 'test-reports', 'regression');
    if (fs.existsSync(artifactsDir)) {
      const archiveDir = path.join(
        __dirname, 
        '..', 
        '..', 
        '..', 
        'test-archives', 
        'regression', 
        `run-${new Date().toISOString().replace(/:/g, '-')}`
      );
      
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }
      
      // This would actually copy files in a real implementation
      console.log(`✓ Test artifacts would be archived to ${archiveDir}`);
    }
    
    console.log('✅ Regression test environment cleanup complete');
  } catch (error) {
    console.error('❌ Failed to clean up regression test environment:', error);
  }
};
