/**
 * Simple database debug script with explicit console output
 */

// Set environment explicitly to test
process.env.NODE_ENV = 'test';
console.log('NODE_ENV set to:', process.env.NODE_ENV);

// Import DB module
const fs = require('fs');

// Log file setup
const logFile = fs.createWriteStream('db-debug.log', { flags: 'w' });

// Log function that writes to both console and file
function log(message) {
  const formattedMsg = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
  console.log(formattedMsg);
  logFile.write(formattedMsg + '\n');
}

log('=== DATABASE DEBUG TEST ===');
log(`Time: ${new Date().toISOString()}`);

// Import the test database module
try {
  log('Attempting to import test-db module...');
  const { testDb } = require('./setup/test-db');
  log('Module imported successfully');
  
  // Check if we're using real DB
  log(`Using real database: ${testDb.isUsingRealDb ? 'YES' : 'NO'}`);
  
  // Run test query
  log('Executing test query...');
  testDb.execute('SELECT 1 as test_value')
    .then(result => {
      log('Query executed successfully:');
      log(result);
      
      // Try more complex query
      log('\nTesting table access...');
      return testDb.execute('SELECT table_name FROM information_schema.tables WHERE table_schema = $1', ['public'])
        .then(tables => {
          log('Available tables:');
          log(tables.rows.map(t => t.table_name));
          
          // Close connection
          return testDb.close();
        });
    })
    .then(() => {
      log('Database connection closed');
      log('=== DATABASE DEBUG COMPLETE ===');
      logFile.end();
    })
    .catch(err => {
      log('ERROR executing query:');
      log(err.toString());
      log(err.stack);
      log('=== DATABASE DEBUG FAILED ===');
      logFile.end();
      process.exit(1);
    });
} catch (error) {
  log('ERROR importing module:');
  log(error.toString());
  log(error.stack);
  log('=== DATABASE DEBUG FAILED ===');
  logFile.end();
  process.exit(1);
}
