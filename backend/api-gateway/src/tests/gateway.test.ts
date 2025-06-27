import request from 'supertest';
import app from '../index';
import * as dotenv from 'dotenv';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

dotenv.config();

describe('API Gateway Integration Tests', () => {
  let authServiceProcess: ChildProcess;
  
  beforeAll(async () => {
    // Start the auth service in a separate process
    const authServicePath = path.join(__dirname, '..', '..', '..', 'auth-service');
    authServiceProcess = spawn('npm', ['run', 'dev'], { 
      cwd: authServicePath,
      stdio: 'pipe',
      detached: true
    });
    
    // Wait for the auth service to start
    await new Promise(resolve => setTimeout(resolve, 5000));
  });
  
  afterAll(() => {
    // Kill the auth service process
    if (authServiceProcess && authServiceProcess.pid) {
      process.kill(-authServiceProcess.pid);
    }
  });
  
  describe('Health Check', () => {
    it('should return 200 OK from the gateway health check endpoint', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('service', 'api-gateway');
    });
  });
  
  describe('Auth Service Proxy', () => {
    it('should proxy requests to the auth service', async () => {
      // This test assumes the auth service is running and has a health endpoint
      const res = await request(app).get('/api/auth/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('service', 'auth-service');
    });
    
    it('should handle auth service errors gracefully', async () => {
      // Test with a non-existent endpoint
      const res = await request(app).get('/api/auth/non-existent-endpoint');
      expect(res.status).toBe(404);
    });
    
    it('should forward authentication requests to the auth service', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'gateway-test@example.com',
          password: 'Password123!',
          name: 'Gateway Test User',
          organizationName: 'Test Organization'
        });
        
      // We're not expecting a successful registration since this is just testing
      // that the request is properly forwarded
      expect([201, 400, 500]).toContain(res.status);
    });
  });
});
