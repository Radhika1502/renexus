/**
 * Renexus Phase 1 Test Runner
 * 
 * This script runs all Phase 1 tests based on the Renexus_Consolidation.md requirements:
 * - 12 integration test suites
 * - 5 unit test suites
 * 
 * It reports detailed results and ensures 100% success rate for all Phase 1 acceptance criteria.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Define all test suites based on Phase 1 requirements from Renexus_Consolidation.md
const tests = {
  integration: [
    // 1.1 Database & Migration (Critical)
    'database.test.ts',        // Schema validation, migration testing, integrity testing
    'migration-scripts.test.ts', // Migration testing
    'backup-recovery.test.ts', // Backup & recovery testing
    
    // 1.2 Authentication & User Management (Critical)
    'auth.test.ts',            // User management, authentication, access control, MFA
    'performance.test.ts',     // Performance testing
    
    // 1.3 Core API Services (Critical)
    'api-gateway.test.ts',     // API gateway, error handling, logging
    'project-service.test.ts', // Project management service
    'projects.test.ts',        // Project operations
    'task-service.test.ts',    // Task management service
    'tasks.test.ts',           // Task operations
    'task-analytics.test.ts',  // Task analytics
    'end-to-end-flows.test.ts' // End-to-end flows
  ],
  unit: [
    // Unit tests for critical components
    'api-gateway.test.ts',     // API gateway unit tests
    'error-handler.test.ts',   // Error handling unit tests
    'mfa-service.test.ts',     // Multi-factor authentication unit tests
    'project-service.test.ts', // Project service unit tests
    'session-service.test.ts'  // Session service unit tests
  ]
};

// Phase 1 acceptance criteria from Renexus_Consolidation.md
const phase1AcceptanceCriteria = {
  database: [
    "All tables and relationships should be created correctly",
    "Data should be migrated without loss or corruption",
    "Integrity constraints should be enforced",
    "Backup and recovery procedures should work as expected"
  ],
  authentication: [
    "The system should handle authentication requests securely",
    "User data should be protected",
    "Appropriate access controls should be enforced",
    "Multi-factor authentication should work correctly"
  ],
  apiServices: [
    "The services should respond correctly to client requests",
    "Data should be processed and stored correctly",
    "Errors should be handled gracefully",
    "All operations should be properly logged"
  ]
};

// Results tracking
const results = {
  integration: {
    passed: [],
    failed: []
  },
  unit: {
    passed: [],
    failed: []
  },
  acceptanceCriteria: {
    database: { passed: true, tests: [] },
    authentication: { passed: true, tests: [] },
    apiServices: { passed: true, tests: [] }
  }
};

// Test case mapping to acceptance criteria
const testCriteriaMappings = {
  'database.test.ts': ['database'],
  'migration-scripts.test.ts': ['database'],
  'backup-recovery.test.ts': ['database'],
  'auth.test.ts': ['authentication'],
  'performance.test.ts': ['database', 'apiServices'], // Performance tests cover both database and API services
  'api-gateway.test.ts': ['apiServices'],
  'project-service.test.ts': ['apiServices'],
  'projects.test.ts': ['apiServices'],
  'task-service.test.ts': ['apiServices'],
  'tasks.test.ts': ['apiServices'],
  'task-analytics.test.ts': ['apiServices'],
  'end-to-end-flows.test.ts': ['database', 'authentication', 'apiServices']
};

// Helper functions
function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function runTest(type, testFile) {
  const testPath = path.join('tests', type, testFile);
  const fullPath = path.join(process.cwd(), testPath);
  
  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${testPath}`);
    results[type].failed.push({
      file: testFile,
      error: 'File not found'
    });
    
    // Update acceptance criteria status
    updateAcceptanceCriteriaStatus(testFile, false);
    
    return false;
  }
  
  console.log(`Running: ${testPath}`);
  
  // Start time measurement
  const startTime = Date.now();
  
  // Run Jest with the specific test file using spawnSync for better output handling
  const result = spawnSync('npx', [
    'jest',
    testPath,
    '--passWithNoTests',
    '--forceExit',
    '--testTimeout=30000'
  ], {
    encoding: 'utf8',
    stdio: 'pipe',
    shell: true
  });
  
  // Calculate duration
  const duration = Date.now() - startTime;
  
  // Check if the test passed or failed
  const success = result.status === 0;
  
  if (success) {
    // Record success
    results[type].passed.push({
      file: testFile,
      duration
    });
    
    // Update acceptance criteria status
    updateAcceptanceCriteriaStatus(testFile, true);
    
    console.log(`✅ PASSED: ${testFile} (${formatTime(duration)})`);
    return true;
  } else {
    // Get error message from stderr or stdout
    const errorOutput = result.stderr || result.stdout || 'Unknown error';
    const errorMessage = errorOutput.split('\n')[0];
    
    // Record failure
    results[type].failed.push({
      file: testFile,
      error: errorMessage,
      duration
    });
    
    // Update acceptance criteria status
    updateAcceptanceCriteriaStatus(testFile, false);
    
    console.log(`❌ FAILED: ${testFile} (${formatTime(duration)})`);
    console.log(`   Error: ${errorMessage}`);
    return false;
  }
}

// Update acceptance criteria status based on test results
function updateAcceptanceCriteriaStatus(testFile, passed) {
  // Get the criteria categories this test belongs to
  const criteriaCategories = testCriteriaMappings[testFile] || [];
  
  criteriaCategories.forEach(category => {
    if (!passed) {
      results.acceptanceCriteria[category].passed = false;
    }
    results.acceptanceCriteria[category].tests.push({
      test: testFile,
      passed
    });
  });
}

// Main execution
console.log('==================================================');
console.log('        RENEXUS PHASE 1 COMPLETE TEST SUITE        ');
console.log('==================================================');

const startTime = Date.now();
console.log(`\nStarted at: ${new Date().toISOString()}\n`);

// Run integration tests
console.log('==================================================');
console.log('             INTEGRATION TEST SUITES');
console.log('==================================================\n');

tests.integration.forEach((testFile, index) => {
  console.log(`[${index + 1}/${tests.integration.length}] Integration: ${testFile}`);
  runTest('integration', testFile);
});

// Run unit tests
console.log('==================================================');
console.log('                UNIT TEST SUITES');
console.log('==================================================\n');

tests.unit.forEach((testFile, index) => {
  console.log(`[${index + 1}/${tests.unit.length}] Unit: ${testFile}`);
  runTest('unit', testFile);
});

// Calculate total duration
const totalDuration = Date.now() - startTime;

// Print summary
console.log('==================================================');
console.log('                 SUMMARY REPORT');
console.log('==================================================\n');

console.log(`Total Duration: ${formatTime(totalDuration)}\n`);

console.log(`Integration Tests: ${results.integration.passed.length} passed, ${results.integration.failed.length} failed`);
console.log(`Unit Tests: ${results.unit.passed.length} passed, ${results.unit.failed.length} failed\n`);

const totalPassed = results.integration.passed.length + results.unit.passed.length;
const totalFailed = results.integration.failed.length + results.unit.failed.length;
const totalTests = totalPassed + totalFailed;

console.log(`Total: ${totalPassed}/${totalTests} tests passed (${Math.round(totalPassed / totalTests * 100)}%)\n`);

// Acceptance Criteria Validation
console.log('==================================================');
console.log('          PHASE 1 ACCEPTANCE CRITERIA');
console.log('==================================================\n');

// Check database acceptance criteria
const dbCriteriaPassed = results.acceptanceCriteria.database.passed;
console.log(`1.1 Database & Migration: ${dbCriteriaPassed ? '✅ PASSED' : '❌ FAILED'}`);
phase1AcceptanceCriteria.database.forEach((criterion, index) => {
  console.log(`   ${index + 1}. ${criterion}: ${dbCriteriaPassed ? '✅' : '❌'}`);
});

// List database tests
const dbTests = results.acceptanceCriteria.database.tests;
const dbTestsPassed = dbTests.filter(t => t.passed).length;
console.log(`   Tests: ${dbTestsPassed}/${dbTests.length} passed\n`);

// Check authentication acceptance criteria
const authCriteriaPassed = results.acceptanceCriteria.authentication.passed;
console.log(`1.2 Authentication & User Management: ${authCriteriaPassed ? '✅ PASSED' : '❌ FAILED'}`);
phase1AcceptanceCriteria.authentication.forEach((criterion, index) => {
  console.log(`   ${index + 1}. ${criterion}: ${authCriteriaPassed ? '✅' : '❌'}`);
});

// List authentication tests
const authTests = results.acceptanceCriteria.authentication.tests;
const authTestsPassed = authTests.filter(t => t.passed).length;
console.log(`   Tests: ${authTestsPassed}/${authTests.length} passed\n`);

// Check API services acceptance criteria
const apiCriteriaPassed = results.acceptanceCriteria.apiServices.passed;
console.log(`1.3 Core API Services: ${apiCriteriaPassed ? '✅ PASSED' : '❌ FAILED'}`);
phase1AcceptanceCriteria.apiServices.forEach((criterion, index) => {
  console.log(`   ${index + 1}. ${criterion}: ${apiCriteriaPassed ? '✅' : '❌'}`);
});

// List API services tests
const apiTests = results.acceptanceCriteria.apiServices.tests;
const apiTestsPassed = apiTests.filter(t => t.passed).length;
console.log(`   Tests: ${apiTestsPassed}/${apiTests.length} passed\n`);

// List failed tests if any
if (totalFailed > 0) {
  console.log(`Failed Tests:`);
  
  // List integration test failures
  results.integration.failed.forEach(failure => {
    console.log(`- Integration: ${failure.file} - ${failure.error.split('\n')[0]}`);
  });
  
  // List unit test failures
  results.unit.failed.forEach(failure => {
    console.log(`- Unit: ${failure.file} - ${failure.error.split('\n')[0]}`);
  });
  
  console.log('');
}

// Overall Phase 1 status
const allCriteriaPassed = dbCriteriaPassed && authCriteriaPassed && apiCriteriaPassed;

console.log('==================================================');
console.log('             PHASE 1 OVERALL STATUS');
console.log('==================================================\n');

if (allCriteriaPassed && totalFailed === 0) {
  console.log(`✅ All Phase 1 acceptance criteria PASSED!`);
  console.log(`✅ All ${totalTests} tests PASSED!`);
  console.log(`\nPhase 1 is complete and ready for sign-off.`);
  process.exit(0);
} else {
  console.log(`❌ Phase 1 acceptance criteria NOT MET.`);
  console.log(`❌ ${totalFailed}/${totalTests} tests FAILED.`);
  console.log(`\nPlease fix the failing tests to meet all Phase 1 acceptance criteria.`);
  process.exit(1);
}

// Helper function to get test duration
function getStartTime() {
  return Date.now();
}
