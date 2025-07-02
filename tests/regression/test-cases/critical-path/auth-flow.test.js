/**
 * Critical Path Regression Test - Authentication Flow
 * Phase 5.2.3 - Regression Testing
 * 
 * This test validates the core authentication flow functionality:
 * - User registration 
 * - Login
 * - Token refresh
 * - User profile access
 * - Logout
 * 
 * Any regression in these critical paths would severely impact the application.
 */

const { randomBytes } = require('crypto');

// Generate unique test user data to avoid conflicts
const generateTestUser = () => {
  const id = randomBytes(4).toString('hex');
  return {
    name: `Regression Test User ${id}`,
    email: `regtest${id}@example.com`,
    password: 'SecureTestPass123!'
  };
};

describe('Authentication Critical Path Regression Tests', () => {
  // Get the supertest instance
  const request = global.__TEST_REQUEST__;
  
  // Test data
  const testUser = generateTestUser();
  const knownUser = {
    email: 'reg-admin@renexus.com',
    password: 'TestPassword123!'
  };
  
  // Store tokens between tests
  let authTokens = {};
  
  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      const response = await request
        .post('/api/auth/register')
        .send(testUser);
        
      // Verify response code
      expect(response.status).toBe(201);
      
      // Verify response structure
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', testUser.email);
      expect(response.body.user).toHaveProperty('name', testUser.name);
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
      
      // Verify schema
      expect(response.body).toMatchApiSchema('auth');
      
      // Compare with snapshot for regression detection
      await expect(response.body).toMatchRegressionSnapshot('auth-registration-success');
    });
    
    it('should reject duplicate email registration', async () => {
      const response = await request
        .post('/api/auth/register')
        .send(testUser);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('already in use');
      
      // Compare with snapshot for regression detection
      await expect(response.body).toMatchRegressionSnapshot('auth-registration-duplicate');
    });
    
    it('should validate input fields', async () => {
      const invalidUser = {
        name: '',
        email: 'not-an-email',
        password: '123' // Too short
      };
      
      const response = await request
        .post('/api/auth/register')
        .send(invalidUser);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
      
      // Compare with snapshot for regression detection
      await expect(response.body).toMatchRegressionSnapshot('auth-registration-validation');
    });
  });
  
  describe('User Login', () => {
    it('should login a known user successfully', async () => {
      const response = await request
        .post('/api/auth/login')
        .send(knownUser);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user).toHaveProperty('email', knownUser.email);
      expect(response.body.tokens).toHaveProperty('accessToken');
      expect(response.body.tokens).toHaveProperty('refreshToken');
      
      // Store tokens for later tests
      authTokens = response.body.tokens;
      
      // Verify schema
      expect(response.body).toMatchApiSchema('auth');
      
      // Compare with snapshot for regression detection
      await expect(response.body.user).toMatchRegressionSnapshot('auth-login-success-user');
    });
    
    it('should reject invalid credentials', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: knownUser.email,
          password: 'WrongPassword123!'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/invalid|incorrect/i);
      
      // Compare with snapshot for regression detection
      await expect(response.body).toMatchRegressionSnapshot('auth-login-invalid');
    });
    
    it('should validate input fields', async () => {
      const response = await request
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          // Missing password
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      
      // Compare with snapshot for regression detection
      await expect(response.body).toMatchRegressionSnapshot('auth-login-validation');
    });
  });
  
  describe('Token Refresh', () => {
    it('should refresh tokens successfully', async () => {
      // Skip if we don't have authTokens from previous tests
      if (!authTokens.refreshToken) {
        console.warn('⚠️ Skipping token refresh test - no refresh token available');
        return;
      }
      
      const response = await request
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: authTokens.refreshToken
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.accessToken).not.toBe(authTokens.accessToken);
      expect(response.body.refreshToken).not.toBe(authTokens.refreshToken);
      
      // Update tokens for future tests
      authTokens = {
        accessToken: response.body.accessToken,
        refreshToken: response.body.refreshToken
      };
      
      // Compare with snapshot for regression detection
      await expect({
        hasAccessToken: !!response.body.accessToken,
        hasRefreshToken: !!response.body.refreshToken
      }).toMatchRegressionSnapshot('auth-refresh-success');
    });
    
    it('should reject invalid refresh tokens', async () => {
      const response = await request
        .post('/api/auth/refresh-token')
        .send({
          refreshToken: 'invalid-refresh-token'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      
      // Compare with snapshot for regression detection
      await expect(response.body).toMatchRegressionSnapshot('auth-refresh-invalid');
    });
  });
  
  describe('Protected Routes Access', () => {
    it('should access protected profile route with valid token', async () => {
      // Skip if no access token available
      if (!authTokens.accessToken) {
        console.warn('⚠️ Skipping protected route test - no access token available');
        return;
      }
      
      const response = await request
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authTokens.accessToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('role');
      
      // Verify schema
      expect(response.body).toMatchApiSchema('user');
      
      // Compare with snapshot for regression detection
      await expect(response.body).toMatchRegressionSnapshot('auth-profile-success');
    });
    
    it('should reject access without token', async () => {
      const response = await request
        .get('/api/auth/profile');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      
      // Compare with snapshot for regression detection
      await expect(response.body).toMatchRegressionSnapshot('auth-profile-unauthorized');
    });
    
    it('should reject access with invalid token', async () => {
      const response = await request
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
      
      // Compare with snapshot for regression detection
      await expect(response.body).toMatchRegressionSnapshot('auth-profile-invalid-token');
    });
  });
  
  describe('User Logout', () => {
    it('should successfully logout user', async () => {
      // Skip if no tokens available
      if (!authTokens.accessToken || !authTokens.refreshToken) {
        console.warn('⚠️ Skipping logout test - tokens not available');
        return;
      }
      
      const response = await request
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authTokens.accessToken}`)
        .send({
          refreshToken: authTokens.refreshToken
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toMatch(/success|logged out/i);
      
      // Compare with snapshot for regression detection
      await expect(response.body).toMatchRegressionSnapshot('auth-logout-success');
      
      // Verify token is invalidated
      const profileResponse = await request
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${authTokens.accessToken}`);
      
      expect(profileResponse.status).toBe(401);
    });
  });
});
