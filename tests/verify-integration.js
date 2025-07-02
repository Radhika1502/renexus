/**
 * Standalone Integration Test Verification
 * 
 * This script runs integration tests with full console output
 * to ensure we can see exactly what's happening
 */

// Force test environment
process.env.NODE_ENV = 'test';

const express = require('express');
const request = require('supertest');
const { testDb } = require('./setup/test-db');

// Import project routes and service
const projectRoutes = require('../services/projects/project.routes');
const { projectService } = require('../services/projects/project.service');

// Mock authentication middleware
jest.mock('../services/auth/auth.middleware', () => ({
  authenticate: (req, res, next) => {
    req.user = {
      id: 'test-user-1', 
      tenantId: 'test-tenant-1',
      email: 'test1@example.com',
      role: 'ADMIN'
    };
    next();
  },
  requireTenantAccess: (req, res, next) => next(),
  requireRole: (roles) => (req, res, next) => next()
}));

// Setup Express app
async function setupApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/projects', projectRoutes);
  return app;
}

// Test: Get all projects
async function testGetProjects(app) {
  console.log('\n=== TESTING GET ALL PROJECTS ===');
  try {
    const response = await request(app).get('/api/projects');
    console.log(`Status code: ${response.status}`);
    console.log(`Response body: ${JSON.stringify(response.body, null, 2)}`);
    
    if (response.status === 200 && response.body.status === 'success') {
      console.log('✓ Test passed!');
      return true;
    } else {
      console.log('✗ Test failed!');
      return false;
    }
  } catch (error) {
    console.error('Error in GET /api/projects test:', error);
    return false;
  }
}

// Test: Create a project
async function testCreateProject(app) {
  console.log('\n=== TESTING CREATE PROJECT ===');
  try {
    const projectData = {
      name: `Integration Test Project ${Date.now()}`,
      description: 'Project created during integration testing',
      status: 'planning',
      priority: 'medium'
    };
    
    console.log(`Project data: ${JSON.stringify(projectData, null, 2)}`);
    const response = await request(app)
      .post('/api/projects')
      .send(projectData);
    
    console.log(`Status code: ${response.status}`);
    console.log(`Response body: ${JSON.stringify(response.body, null, 2)}`);
    
    if (response.status === 201 && response.body.status === 'success') {
      console.log('✓ Test passed!');
      
      // Return the project ID for cleanup
      return response.body.data.id;
    } else {
      console.log('✗ Test failed!');
      return null;
    }
  } catch (error) {
    console.error('Error in POST /api/projects test:', error);
    return null;
  }
}

// Test: Get project by ID
async function testGetProjectById(app, projectId) {
  console.log('\n=== TESTING GET PROJECT BY ID ===');
  console.log(`Project ID: ${projectId}`);
  
  try {
    const response = await request(app).get(`/api/projects/${projectId}`);
    console.log(`Status code: ${response.status}`);
    console.log(`Response body: ${JSON.stringify(response.body, null, 2)}`);
    
    if (response.status === 200 && response.body.status === 'success') {
      console.log('✓ Test passed!');
      return true;
    } else {
      console.log('✗ Test failed!');
      return false;
    }
  } catch (error) {
    console.error(`Error in GET /api/projects/${projectId} test:`, error);
    return false;
  }
}

// Test: Delete project
async function testDeleteProject(app, projectId) {
  console.log('\n=== TESTING DELETE PROJECT ===');
  console.log(`Project ID to delete: ${projectId}`);
  
  try {
    const response = await request(app).delete(`/api/projects/${projectId}`);
    console.log(`Status code: ${response.status}`);
    console.log(`Response body: ${JSON.stringify(response.body, null, 2)}`);
    
    if (response.status === 200 && response.body.status === 'success') {
      console.log('✓ Test passed!');
      return true;
    } else {
      console.log('✗ Test failed!');
      return false;
    }
  } catch (error) {
    console.error(`Error in DELETE /api/projects/${projectId} test:`, error);
    return false;
  }
}

// Run all tests
async function runIntegrationTests() {
  console.log('=== STARTING INTEGRATION TESTS ===');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Using database: ${testDb.isUsingRealDb ? 'REAL' : 'MOCK'}`);
  
  let projectId = null;
  let success = true;
  
  try {
    // Setup app
    const app = await setupApp();
    console.log('Express app created successfully');
    
    // Run tests
    success = success && (await testGetProjects(app));
    projectId = await testCreateProject(app);
    
    if (projectId) {
      success = success && (await testGetProjectById(app, projectId));
      success = success && (await testDeleteProject(app, projectId));
    } else {
      console.log('Skipping project ID tests as project creation failed');
      success = false;
    }
    
    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Overall success: ${success ? '✓ PASS' : '✗ FAIL'}`);
    
  } catch (error) {
    console.error('Unhandled error in tests:', error);
    success = false;
  } finally {
    // Clean up
    try {
      if (projectId) {
        console.log(`\nCleaning up test project ${projectId}...`);
        await projectService.deleteProject(projectId);
      }
      
      await testDb.close();
      console.log('Database connection closed');
    } catch (err) {
      console.error('Error in cleanup:', err);
    }
    
    console.log('=== INTEGRATION TESTS COMPLETE ===');
    return success;
  }
}

// Run tests and exit with appropriate code
runIntegrationTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
