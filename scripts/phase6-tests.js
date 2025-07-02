/**
 * Phase 6 Test Suite
 * 
 * This script runs automated tests to verify that all Phase 6
 * deployment and documentation criteria have been met.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const axios = require('axios');

// Configuration
const config = {
  baseApiUrl: process.env.API_URL || 'http://localhost:3001',
  docsBasePath: path.join(__dirname, '..', 'docs'),
  ciCdConfigPath: path.join(__dirname, '..', '.github', 'workflows', 'ci-cd.yml'),
  configPath: path.join(__dirname, '..', 'config'),
  timeout: 5000 // ms
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0,
  failures: []
};

// Test utility functions
function test(name, fn) {
  results.total++;
  console.log(`\n🧪 Running test: ${name}`);
  try {
    fn();
    console.log(`✅ Passed: ${name}`);
    results.passed++;
  } catch (error) {
    console.error(`❌ Failed: ${name}`);
    console.error(`   Error: ${error.message}`);
    results.failed++;
    results.failures.push({ name, error: error.message });
  }
}

function skip(name) {
  results.total++;
  results.skipped++;
  console.log(`⏭️ Skipped: ${name}`);
}

// File existence helper
function checkFileExists(filePath, description) {
  try {
    const stats = fs.statSync(filePath);
    assert.ok(stats.isFile(), `${description} should be a file`);
    return true;
  } catch (error) {
    throw new Error(`${description} not found at ${filePath}`);
  }
}

// File content validation helper
function validateFileContent(filePath, requiredTerms, description) {
  const content = fs.readFileSync(filePath, 'utf8');
  for (const term of requiredTerms) {
    assert.ok(
      content.includes(term),
      `${description} should include "${term}"`
    );
  }
  return true;
}

/**
 * 6.1 Deployment & DevOps Test Suite
 */
console.log('\n📋 Running Deployment & DevOps Tests');

// 6.1.1 CI/CD Pipeline
test('CI/CD Pipeline Configuration Exists', () => {
  checkFileExists(config.ciCdConfigPath, 'CI/CD workflow configuration');
});

test('CI/CD Pipeline Has Required Stages', () => {
  validateFileContent(
    config.ciCdConfigPath, 
    ['build', 'test', 'deploy', 'staging', 'production'],
    'CI/CD workflow configuration'
  );
});

// 6.1.2 Environment Configuration
test('Environment Configuration Files Exist', () => {
  const environments = ['development', 'staging', 'production'];
  environments.forEach(env => {
    const envFilePath = path.join(config.configPath, 'environments', `${env}.env`);
    checkFileExists(envFilePath, `${env} environment configuration`);
  });
});

test('Environment Configuration Files Have Required Settings', () => {
  const environments = ['development', 'staging', 'production'];
  const requiredSettings = ['PORT', 'DATABASE_URL', 'JWT_SECRET', 'LOG_LEVEL'];
  
  environments.forEach(env => {
    const envFilePath = path.join(config.configPath, 'environments', `${env}.env`);
    const content = fs.readFileSync(envFilePath, 'utf8');
    
    requiredSettings.forEach(setting => {
      assert.ok(
        new RegExp(`${setting}=.+`).test(content),
        `${env} environment should define ${setting}`
      );
    });
  });
});

// 6.1.3 Monitoring & Logging
test('Prometheus Configuration Exists', () => {
  const prometheusConfigPath = path.join(config.configPath, 'prometheus', 'prometheus.yml');
  checkFileExists(prometheusConfigPath, 'Prometheus configuration');
});

test('Alert Rules Configuration Exists', () => {
  const alertRulesPath = path.join(config.configPath, 'prometheus', 'alert_rules.yml');
  checkFileExists(alertRulesPath, 'Prometheus alert rules configuration');
});

test('Logging Configuration Exists', () => {
  const loggerConfigPath = path.join(config.configPath, 'logging', 'logger-config.js');
  checkFileExists(loggerConfigPath, 'Logger configuration');
});

// 6.1.4 High Availability & Disaster Recovery
test('High Availability Configuration Exists', () => {
  const haproxyConfigPath = path.join(config.configPath, 'high-availability', 'haproxy.cfg');
  checkFileExists(haproxyConfigPath, 'HAProxy configuration');
});

test('Failover Script Exists', () => {
  const failoverScriptPath = path.join(__dirname, 'failover.js');
  checkFileExists(failoverScriptPath, 'Failover script');
});

/**
 * 6.2 Documentation & Handover Test Suite
 */
console.log('\n📋 Running Documentation & Handover Tests');

// 6.2.1 Technical Documentation
test('Architecture Documentation Exists', () => {
  const architectureDocPath = path.join(config.docsBasePath, 'technical', 'architecture.md');
  checkFileExists(architectureDocPath, 'Architecture documentation');
});

test('API Documentation Exists', () => {
  const apiDocPath = path.join(config.docsBasePath, 'technical', 'api-documentation.md');
  checkFileExists(apiDocPath, 'API documentation');
});

test('Database Schema Documentation Exists', () => {
  const dbSchemaDocPath = path.join(config.docsBasePath, 'technical', 'database-schema.md');
  checkFileExists(dbSchemaDocPath, 'Database schema documentation');
});

test('Code Documentation Exists', () => {
  const codeDocPath = path.join(config.docsBasePath, 'technical', 'code-documentation.md');
  checkFileExists(codeDocPath, 'Code documentation');
});

// 6.2.2 User Documentation
test('User Guide Exists', () => {
  const userGuidePath = path.join(config.docsBasePath, 'user', 'user-guide.md');
  checkFileExists(userGuidePath, 'User guide');
});

test('Feature Documentation Exists', () => {
  const featureDocPath = path.join(config.docsBasePath, 'user', 'feature-documentation.md');
  checkFileExists(featureDocPath, 'Feature documentation');
});

test('FAQ Exists', () => {
  const faqPath = path.join(config.docsBasePath, 'user', 'faq.md');
  checkFileExists(faqPath, 'FAQ document');
});

// 6.2.3 Maintenance Documentation
test('Maintenance Guide Exists', () => {
  const maintenanceGuidePath = path.join(config.docsBasePath, 'maintenance', 'maintenance-guide.md');
  checkFileExists(maintenanceGuidePath, 'Maintenance guide');
});

test('Troubleshooting Guide Exists', () => {
  const troubleshootingGuidePath = path.join(config.docsBasePath, 'maintenance', 'troubleshooting-guide.md');
  checkFileExists(troubleshootingGuidePath, 'Troubleshooting guide');
});

test('System Administration Guide Exists', () => {
  const sysAdminGuidePath = path.join(config.docsBasePath, 'maintenance', 'system-administration.md');
  checkFileExists(sysAdminGuidePath, 'System administration guide');
});

// 6.2.4 Knowledge Transfer Materials
test('Onboarding Guide Exists', () => {
  const onboardingGuidePath = path.join(config.docsBasePath, 'knowledge-transfer', 'onboarding-guide.md');
  checkFileExists(onboardingGuidePath, 'Onboarding guide');
});

test('Technical Workshops Exists', () => {
  const workshopsPath = path.join(config.docsBasePath, 'knowledge-transfer', 'technical-workshops.md');
  checkFileExists(workshopsPath, 'Technical workshops');
});

test('Handover Document Exists', () => {
  const handoverDocPath = path.join(config.docsBasePath, 'knowledge-transfer', 'handover-document.md');
  checkFileExists(handoverDocPath, 'Handover document');
});

// Document Content Quality Tests
test('Technical Documentation Completeness', () => {
  const architectureDocPath = path.join(config.docsBasePath, 'technical', 'architecture.md');
  validateFileContent(
    architectureDocPath,
    ['Components', 'Database', 'API', 'Frontend', 'Authentication'],
    'Architecture documentation'
  );
  
  const apiDocPath = path.join(config.docsBasePath, 'technical', 'api-documentation.md');
  validateFileContent(
    apiDocPath,
    ['Endpoints', 'Authentication', 'Request', 'Response', 'Error'],
    'API documentation'
  );
});

test('User Documentation Completeness', () => {
  const userGuidePath = path.join(config.docsBasePath, 'user', 'user-guide.md');
  validateFileContent(
    userGuidePath,
    ['Getting Started', 'Dashboard', 'Projects', 'Tasks'],
    'User guide'
  );
  
  const faqPath = path.join(config.docsBasePath, 'user', 'faq.md');
  validateFileContent(
    faqPath,
    ['How do I', 'account', 'password', 'support'],
    'FAQ document'
  );
});

test('Maintenance Documentation Completeness', () => {
  const maintenanceGuidePath = path.join(config.docsBasePath, 'maintenance', 'maintenance-guide.md');
  validateFileContent(
    maintenanceGuidePath,
    ['Backup', 'Monitoring', 'Database', 'Deployment'],
    'Maintenance guide'
  );
  
  const troubleshootingGuidePath = path.join(config.docsBasePath, 'maintenance', 'troubleshooting-guide.md');
  validateFileContent(
    troubleshootingGuidePath,
    ['Common Issues', 'Logs', 'Error', 'Recovery'],
    'Troubleshooting guide'
  );
});

test('Knowledge Transfer Materials Completeness', () => {
  const onboardingGuidePath = path.join(config.docsBasePath, 'knowledge-transfer', 'onboarding-guide.md');
  validateFileContent(
    onboardingGuidePath,
    ['Setup', 'Environment', 'Architecture', 'Development'],
    'Onboarding guide'
  );
  
  const handoverDocPath = path.join(config.docsBasePath, 'knowledge-transfer', 'handover-document.md');
  validateFileContent(
    handoverDocPath,
    ['Project Overview', 'Contacts', 'Timeline', 'Components'],
    'Handover document'
  );
});

// Write results to file for better tracking
fs.writeFileSync('phase6-test-results.json', JSON.stringify({
  summary: {
    total: results.total,
    passed: results.passed,
    failed: results.failed,
    skipped: results.skipped
  },
  failures: results.failures
}, null, 2));

// Print test summary
console.log('\n📊 Test Summary:');
console.log(`Total: ${results.total}`);
console.log(`Passed: ${results.passed}`);
console.log(`Failed: ${results.failed}`);
console.log(`Skipped: ${results.skipped}`);

if (results.failures.length > 0) {
  console.log('\n❌ Failed Tests:');
  results.failures.forEach((failure, index) => {
    console.log(`${index + 1}. ${failure.name}: ${failure.error}`);
  });
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed! Phase 6 implementation meets all required criteria.');
  process.exit(0);
}
