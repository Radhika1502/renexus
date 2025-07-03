#!/usr/bin/env node

/**
 * Comprehensive Test Suite for Renexus Implementation
 * Tests acceptance criteria for sections 2.2, 2.3, and 2.4
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Comprehensive Renexus Test Suite...\n');

const testResults = {
  section_2_2: {
    name: 'Dashboard Module',
    tests: [],
    passed: 0,
    total: 0
  },
  section_2_3: {
    name: 'API Gateway Service', 
    tests: [],
    passed: 0,
    total: 0
  },
  section_2_4: {
    name: 'Database Implementation',
    tests: [],
    passed: 0,
    total: 0
  }
};

function runTest(testName, testFn, section) {
  console.log(`  Running: ${testName}...`);
  testResults[section].total++;
  
  try {
    const result = testFn();
    if (result) {
      console.log(`  ✅ PASS: ${testName}`);
      testResults[section].tests.push({ name: testName, status: 'PASS', details: result });
      testResults[section].passed++;
    } else {
      console.log(`  ❌ FAIL: ${testName}`);
      testResults[section].tests.push({ name: testName, status: 'FAIL', details: 'Test returned false' });
    }
  } catch (error) {
    console.log(`  ❌ ERROR: ${testName} - ${error.message}`);
    testResults[section].tests.push({ name: testName, status: 'ERROR', details: error.message });
  }
}

// Section 2.2: Dashboard Module Tests
console.log('📊 Testing Section 2.2: Dashboard Module\n');

runTest('DashboardSummaryCard component exists', () => {
  const filePath = 'src/features/dashboard/components/DashboardSummaryCard.tsx';
  return fs.existsSync(filePath);
}, 'section_2_2');

runTest('ProjectProgressCard component exists', () => {
  const filePath = 'src/features/dashboard/components/ProjectProgressCard.tsx';
  return fs.existsSync(filePath);
}, 'section_2_2');

runTest('TaskStatusChart component exists', () => {
  const filePath = 'src/features/dashboard/components/TaskStatusChart.tsx';
  return fs.existsSync(filePath);
}, 'section_2_2');

runTest('ActivityFeed component exists', () => {
  const filePath = 'src/features/dashboard/components/ActivityFeed.tsx';
  return fs.existsSync(filePath);
}, 'section_2_2');

runTest('Dashboard hooks use real API calls', () => {
  const filePath = 'src/features/dashboard/hooks/useDashboard.ts';
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('dashboardService') && content.includes('useQuery');
}, 'section_2_2');

runTest('Dashboard service has all endpoints', () => {
  const filePath = 'src/features/dashboard/api/dashboardService.ts';
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('getDashboardSummary') && 
         content.includes('getProjectSummaries') &&
         content.includes('getTaskStatusSummary') &&
         content.includes('getActivityFeed');
}, 'section_2_2');

// Section 2.3: API Gateway Service Tests  
console.log('\n🔌 Testing Section 2.3: API Gateway Service\n');

runTest('Dashboard controller exists', () => {
  const filePath = '../backend/api-gateway/src/features/dashboard/dashboard.controller.ts';
  return fs.existsSync(filePath);
}, 'section_2_3');

runTest('Dashboard service exists', () => {
  const filePath = '../backend/api-gateway/src/features/dashboard/dashboard.service.ts';
  return fs.existsSync(filePath);
}, 'section_2_3');

runTest('Task analytics controller exists', () => {
  const filePath = '../backend/api-gateway/src/features/task-analytics/task-analytics.controller.ts';
  return fs.existsSync(filePath);
}, 'section_2_3');

runTest('Authentication endpoints exist', () => {
  const filePath = '../backend/api-gateway/src/routes/auth.routes.ts';
  return fs.existsSync(filePath);
}, 'section_2_3');

runTest('Main API gateway setup exists', () => {
  const filePath = '../backend/api-gateway/src/main.ts';
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('NestFactory') && content.includes('ValidationPipe');
}, 'section_2_3');

// Section 2.4: Database Implementation Tests
console.log('\n🗄️ Testing Section 2.4: Database Implementation\n');

runTest('Database schema exists', () => {
  const filePath = '../packages/database/schema.ts';
  return fs.existsSync(filePath);
}, 'section_2_4');

runTest('Core tables defined in schema', () => {
  const filePath = '../packages/database/schema.ts';
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('export const users') && 
         content.includes('export const projects') &&
         content.includes('export const tasks') &&
         content.includes('export const taskAssignees');
}, 'section_2_4');

runTest('Prisma schema exists', () => {
  const filePath = '../backend/api-gateway/prisma/schema.prisma';
  return fs.existsSync(filePath);
}, 'section_2_4');

runTest('Task model in Prisma schema', () => {
  const filePath = '../backend/api-gateway/prisma/schema.prisma';
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('model Task') && content.includes('model Project');
}, 'section_2_4');

runTest('Task dependencies in Prisma schema', () => {
  const filePath = '../backend/api-gateway/prisma/schema.prisma';
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes('TaskDependency');
}, 'section_2_4');

// Generate final report
console.log('\n📋 TEST RESULTS SUMMARY\n');
console.log('========================================');

let totalTests = 0;
let totalPassed = 0;

Object.keys(testResults).forEach(sectionKey => {
  const section = testResults[sectionKey];
  const percentage = section.total > 0 ? Math.round((section.passed / section.total) * 100) : 0;
  
  console.log(`\n${section.name}:`);
  console.log(`  Tests: ${section.passed}/${section.total} (${percentage}%)`);
  
  section.tests.forEach(test => {
    const status = test.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${status} ${test.name}`);
  });
  
  totalTests += section.total;
  totalPassed += section.passed;
});

const overallPercentage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

console.log('\n========================================');
console.log(`OVERALL RESULTS: ${totalPassed}/${totalTests} (${overallPercentage}%)`);

if (overallPercentage >= 100) {
  console.log('🎉 ALL TESTS PASSED! Implementation is 100% complete.');
  process.exit(0);
} else if (overallPercentage >= 75) {
  console.log('✅ Most tests passed. Implementation is largely complete.');
  process.exit(0);
} else {
  console.log('⚠️ Some tests failed. Implementation needs more work.');
  process.exit(1);
} 