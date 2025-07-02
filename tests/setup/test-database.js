/**
 * Test Database Setup
 * 
 * This module initializes a test database with real data
 * for running integration tests.
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { db, pool } = require('../../database/db');

// Test data for seeding the database
const TEST_DATA = {
  projects: [
    {
      id: 'test-project-1',
      name: 'Integration Test Project 1', 
      description: 'Project for integration testing',
      status: 'active',
      tenant_id: 'test-tenant-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'test-project-2',
      name: 'Integration Test Project 2',
      description: 'Second project for integration testing',
      status: 'archived',
      tenant_id: 'test-tenant-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  users: [
    {
      id: 'test-user-1',
      name: 'Test User 1',
      email: 'test1@example.com',
      tenant_id: 'test-tenant-1',
      role: 'ADMIN',
      password_hash: '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Dummy hash
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'test-user-2',
      name: 'Test User 2',
      email: 'test2@example.com',
      tenant_id: 'test-tenant-1',
      role: 'USER',
      password_hash: '$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Dummy hash
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  tasks: [
    {
      id: 'test-task-1',
      title: 'Integration Test Task 1',
      description: 'Task for integration testing',
      status: 'TODO',
      priority: 'MEDIUM',
      project_id: 'test-project-1',
      assigned_to: 'test-user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
    },
    {
      id: 'test-task-2', 
      title: 'Integration Test Task 2',
      description: 'Second task for integration testing',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      project_id: 'test-project-1',
      assigned_to: 'test-user-2',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
    }
  ],
  time_logs: [
    {
      id: 'test-log-1',
      task_id: 'test-task-1',
      user_id: 'test-user-1',
      description: 'Working on test task 1',
      start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      duration: 3600, // 1 hour in seconds
      created_at: new Date().toISOString()
    },
    {
      id: 'test-log-2',
      task_id: 'test-task-2',
      user_id: 'test-user-2',
      description: 'Working on test task 2',
      start_time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      duration: 10800, // 3 hours in seconds
      created_at: new Date().toISOString()
    }
  ]
};

/**
 * Setup the test database with schema and seed data
 */
async function setupTestDatabase() {
  console.log('Setting up test database...');
  
  try {
    // Ensure we're using the test database
    if (process.env.NODE_ENV !== 'test') {
      process.env.NODE_ENV = 'test';
      console.log('Forcing NODE_ENV to "test"');
    }
    
    // Clear existing data
    await clearTestData();
    
    // Insert seed data
    await seedTestData();
    
    console.log('Test database setup completed successfully');
    return true;
  } catch (err) {
    console.error('Error setting up test database:', err);
    return false;
  }
}

/**
 * Clear all test data from the database
 */
async function clearTestData() {
  console.log('Clearing existing test data...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Delete in reverse order to respect foreign key constraints
    await client.query('DELETE FROM time_logs WHERE id LIKE $1', ['test-%']);
    await client.query('DELETE FROM tasks WHERE id LIKE $1', ['test-%']);
    await client.query('DELETE FROM projects_users WHERE project_id LIKE $1', ['test-%']);
    await client.query('DELETE FROM projects WHERE id LIKE $1', ['test-%']);
    await client.query('DELETE FROM users WHERE id LIKE $1', ['test-%']);
    
    await client.query('COMMIT');
    console.log('Successfully cleared test data');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error clearing test data:', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Seed the test database with test data
 */
async function seedTestData() {
  console.log('Seeding test database with test data...');
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert users
    for (const user of TEST_DATA.users) {
      await client.query(
        `INSERT INTO users (id, name, email, tenant_id, role, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE
         SET name = $2, email = $3, tenant_id = $4, role = $5, password_hash = $6, updated_at = $8`,
        [user.id, user.name, user.email, user.tenant_id, user.role, user.password_hash, user.created_at, user.updated_at]
      );
    }
    
    // Insert projects
    for (const project of TEST_DATA.projects) {
      await client.query(
        `INSERT INTO projects (id, name, description, status, tenant_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE
         SET name = $2, description = $3, status = $4, tenant_id = $5, updated_at = $7`,
        [project.id, project.name, project.description, project.status, project.tenant_id, project.created_at, project.updated_at]
      );
      
      // Associate projects with users
      await client.query(
        `INSERT INTO projects_users (project_id, user_id, role, assigned_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (project_id, user_id) DO NOTHING`,
        [project.id, TEST_DATA.users[0].id, 'OWNER', new Date().toISOString()]
      );
    }
    
    // Insert tasks
    for (const task of TEST_DATA.tasks) {
      await client.query(
        `INSERT INTO tasks (id, title, description, status, priority, project_id, assigned_to, created_at, updated_at, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE
         SET title = $2, description = $3, status = $4, priority = $5, project_id = $6, assigned_to = $7, updated_at = $9, due_date = $10`,
        [task.id, task.title, task.description, task.status, task.priority, task.project_id, task.assigned_to, task.created_at, task.updated_at, task.due_date]
      );
    }
    
    // Insert time logs
    for (const log of TEST_DATA.time_logs) {
      await client.query(
        `INSERT INTO time_logs (id, task_id, user_id, description, start_time, end_time, duration, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE
         SET task_id = $2, user_id = $3, description = $4, start_time = $5, end_time = $6, duration = $7`,
        [log.id, log.task_id, log.user_id, log.description, log.start_time, log.end_time, log.duration, log.created_at]
      );
    }
    
    await client.query('COMMIT');
    console.log('Successfully seeded test data');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding test data:', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Cleanup test database after tests complete
 */
async function cleanupTestDatabase() {
  console.log('Cleaning up test database...');
  
  try {
    await clearTestData();
    console.log('Test database cleanup completed successfully');
    await pool.end();
    return true;
  } catch (err) {
    console.error('Error cleaning up test database:', err);
    return false;
  }
}

module.exports = {
  setupTestDatabase,
  clearTestData,
  seedTestData,
  cleanupTestDatabase,
  TEST_DATA
};
