#!/usr/bin/env node

/**
 * Comprehensive Implementation Status Check
 * Verifies sections 2.2, 2.3, and 2.4 implementation status
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Checking Implementation Status for Sections 2.2, 2.3, and 2.4...\n');

const results = {
  section_2_2: { name: 'Dashboard Module', checks: [], score: 0, total: 0 },
  section_2_3: { name: 'API Gateway Service', checks: [], score: 0, total: 0 },
  section_2_4: { name: 'Database Implementation', checks: [], score: 0, total: 0 }
};

function checkImplementation(description, checkFn, section) {
  results[section].total++;
  
  try {
    const result = checkFn();
    if (result.status) {
      console.log(`✅ ${description}: ${result.details}`);
      results[section].checks.push({ desc: description, status: 'PASS', details: result.details });
      results[section].score++;
    } else {
      console.log(`❌ ${description}: ${result.details}`);
      results[section].checks.push({ desc: description, status: 'FAIL', details: result.details });
    }
  } catch (error) {
    console.log(`❌ ${description}: ERROR - ${error.message}`);
    results[section].checks.push({ desc: description, status: 'ERROR', details: error.message });
  }
}

// Section 2.2: Dashboard Module
console.log('📊 Section 2.2: Dashboard Module\n');

checkImplementation('DashboardSummaryCard component', () => {
  const filePath = 'src/features/dashboard/components/DashboardSummaryCard.tsx';
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasLoadingStates = content.includes('isLoading') && content.includes('animate-pulse');
    return { status: hasLoadingStates, details: hasLoadingStates ? 'Complete with loading states' : 'Missing loading states' };
  }
  return { status: false, details: 'File not found' };
}, 'section_2_2');

checkImplementation('ProjectProgressCard component', () => {
  const filePath = 'src/features/dashboard/components/ProjectProgressCard.tsx';
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasProgressBars = content.includes('progress') && content.includes('bg-blue-600');
    return { status: hasProgressBars, details: hasProgressBars ? 'Complete with progress bars' : 'Missing progress visualization' };
  }
  return { status: false, details: 'File not found' };
}, 'section_2_2');

checkImplementation('TaskStatusChart component', () => {
  const filePath = 'src/features/dashboard/components/TaskStatusChart.tsx';
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasRecharts = content.includes('PieChart') && content.includes('ResponsiveContainer');
    return { status: hasRecharts, details: hasRecharts ? 'Complete with Recharts integration' : 'Missing chart functionality' };
  }
  return { status: false, details: 'File not found' };
}, 'section_2_2');

checkImplementation('ActivityFeed component', () => {
  const filePath = 'src/features/dashboard/components/ActivityFeed.tsx';
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasRealTimeData = content.includes('useActivityFeed') && content.includes('formatTimeAgo');
    return { status: hasRealTimeData, details: hasRealTimeData ? 'Complete with real-time functionality' : 'Missing real-time features' };
  }
  return { status: false, details: 'File not found' };
}, 'section_2_2');

checkImplementation('Dashboard hooks with real API calls', () => {
  const filePath = 'src/features/dashboard/hooks/useDashboard.ts';
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasRealAPI = content.includes('dashboardService') && content.includes('useQuery') && !content.includes('mock');
    return { status: hasRealAPI, details: hasRealAPI ? 'Using real API calls with React Query' : 'Still using mock data or missing API integration' };
  }
  return { status: false, details: 'File not found' };
}, 'section_2_2');

checkImplementation('Dashboard service implementation', () => {
  const filePath = 'src/features/dashboard/api/dashboardService.ts';
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasAllEndpoints = content.includes('getDashboardSummary') && 
                           content.includes('getProjectSummaries') &&
                           content.includes('getTaskStatusSummary') &&
                           content.includes('getActivityFeed');
    return { status: hasAllEndpoints, details: hasAllEndpoints ? 'All required endpoints implemented' : 'Missing some endpoints' };
  }
  return { status: false, details: 'File not found' };
}, 'section_2_2');

// Section 2.3: API Gateway Service
console.log('\n🔌 Section 2.3: API Gateway Service\n');

checkImplementation('Dashboard backend controller', () => {
  const filePath = '../backend/api-gateway/src/features/dashboard/dashboard.controller.ts';
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasEndpoints = content.includes('@Get(\'summary\')') && 
                        content.includes('@Get(\'projects\')') &&
                        content.includes('@Get(\'activity\')');
    return { status: hasEndpoints, details: hasEndpoints ? 'All dashboard endpoints implemented' : 'Missing some endpoints' };
  }
  return { status: false, details: 'File not found' };
}, 'section_2_3');

checkImplementation('Dashboard backend service', () => {
  const filePath = '../backend/api-gateway/src/features/dashboard/dashboard.service.ts';
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasImplementation = content.includes('getProjectSummaries') && 
                             content.includes('getActivityFeed') &&
                             content.includes('prisma');
    return { status: hasImplementation, details: hasImplementation ? 'Service methods implemented with database integration' : 'Missing service implementation' };
  }
  return { status: false, details: 'File not found' };
}, 'section_2_3');

checkImplementation('Task analytics controller', () => {
  const filePath = '../backend/api-gateway/src/features/task-analytics/task-analytics.controller.ts';
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasAnalytics = content.includes('getTaskAnalytics') && content.includes('prisma');
    return { status: hasAnalytics, details: hasAnalytics ? 'Task analytics implemented' : 'Missing analytics implementation' };
  }
  return { status: false, details: 'File not found' };
}, 'section_2_3');

checkImplementation('Authentication system', () => {
  const filePath = '../backend/api-gateway/src/routes/auth.routes.ts';
  const exists = fs.existsSync(filePath);
  return { status: exists, details: exists ? 'Auth routes exist' : 'Auth routes missing' };
}, 'section_2_3');

checkImplementation('Main API gateway setup', () => {
  const filePath = '../backend/api-gateway/src/main.ts';
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasNestJS = content.includes('NestFactory') && 
                     content.includes('ValidationPipe') &&
                     content.includes('enableCors');
    return { status: hasNestJS, details: hasNestJS ? 'Complete NestJS setup with validation and CORS' : 'Incomplete API gateway setup' };
  }
  return { status: false, details: 'File not found' };
}, 'section_2_3');

// Section 2.4: Database Implementation
console.log('\n🗄️ Section 2.4: Database Implementation\n');

checkImplementation('Core database schema (Drizzle)', () => {
  const filePath = '../packages/database/schema.ts';
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasCoreSchema = content.includes('export const users') && 
                         content.includes('export const projects') &&
                         content.includes('export const tasks') &&
                         content.includes('export const taskAssignees');
    return { status: hasCoreSchema, details: hasCoreSchema ? 'Core schema tables implemented' : 'Missing core schema tables' };
  }
  return { status: false, details: 'File not found' };
}, 'section_2_4');

checkImplementation('Prisma schema compatibility', () => {
  const filePath = '../backend/api-gateway/prisma/schema.prisma';
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasModels = content.includes('model Task') && 
                     content.includes('model Project') &&
                     content.includes('model TimeLog');
    return { status: hasModels, details: hasModels ? 'Prisma models defined' : 'Missing Prisma models' };
  }
  return { status: false, details: 'File not found' };
}, 'section_2_4');

checkImplementation('Task dependencies schema', () => {
  const filePath = '../backend/api-gateway/prisma/schema.prisma';
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasDependencies = content.includes('TaskDependency');
    return { status: hasDependencies, details: hasDependencies ? 'Task dependencies implemented' : 'Task dependencies missing from schema' };
  }
  return { status: false, details: 'File not found' };
}, 'section_2_4');

checkImplementation('Multi-tenant architecture', () => {
  const filePath = '../packages/database/schema.ts';
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasMultiTenant = content.includes('export const tenants') && 
                          content.includes('tenantId');
    return { status: hasMultiTenant, details: hasMultiTenant ? 'Multi-tenant architecture implemented' : 'Missing multi-tenant support' };
  }
  return { status: false, details: 'File not found' };
}, 'section_2_4');

checkImplementation('Advanced features (templates, custom fields)', () => {
  const filePath = '../packages/database/schema.ts';
  const exists = fs.existsSync(filePath);
  if (exists) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasAdvanced = content.includes('taskTemplates') && 
                       content.includes('customFields') &&
                       content.includes('jsonb');
    return { status: hasAdvanced, details: hasAdvanced ? 'Advanced features implemented' : 'Missing advanced features' };
  }
  return { status: false, details: 'File not found' };
}, 'section_2_4');

// Generate comprehensive report
console.log('\n📋 COMPREHENSIVE IMPLEMENTATION REPORT\n');
console.log('========================================');

let totalScore = 0;
let totalPossible = 0;

Object.keys(results).forEach(sectionKey => {
  const section = results[sectionKey];
  const percentage = section.total > 0 ? Math.round((section.score / section.total) * 100) : 0;
  
  console.log(`\n${section.name}: ${section.score}/${section.total} (${percentage}%)`);
  
  // Show detailed results
  section.checks.forEach(check => {
    const icon = check.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${icon} ${check.desc}`);
    if (check.status !== 'PASS') {
      console.log(`     → ${check.details}`);
    }
  });
  
  totalScore += section.score;
  totalPossible += section.total;
});

const overallPercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

console.log('\n========================================');
console.log(`🎯 OVERALL IMPLEMENTATION STATUS: ${totalScore}/${totalPossible} (${overallPercentage}%)`);

// Status assessment
if (overallPercentage >= 100) {
  console.log('🎉 EXCELLENT: All implementation criteria met!');
} else if (overallPercentage >= 85) {
  console.log('✅ VERY GOOD: Implementation is largely complete');
} else if (overallPercentage >= 75) {
  console.log('👍 GOOD: Most features implemented, some work remaining');
} else if (overallPercentage >= 50) {
  console.log('⚠️ PARTIAL: Significant implementation work needed');
} else {
  console.log('❌ INCOMPLETE: Major implementation gaps identified');
}

console.log('\nRECOMMENDATIONS:');
Object.keys(results).forEach(sectionKey => {
  const section = results[sectionKey];
  const failed = section.checks.filter(c => c.status !== 'PASS');
  if (failed.length > 0) {
    console.log(`\n${section.name}:`);
    failed.forEach(check => {
      console.log(`  • Fix: ${check.desc}`);
    });
  }
});

process.exit(overallPercentage >= 75 ? 0 : 1); 