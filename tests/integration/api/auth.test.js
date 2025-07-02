/**
 * Integration Tests for Authentication API
 * Phase 5.1.2 - API Integration Tests
 */
const supertest = require('supertest');
const app = require('../../../src/app');
const { pool } = require('../../../src/config/database');

// Create supertest client
const request = supertest(app);

describe('Authentication API', () => {
  // Test user data
  const testUser = {
    email: 'test-integration@renexus.com',
    password: 'SecurePassword123!',
    name: 'Integration Test User'
  };
  
  let authTokens = {};
  
  beforeAll(async () => {
    // Make sure we're using the test schema
    await pool.query('SET search_path TO test_schema');
    
    // Delete test user if exists (clean slate)
    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
  });

  afterAll(async () => {
    // Clean up test user
    await pool.query('DELETE FROM users WHERE email = $1', [testUser.email]);
  });

  // Test registration
  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const response = await request
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
    });

    test('should return 400 if email already exists', async () => {
      const response = await request
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Email already in use');
    });

    test('should return 400 for invalid data', async () => {
      const invalidUser = {
        email: 'not-an-email',
        password: '123', // Too short
        name: ''  // Empty name
      };
      
      const response = await request
        .post('/api/auth/register')
        .send(invalidUser)
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  // Test login
  describe('POST /api/auth/login', () => {
    test('should login user with valid credentials', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
      
      // Save tokens for later tests
      authTokens = response.body.tokens;
    });

    test('should return 401 for invalid credentials', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!'
        })
        .expect(401);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Invalid email or password');
    });

    test('should return 400 for missing credentials', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: testUser.email
          // Missing password
        })
        .expect(400);
      
      expect(response.body).toHaveProperty('errors');
    });
  });

  // Test refresh token
  describe('POST /api/auth/refresh-token', () => {
    test('should return new tokens with valid refresh token', async () => {
      // Skip test if we don't have tokens from login test
      if (!authTokens.refreshToken) {
        console.warn('Skipping refresh token test - no refresh token available');
        return;
      }

      const response = await request
        .post('/api/auth/refresh-token')
        .send({ refreshToken: authTokens.refreshToken })
        .expect(200);
      
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      
      // Update tokens for future tests
      authTokens = {
        accessToken: response.body.accessToken,
        refreshToken: response.body.refreshToken
      };
    });

    test('should return 401 for invalid refresh token', async () => {
      const response = await request
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(401);
      
      expect(response.body).toHaveProperty('message');
    });
  });

  // Test protected route
  describe('GET /api/auth/profile', () => {
    test('should return user profile with valid token', async () => {
      // Skip test if we don't have tokens from login test
      if (!authTokens.accessToken) {
        console.warn('Skipping profile test - no access token available');
        return;
      }

      const response = await request
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body.email).toBe(testUser.email);
    });

    test('should return 401 without token', async () => {
      const response = await request
        .get('/api/auth/profile')
        .expect(401);
      
      expect(response.body).toHaveProperty('message');
    });

    test('should return 401 with invalid token', async () => {
      const response = await request
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
      
      expect(response.body).toHaveProperty('message');
    });
  });

  // Test logout
  describe('POST /api/auth/logout', () => {
    test('should successfully logout user', async () => {
      // Skip test if we don't have tokens from login test
      if (!authTokens.refreshToken) {
        console.warn('Skipping logout test - no refresh token available');
        return;
      }

      const response = await request
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({ refreshToken: authTokens.refreshToken })
        .expect(200);
      
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Successfully logged out');
      
      // Verify the token is no longer valid
      const profileResponse = await request
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .expect(401);
      
      expect(profileResponse.body).toHaveProperty('message');
    });
  });
});
