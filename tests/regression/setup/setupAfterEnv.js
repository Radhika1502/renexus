/**
 * Setup After Environment for Regression Tests
 * Phase 5.2.3 - Regression Testing
 */
const supertest = require('supertest');
const path = require('path');
const fs = require('fs');

// Initialize test server for API tests
let app;
let server;
let request;

beforeAll(async () => {
  console.log('🚀 Setting up test environment for regression tests...');
  
  // Set longer timeout for regression tests
  jest.setTimeout(30000);
  
  try {
    // Import the application
    app = require('../../../src/app');
    
    // Create supertest client
    request = supertest(app);
    global.__TEST_REQUEST__ = request;
    
    // Start the server on a test port
    const port = process.env.PORT || 9001;
    server = app.listen(port, () => {
      console.log(`✓ Test server started on port ${port}`);
    });
    
    // Initialize regression snapshot helpers
    global.__REGRESSION_SNAPSHOTS__ = {
      // Compare current response with stored snapshot
      compareWithSnapshot: async (snapshotName, currentData) => {
        const snapshotDir = path.join(__dirname, '..', 'snapshots');
        const snapshotFile = path.join(snapshotDir, `${snapshotName}.json`);
        
        // If snapshot doesn't exist, create it
        if (!fs.existsSync(snapshotFile)) {
          fs.writeFileSync(snapshotFile, JSON.stringify(currentData, null, 2));
          console.log(`Created new snapshot: ${snapshotName}`);
          return { matches: true, isNew: true };
        }
        
        // Read existing snapshot
        const existingData = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
        
        // Compare data (simple equality check - in a real system this would be more sophisticated)
        const matches = JSON.stringify(existingData) === JSON.stringify(currentData);
        
        if (!matches) {
          // Log differences for investigation
          const diffFile = path.join(snapshotDir, `${snapshotName}.diff.json`);
          fs.writeFileSync(diffFile, JSON.stringify({
            existing: existingData,
            current: currentData
          }, null, 2));
          
          console.log(`Snapshot difference detected: ${snapshotName} (diff saved)`);
        }
        
        return { matches, isNew: false };
      },
      
      // Update a regression snapshot with new data
      updateSnapshot: (snapshotName, newData) => {
        const snapshotDir = path.join(__dirname, '..', 'snapshots');
        const snapshotFile = path.join(snapshotDir, `${snapshotName}.json`);
        
        fs.writeFileSync(snapshotFile, JSON.stringify(newData, null, 2));
        console.log(`Updated snapshot: ${snapshotName}`);
        
        return true;
      }
    };
    
    console.log('✅ Regression test environment ready');
  } catch (error) {
    console.error('❌ Failed to set up regression test environment:', error);
    throw error;
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Close server if it was started
  if (server) {
    await new Promise((resolve) => {
      server.close(resolve);
    });
    console.log('✓ Test server closed');
  }
});

// Add custom matchers for regression tests
expect.extend({
  // Custom matcher to verify API response structure matches expected format
  toMatchApiSchema(received, schemaName) {
    // This would use something like ajv schema validation in a real implementation
    // For now we'll do a simple validation based on expected keys
    
    const schemas = {
      user: ['id', 'name', 'email', 'role'],
      project: ['id', 'name', 'description', 'owner_id'],
      task: ['id', 'title', 'description', 'status', 'priority', 'project_id'],
      auth: ['user', 'tokens']
    };
    
    const expectedKeys = schemas[schemaName];
    if (!expectedKeys) {
      return {
        pass: false,
        message: () => `Schema "${schemaName}" is not defined`
      };
    }
    
    // For array responses, check the first item
    const toCheck = Array.isArray(received) ? received[0] : received;
    
    // Check if all expected keys exist
    const hasAllKeys = expectedKeys.every(key => 
      Object.prototype.hasOwnProperty.call(toCheck, key)
    );
    
    return {
      pass: hasAllKeys,
      message: () => hasAllKeys 
        ? `Expected response not to match ${schemaName} schema`
        : `Expected response to match ${schemaName} schema. Missing keys: ${
            expectedKeys.filter(key => !Object.prototype.hasOwnProperty.call(toCheck, key)).join(', ')
          }`
    };
  },
  
  // Custom matcher to verify response time is within acceptable limits
  toRespondWithinTime(received, maxTime) {
    // This would check the response time in a real implementation
    // For now just demonstrate the concept
    const pass = received && received.responseTime && received.responseTime < maxTime;
    
    return {
      pass,
      message: () => pass
        ? `Expected response time ${received.responseTime}ms to be slower than ${maxTime}ms`
        : `Expected response time ${received.responseTime}ms to be faster than ${maxTime}ms`
    };
  },
  
  // Matcher to verify no regression from previous snapshot
  async toMatchRegressionSnapshot(received, snapshotName) {
    // Call the global helper
    const result = await global.__REGRESSION_SNAPSHOTS__.compareWithSnapshot(
      snapshotName,
      received
    );
    
    return {
      pass: result.matches,
      message: () => result.matches
        ? `Expected response to differ from regression snapshot "${snapshotName}"`
        : `Expected response to match regression snapshot "${snapshotName}"`
    };
  }
});

// Add global test helpers specific to regression tests
global.loginTestUser = async (email, password) => {
  const response = await request
    .post('/api/auth/login')
    .send({ email, password });
  
  return response.body.tokens;
};

// Log each test for better reporting
beforeEach(() => {
  console.log(`🧪 Running test: ${expect.getState().currentTestName}`);
});
