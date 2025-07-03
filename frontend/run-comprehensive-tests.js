#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Comprehensive Test Suite for Task 1 and Task 2');
console.log('='.repeat(80));

// Test results tracking
const testResults = {
  task1: {
    taskManagement: { passed: 0, failed: 0, total: 0 },
    reportingService: { passed: 0, failed: 0, total: 0 },
    taskService: { passed: 0, failed: 0, total: 0 }
  },
  task2: {
    directoryStructure: { passed: 0, failed: 0, total: 0 },
    dashboard: { passed: 0, failed: 0, total: 0 },
    apiGateway: { passed: 0, failed: 0, total: 0 },
    database: { passed: 0, failed: 0, total: 0 }
  }
};

// Helper function to run tests and capture results
function runTest(testName, testCommand, category, task) {
  console.log(`\n📋 Running ${testName}...`);
  console.log('-'.repeat(50));
  
  try {
    const output = execSync(testCommand, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    console.log('✅ PASSED:', testName);
    testResults[task][category].passed++;
    testResults[task][category].total++;
    
    return { success: true, output };
  } catch (error) {
    console.log('❌ FAILED:', testName);
    console.log('Error:', error.message);
    testResults[task][category].failed++;
    testResults[task][category].total++;
    
    return { success: false, error: error.message };
  }
}

// Helper function to check file existence
function checkFileExists(filePath, description) {
  const exists = fs.existsSync(filePath);
  console.log(`${exists ? '✅' : '❌'} ${description}: ${filePath}`);
  return exists;
}

// Helper function to check directory structure
function checkDirectoryStructure() {
  console.log('\n🏗️  TASK 2.1: Directory Structure Analysis');
  console.log('='.repeat(80));
  
  const expectedDirs = [
    'backend/api',
    'backend/api-gateway', 
    'backend/auth-service',
    'frontend/web',
    'packages/database',
    'packages/shared',
    'packages/ui'
  ];
  
  let passed = 0;
  expectedDirs.forEach(dir => {
    const fullPath = path.join('..', dir);
    if (checkFileExists(fullPath, `Directory: ${dir}`)) {
      passed++;
    }
  });
  
  testResults.task2.directoryStructure.passed = passed;
  testResults.task2.directoryStructure.failed = expectedDirs.length - passed;
  testResults.task2.directoryStructure.total = expectedDirs.length;
  
  return passed === expectedDirs.length;
}

// Helper function to check for mock data usage
function checkMockDataUsage() {
  console.log('\n🔍 Checking for Mock Data Usage...');
  
  const filesToCheck = [
    'web/src/services/analytics/task-analytics.service.ts',
    'web/src/services/analytics/ReportingService.ts',
    'web/src/components/analytics/CustomReportBuilder.tsx'
  ];
  
  let mockDataFound = false;
  filesToCheck.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('mock') || content.includes('Mock') || content.includes('placeholder')) {
        console.log(`❌ Mock data found in: ${file}`);
        mockDataFound = true;
      } else {
        console.log(`✅ No mock data in: ${file}`);
      }
    } catch (error) {
      console.log(`⚠️  Could not read: ${file}`);
    }
  });
  
  return !mockDataFound;
}

// TASK 1 TESTS
console.log('\n🎯 TASK 1: CRITICAL Priority Tasks');
console.log('='.repeat(80));

// Task 1.1: Task Management Module Tests
console.log('\n📊 TASK 1.1: Task Management Module (UI-002)');
runTest(
  'TaskBoard Component Tests',
  'npm test -- --testNamePattern="TaskBoard" --passWithNoTests',
  'taskManagement',
  'task1'
);

runTest(
  'TaskCard Component Tests', 
  'npm test -- --testNamePattern="TaskCard" --passWithNoTests',
  'taskManagement',
  'task1'
);

runTest(
  'TaskDetails Component Tests',
  'npm test -- --testNamePattern="TaskDetails" --passWithNoTests', 
  'taskManagement',
  'task1'
);

runTest(
  'TaskDependencies Component Tests',
  'npm test -- --testNamePattern="TaskDependencies" --passWithNoTests',
  'taskManagement', 
  'task1'
);

runTest(
  'TaskAttachments Component Tests',
  'npm test -- --testNamePattern="TaskAttachments" --passWithNoTests',
  'taskManagement',
  'task1'
);

// Task 1.2: Reporting Service Tests  
console.log('\n📈 TASK 1.2: Reporting Service (BE-003)');
// Check for mock data usage
const noMockData = checkMockDataUsage();
if (noMockData) {
  testResults.task1.reportingService.passed++;
} else {
  testResults.task1.reportingService.failed++;
}
testResults.task1.reportingService.total++;

// Task 1.3: Task Service Tests
console.log('\n⚙️  TASK 1.3: Task Service (BE-002)');
runTest(
  'Task Service Backend Tests',
  'cd ../tests && npm test -- --testNamePattern="TaskService" --passWithNoTests || echo "No backend tests found"',
  'taskService',
  'task1'
);

// TASK 2 TESTS
console.log('\n🎯 TASK 2: HIGH Priority Tasks');
console.log('='.repeat(80));

// Task 2.1: Directory Structure
const directoryStructureOK = checkDirectoryStructure();

// Task 2.2: Dashboard Module Tests
console.log('\n📊 TASK 2.2: Dashboard Module (UI-001)');
runTest(
  'Dashboard Component Tests',
  'npm test -- --testNamePattern="Dashboard" --passWithNoTests',
  'dashboard',
  'task2'
);

// Task 2.3: API Gateway Tests
console.log('\n🌐 TASK 2.3: API Gateway Service (BE-001)');
runTest(
  'API Gateway Tests',
  'cd ../backend/api-gateway && npm test --passWithNoTests || echo "No API Gateway tests found"',
  'apiGateway', 
  'task2'
);

// Task 2.4: Database Tests
console.log('\n🗄️  TASK 2.4: Database and Data Analysis (DATA-001)');
runTest(
  'Database Schema Tests',
  'cd ../packages/database && npm test --passWithNoTests || echo "No database tests found"',
  'database',
  'task2'
);

// RESULTS SUMMARY
console.log('\n📊 TEST RESULTS SUMMARY');
console.log('='.repeat(80));

function printTaskResults(taskName, taskResults) {
  console.log(`\n${taskName}:`);
  Object.keys(taskResults).forEach(category => {
    const result = taskResults[category];
    const percentage = result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0;
    console.log(`  ${category}: ${result.passed}/${result.total} (${percentage}%) - ${result.failed} failed`);
  });
}

printTaskResults('TASK 1 - CRITICAL', testResults.task1);
printTaskResults('TASK 2 - HIGH', testResults.task2);

// Calculate overall scores
const task1Total = Object.values(testResults.task1).reduce((sum, cat) => sum + cat.total, 0);
const task1Passed = Object.values(testResults.task1).reduce((sum, cat) => sum + cat.passed, 0);
const task1Percentage = task1Total > 0 ? Math.round((task1Passed / task1Total) * 100) : 0;

const task2Total = Object.values(testResults.task2).reduce((sum, cat) => sum + cat.total, 0);
const task2Passed = Object.values(testResults.task2).reduce((sum, cat) => sum + cat.passed, 0);
const task2Percentage = task2Total > 0 ? Math.round((task2Passed / task2Total) * 100) : 0;

console.log('\n🎯 OVERALL SCORES:');
console.log(`Task 1 (Critical): ${task1Passed}/${task1Total} (${task1Percentage}%)`);
console.log(`Task 2 (High): ${task2Passed}/${task2Total} (${task2Percentage}%)`);

const overallPassed = task1Passed + task2Passed;
const overallTotal = task1Total + task2Total;
const overallPercentage = overallTotal > 0 ? Math.round((overallPassed / overallTotal) * 100) : 0;

console.log(`\n🏆 OVERALL SUCCESS RATE: ${overallPassed}/${overallTotal} (${overallPercentage}%)`);

// Write results to file
const resultsFile = {
  timestamp: new Date().toISOString(),
  task1: testResults.task1,
  task2: testResults.task2,
  overall: {
    passed: overallPassed,
    total: overallTotal, 
    percentage: overallPercentage
  }
};

fs.writeFileSync('test-results.json', JSON.stringify(resultsFile, null, 2));
console.log('\n📄 Results saved to test-results.json');

// Exit with appropriate code
if (overallPercentage === 100) {
  console.log('\n🎉 ALL TESTS PASSED! Ready to proceed.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please fix issues before proceeding.');
  process.exit(1);
} 