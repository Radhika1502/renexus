import request from 'supertest';
import { app } from '../app';
import { prisma } from '../db';

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE "Task" CASCADE`;
});

describe('Task Service Endpoints', () => {
  describe('POST /tasks', () => {
    it('should create a new task and return 201', async () => {
      const response = await request(app)
        .post('/tasks')
        .send({
          title: 'Test Task',
          description: 'Test Description',
          projectId: '123'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Task');
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return task by id', async () => {
      // First create a task
      const createRes = await request(app)
        .post('/tasks')
        .send({
          title: 'Test Task',
          description: 'Test Description',
          projectId: '123'
        });
      
      const response = await request(app)
        .get(`/tasks/${createRes.body.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Test Task');
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should update task status and return 200', async () => {
      // First create a task
      const createRes = await request(app)
        .post('/tasks')
        .send({
          title: 'Test Task',
          description: 'Test Description',
          projectId: '123'
        });
      
      const response = await request(app)
        .patch(`/tasks/${createRes.body.id}`)
        .send({
          status: 'Done'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('Done');
    });
  });

  describe('Task Dependencies', () => {
    it('should prevent circular dependencies', async () => {
      // Create Task A
      const taskA = await request(app)
        .post('/tasks')
        .send({
          title: 'Task A',
          projectId: '123'
        });

      // Create Task B
      const taskB = await request(app)
        .post('/tasks')
        .send({
          title: 'Task B',
          projectId: '123'
        });

      // Make Task A block Task B
      await request(app)
        .post(`/tasks/${taskA.body.id}/dependencies`)
        .send({
          blocks: [taskB.body.id]
        });

      // Try to make Task B block Task A (should fail)
      const response = await request(app)
        .post(`/tasks/${taskB.body.id}/dependencies`)
        .send({
          blocks: [taskA.body.id]
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('circular dependency');
    });

    it('should prevent completing task with incomplete blockers', async () => {
      // Create blocking task
      const blocker = await request(app)
        .post('/tasks')
        .send({
          title: 'Blocker Task',
          projectId: '123',
          status: 'In Progress'
        });

      // Create blocked task
      const blocked = await request(app)
        .post('/tasks')
        .send({
          title: 'Blocked Task',
          projectId: '123'
        });

      // Set up dependency
      await request(app)
        .post(`/tasks/${blocker.body.id}/dependencies`)
        .send({
          blocks: [blocked.body.id]
        });

      // Try to complete blocked task (should fail)
      const response = await request(app)
        .patch(`/tasks/${blocked.body.id}`)
        .send({
          status: 'Done'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('blocking tasks are not complete');
    });
  });
}); 