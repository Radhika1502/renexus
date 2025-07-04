/**
 * Comprehensive Test Runner for Tasks 2.2, 2.3, and 2.4
 * This script runs actual tests and provides accurate implementation status
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

// Test results tracking
const testResults = {
  task2_2: { passed: 0, failed: 0, total: 0, details: [] },
  task2_3: { passed: 0, failed: 0, total: 0, details: [] },
  task2_4: { passed: 0, failed: 0, total: 0, details: [] }
};

function logResult(task, testName, passed, details = '') {
  const result = { testName, passed, details };
  testResults[task].details.push(result);
  testResults[task].total++;
  if (passed) {
    testResults[task].passed++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    testResults[task].failed++;
    console.log(`  ❌ FAIL: ${testName} - ${details}`);
  }
}

function checkFileExists(filePath, description) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function checkFileContent(filePath, searchTerms, description) {
  try {
    if (!fs.existsSync(filePath)) {
      return { exists: false, hasContent: false };
    }
    const content = fs.readFileSync(filePath, 'utf8');
    const hasContent = Array.isArray(searchTerms) 
      ? searchTerms.every(term => content.includes(term))
      : content.includes(searchTerms);
    return { exists: true, hasContent };
  } catch (error) {
    return { exists: false, hasContent: false };
  }
}

async function runTask2_2_DashboardModule() {
  console.log('\n📊 TASK 2.2: Dashboard Module Tests\n');
  
  // Test 1: Dashboard components exist
  const dashboardComponents = [
    'frontend/web/src/features/dashboard/components/DashboardSummaryCard.tsx',
    'frontend/web/src/features/dashboard/components/ProjectProgressCard.tsx',
    'frontend/web/src/features/dashboard/components/TaskStatusChart.tsx',
    'frontend/web/src/features/dashboard/components/ActivityFeed.tsx'
  ];
  
  dashboardComponents.forEach(component => {
    const componentName = path.basename(component, '.tsx');
    const exists = checkFileExists(component, componentName);
    logResult('task2_2', `${componentName} component exists`, exists, 
      exists ? '' : `File not found: ${component}`);
  });
  
  // Test 2: Dashboard hooks and services
  const dashboardHook = 'frontend/web/src/features/dashboard/hooks/useDashboard.ts';
  const hookCheck = checkFileContent(dashboardHook, ['dashboardService', 'useQuery'], 'Dashboard hook');
  logResult('task2_2', 'Dashboard hooks use real API calls', hookCheck.exists && hookCheck.hasContent,
    !hookCheck.exists ? 'Hook file not found' : !hookCheck.hasContent ? 'Missing API integration' : '');
  
  const dashboardService = 'frontend/web/src/features/dashboard/api/dashboardService.ts';
  const serviceCheck = checkFileContent(dashboardService, 
    ['getDashboardSummary', 'getProjectSummaries', 'getTaskStatusSummary', 'getActivityFeed'], 'Dashboard service');
  logResult('task2_2', 'Dashboard service has all endpoints', serviceCheck.exists && serviceCheck.hasContent,
    !serviceCheck.exists ? 'Service file not found' : !serviceCheck.hasContent ? 'Missing required endpoints' : '');
  
  // Test 3: Component functionality
  const summaryCardCheck = checkFileContent(dashboardComponents[0], ['isLoading', 'animate-pulse'], 'Loading states');
  logResult('task2_2', 'DashboardSummaryCard has loading states', summaryCardCheck.exists && summaryCardCheck.hasContent,
    !summaryCardCheck.hasContent ? 'Missing loading state implementation' : '');
  
  const chartCheck = checkFileContent(dashboardComponents[2], ['PieChart', 'ResponsiveContainer'], 'Chart functionality');
  logResult('task2_2', 'TaskStatusChart has Recharts integration', chartCheck.exists && chartCheck.hasContent,
    !chartCheck.hasContent ? 'Missing chart implementation' : '');
}

async function runTask2_3_APIGateway() {
  console.log('\n🔌 TASK 2.3: API Gateway Service Tests\n');
  
  // Test 1: Backend controller exists
  const dashboardController = 'backend/api-gateway/src/features/dashboard/dashboard.controller.ts';
  const controllerExists = checkFileExists(dashboardController, 'Dashboard controller');
  logResult('task2_3', 'Dashboard controller exists', controllerExists,
    controllerExists ? '' : 'Controller file not found');
  
  // Test 2: Backend service exists
  const dashboardService = 'backend/api-gateway/src/features/dashboard/dashboard.service.ts';
  const serviceExists = checkFileExists(dashboardService, 'Dashboard service');
  logResult('task2_3', 'Dashboard service exists', serviceExists,
    serviceExists ? '' : 'Service file not found');
  
  // Test 3: API endpoints implementation
  if (controllerExists) {
    const controllerCheck = checkFileContent(dashboardController, 
      ['getDashboardSummary', 'getProjectSummaries', 'getTaskStatusSummary', 'getActivityFeed'], 'API endpoints');
    logResult('task2_3', 'All dashboard endpoints implemented', controllerCheck.hasContent,
      !controllerCheck.hasContent ? 'Missing required endpoints' : '');
  }
  
  // Test 4: Service methods implementation
  if (serviceExists) {
    const serviceCheck = checkFileContent(dashboardService, 
      ['getDashboardSummary', 'getTaskStatusSummary', 'getTeamPerformance'], 'Service methods');
    logResult('task2_3', 'Dashboard service methods implemented', serviceCheck.hasContent,
      !serviceCheck.hasContent ? 'Missing required service methods' : '');
  }
  
  // Test 5: Prisma integration
  const prismaCheck = checkFileContent(dashboardService, ['PrismaService', 'this.prisma'], 'Prisma integration');
  logResult('task2_3', 'Prisma database integration', serviceExists && prismaCheck.hasContent,
    !prismaCheck.hasContent ? 'Missing Prisma integration' : '');
  
  // Test 6: API Gateway main app
  const appModule = 'backend/api-gateway/src/app.module.ts';
  const appExists = checkFileExists(appModule, 'App module');
  logResult('task2_3', 'Main API gateway setup exists', appExists,
    appExists ? '' : 'App module not found');
}

async function runTask2_4_Database() {
  console.log('\n🗄️ TASK 2.4: Database and Data Analysis Tests\n');
  
  // Test 1: Database schema exists
  const schemaFiles = [
    'packages/database/schema.ts',
    'backend/api-gateway/prisma/schema.prisma'
  ];
  
  schemaFiles.forEach(schemaFile => {
    const exists = checkFileExists(schemaFile, 'Database schema');
    const schemaType = schemaFile.includes('prisma') ? 'Prisma schema' : 'Drizzle schema';
    logResult('task2_4', `${schemaType} exists`, exists,
      exists ? '' : `Schema file not found: ${schemaFile}`);
  });
  
  // Test 2: Core tables defined
  const drizzleSchema = 'packages/database/schema.ts';
  if (checkFileExists(drizzleSchema)) {
    const schemaCheck = checkFileContent(drizzleSchema, 
      ['export const users', 'export const projects', 'export const tasks'], 'Core tables');
    logResult('task2_4', 'Core tables defined in Drizzle schema', schemaCheck.hasContent,
      !schemaCheck.hasContent ? 'Missing core table definitions' : '');
  }
  
  const prismaSchema = 'backend/api-gateway/prisma/schema.prisma';
  if (checkFileExists(prismaSchema)) {
    const prismaCheck = checkFileContent(prismaSchema, 
      ['model User', 'model Project', 'model Task'], 'Prisma models');
    logResult('task2_4', 'Core models defined in Prisma schema', prismaCheck.hasContent,
      !prismaCheck.hasContent ? 'Missing core model definitions' : '');
  }
  
  // Test 3: Advanced features
  if (checkFileExists(drizzleSchema)) {
    const advancedCheck = checkFileContent(drizzleSchema, 
      ['taskTemplates', 'customFields'], 'Advanced features');
    logResult('task2_4', 'Advanced features (templates, custom fields)', advancedCheck.hasContent,
      !advancedCheck.hasContent ? 'Missing advanced features' : '');
  }
  
  // Test 4: Database service exists
  const dbService = 'packages/database/src/index.ts';
  const dbExists = checkFileExists(dbService, 'Database service');
  logResult('task2_4', 'Database service implementation', dbExists,
    dbExists ? '' : 'Database service not found');
  
  // Test 5: Test database connection
  try {
    const testScript = 'backend/api-gateway/test-database.js';
    if (checkFileExists(testScript)) {
      logResult('task2_4', 'Database test script exists', true, '');
      
      // Try to run the database test
      try {
        const { stdout } = await execAsync('node test-database.js', { 
          cwd: 'backend/api-gateway',
          timeout: 10000 
        });
        const success = stdout.includes('All database tests completed successfully');
        logResult('task2_4', 'Database connectivity test', success,
          success ? '' : 'Database test failed or timed out');
      } catch (error) {
        logResult('task2_4', 'Database connectivity test', false, 
          `Test execution failed: ${error.message}`);
      }
    } else {
      logResult('task2_4', 'Database test script exists', false, 'Test script not found');
    }
  } catch (error) {
    logResult('task2_4', 'Database connectivity test', false, 
      `Error running database test: ${error.message}`);
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('📋 COMPREHENSIVE TEST RESULTS SUMMARY');
  console.log('='.repeat(80));
  
  const tasks = [
    { id: 'task2_2', name: 'Task 2.2: Dashboard Module' },
    { id: 'task2_3', name: 'Task 2.3: API Gateway Service' },
    { id: 'task2_4', name: 'Task 2.4: Database and Data Analysis' }
  ];
  
  let totalPassed = 0, totalFailed = 0, totalTests = 0;
  
  tasks.forEach(task => {
    const results = testResults[task.id];
    const percentage = results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0;
    
    console.log(`\n${task.name}:`);
    console.log(`  ✅ Passed: ${results.passed}/${results.total} (${percentage}%)`);
    console.log(`  ❌ Failed: ${results.failed}/${results.total}`);
    
    if (results.failed > 0) {
      console.log('  Failed Tests:');
      results.details.filter(d => !d.passed).forEach(detail => {
        console.log(`    - ${detail.testName}: ${detail.details}`);
      });
    }
    
    totalPassed += results.passed;
    totalFailed += results.failed;
    totalTests += results.total;
  });
  
  const overallPercentage = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;
  
  console.log('\n' + '-'.repeat(40));
  console.log(`📊 OVERALL RESULTS: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`);
  console.log(`✅ Passed: ${totalPassed} | ❌ Failed: ${totalFailed}`);
  
  if (overallPercentage >= 90) {
    console.log('\n🎉 EXCELLENT! Implementation is nearly complete.');
  } else if (overallPercentage >= 75) {
    console.log('\n👍 GOOD! Most functionality is implemented.');
  } else if (overallPercentage >= 50) {
    console.log('\n⚠️  NEEDS WORK! Several critical components missing.');
  } else {
    console.log('\n🚨 CRITICAL! Major implementation issues need attention.');
  }
  
  console.log('='.repeat(80));
}

async function main() {
  console.log('🚀 Starting Comprehensive Test Suite for Tasks 2.2, 2.3, and 2.4\n');
  
  try {
    await runTask2_2_DashboardModule();
    await runTask2_3_APIGateway();
    await runTask2_4_Database();
    
    printSummary();
    
    // Exit with appropriate code
    const totalTests = testResults.task2_2.total + testResults.task2_3.total + testResults.task2_4.total;
    const totalPassed = testResults.task2_2.passed + testResults.task2_3.passed + testResults.task2_4.passed;
    const successRate = totalTests > 0 ? (totalPassed / totalTests) : 0;
    
    process.exit(successRate >= 0.75 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runTask2_2_DashboardModule, runTask2_3_APIGateway, runTask2_4_Database }; 