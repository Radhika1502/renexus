import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express, { Application } from 'express';
import apiRoutes from '../../api/routes';
import { db } from '../../database/db';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/renexus_test';

// Mock authentication for E2E tests
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'admin',
  tenantId: 'test-tenant-id',
};

// Mock JWT token generation
jest.mock('../../services/auth/auth.service', () => ({
  generateToken: () => 'mock-jwt-token',
  verifyToken: () => ({ userId: mockUser.id }),
}));

// Mock database queries
jest.mock('../../database/db', () => ({
  db: {
    query: {
      users: {
        findFirst: jest.fn().mockResolvedValue(mockUser),
      },
      tenantUsers: {
        findFirst: jest.fn().mockResolvedValue({ 
          userId: mockUser.id, 
          tenantId: mockUser.tenantId, 
          role: 'admin' 
        }),
      },
    },
  },
}));

describe('API E2E Tests', () => {
  let app: Application;
  let authToken: string;
  
  beforeAll(async () => {
    // Set up Express app with all routes
    app = express() as Application;
    app.use(express.json());
    app.use('/api', apiRoutes);
    
    // Get auth token for subsequent requests
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    authToken = loginResponse.body.data.token;
  });
  
  afterAll(() => {
    jest.clearAllMocks();
  });
  
  describe('Authentication Flow', () => {
    it('should allow user to login and receive a token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password' });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
    });
    
    it('should verify user token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('valid', true);
    });
  });
  
  describe('Project Management Flow', () => {
    let projectId: string;
    
    it('should create a new project', async () => {
      const projectData = {
        name: 'E2E Test Project',
        description: 'Project created during E2E testing',
        status: 'active',
      };
      
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData);
      
      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('name', projectData.name);
      
      projectId = response.body.data.id;
    });
    
    it('should retrieve project details', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('id', projectId);
    });
    
    it('should update a project', async () => {
      const updateData = {
        name: 'Updated E2E Test Project',
        description: 'Updated project description',
      };
      
      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('name', updateData.name);
    });
    
    it('should apply a project template', async () => {
      const templateId = 'test-template-id';
      
      const response = await request(app)
        .post(`/api/project-templates/${templateId}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ projectId });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });
  
  describe('Task Management Flow', () => {
    let taskId: string;
    const projectId = 'test-project-id';
    
    it('should create a new task', async () => {
      const taskData = {
        title: 'E2E Test Task',
        description: 'Task created during E2E testing',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId,
      };
      
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData);
      
      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('title', taskData.title);
      
      taskId = response.body.data.id;
    });
    
    it('should retrieve task details', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('id', taskId);
    });
    
    it('should update a task', async () => {
      const updateData = {
        title: 'Updated E2E Test Task',
        description: 'Updated task description',
        status: 'IN_PROGRESS',
      };
      
      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('title', updateData.title);
      expect(response.body.data).toHaveProperty('status', updateData.status);
    });
    
    it('should assign a user to a task', async () => {
      const userId = 'test-user-id';
      
      const response = await request(app)
        .post(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('taskId', taskId);
      expect(response.body.data).toHaveProperty('userId', userId);
    });
    
    it('should apply a task template', async () => {
      const templateId = 'test-template-id';
      
      const response = await request(app)
        .post(`/api/task-templates/${templateId}/apply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ projectId });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });
  
  describe('Error Handling', () => {
    it('should handle not found resources', async () => {
      const response = await request(app)
        .get('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });
    
    it('should handle validation errors', async () => {
      const invalidData = {
        // Missing required name field
        description: 'Invalid project data',
      };
      
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
    
    it('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
      expect(response.body.status).toBe('error');
    });
  });
});
