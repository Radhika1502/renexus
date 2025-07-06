import request from 'supertest';
import { app } from '../../app';
import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  createTestUser,
  createTestProject,
  createTestTask,
  generateAuthToken 
} from '../setup';
import { PrismaClient } from '@prisma/client';

describe('API Integration Tests', () => {
  let prisma: PrismaClient;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    const user = await createTestUser(prisma);
    userId = user.id;
    authToken = generateAuthToken(user.id);
  });

  afterAll(async () => {
    await teardownTestDatabase(prisma);
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should login an existing user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Projects', () => {
    let projectId: string;

    it('should create a new project', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project',
          description: 'Test project description',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: 'Test Project',
        description: 'Test project description',
      });

      projectId = response.body.id;
    });

    it('should get project details', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: projectId,
        name: 'Test Project',
      });
    });

    it('should update project details', async () => {
      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Project',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        name: 'Updated Project',
        description: 'Updated description',
      });
    });
  });

  describe('Tasks', () => {
    let projectId: string;
    let taskId: string;

    beforeAll(async () => {
      const project = await createTestProject(prisma, userId);
      projectId = project.id;
    });

    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test task description',
          projectId,
          priority: 'HIGH',
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        title: 'Test Task',
        description: 'Test task description',
        priority: 'HIGH',
      });

      taskId = response.body.id;
    });

    it('should get task details', async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: taskId,
        title: 'Test Task',
      });
    });

    it('should update task status', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'IN_PROGRESS',
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: taskId,
        status: 'IN_PROGRESS',
      });
    });
  });

  describe('Notifications', () => {
    it('should get user notifications', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('notifications');
      expect(response.body).toHaveProperty('total');
    });

    it('should mark notification as read', async () => {
      // Create a test notification first
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: 'test',
          title: 'Test Notification',
          message: 'Test message',
          isRead: false,
        },
      });

      const response = await request(app)
        .post(`/api/notifications/${notification.id}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: notification.id,
        isRead: true,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required field 'name'
          description: 'Test project',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle not found errors', async () => {
      const response = await request(app)
        .get('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });
}); 