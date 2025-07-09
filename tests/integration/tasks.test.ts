// @ts-nocheck
import request from 'supertest';
import express, { Application } from 'express';
import { jest, describe, it, expect, beforeEach, afterEach, beforeAll } from '@jest/globals';
import taskRoutes from '../../services/tasks/task.routes';
import { TaskService } from '../../services/tasks/task.service';
// Import coverage helpers and db mocks
const { createTaskServiceMock } = require('./test-coverage-helpers');
const { dbMock, schemaMock } = require('../db-mock');

// Mock authentication middleware
jest.mock('../../services/auth/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'test-user-id',
      tenantId: 'test-tenant-id',
      email: 'test@example.com',
      role: 'admin',
    };
    next();
  },
  requireTenantAccess: (req: any, res: any, next: any) => {
    next();
  },
  requireRole: (roles: string[]) => (req: any, res: any, next: any) => {
    next();
  },
}));

// Mock the db module first to prevent the actual import error
jest.mock('../../../packages/database/db', () => ({
  db: dbMock
}));

// Mock the schema imports
jest.mock('../../db/schema', () => schemaMock);

// Mock TaskService completely
jest.mock('../../services/tasks/task.service', () => {
  return {
    TaskService: jest.fn().mockImplementation(() => {
      return {
        getTasksByTenant: jest.fn().mockResolvedValue({
          data: [
            {
              id: 'task-1',
              title: 'Task 1',
              description: 'Description 1',
              status: 'TODO',
              priority: 'MEDIUM',
              projectId: 'project-1',
            },
            {
              id: 'task-2',
              title: 'Task 2',
              description: 'Description 2',
              status: 'IN_PROGRESS',
              priority: 'HIGH',
              projectId: 'project-1',
            },
          ],
          pagination: {
            total: 2,
            page: 1,
            limit: 10,
          },
        }),
        getTasksByProject: jest.fn().mockResolvedValue({
          data: [
            { id: 'task-1', title: 'Task 1', status: 'TODO', projectId: 'project-1' },
            { id: 'task-2', title: 'Task 2', status: 'IN_PROGRESS', projectId: 'project-1' }
          ],
          pagination: { total: 2, page: 1, limit: 10 }
        }),
        createTask: jest.fn().mockResolvedValue({
          id: 'new-task-id',
          title: 'New Task',
          description: 'Task description',
          status: 'TODO',
          projectId: 'project-1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }),
        getTaskById: jest.fn().mockResolvedValue({
          id: 'task-1',
          title: 'Task 1',
          description: 'Task description',
          status: 'TODO',
          projectId: 'project-1'
        }),
        updateTask: jest.fn().mockResolvedValue({
          id: 'task-1',
          title: 'Updated Task',
          description: 'Updated description',
          status: 'IN_PROGRESS',
          projectId: 'project-1',
          updatedAt: new Date().toISOString()
        }),
        deleteTask: jest.fn().mockResolvedValue({ success: true }),
        getTasksByUser: jest.fn(),
        searchTasks: jest.fn(),
        assignTask: jest.fn(),
        getTaskAssignees: jest.fn(),
        removeTaskAssignee: jest.fn(),
      };
    })
  };
});

// No need for beforeAll setup since TaskService is now completely mocked

describe('Task API Integration Tests', () => {
  let app: Application;
  
  beforeEach(() => {
    app = express() as Application;
    app.use(express.json());
    app.use('/api/tasks', taskRoutes);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/tasks', () => {
    it('should return a list of tasks', async () => {
      // Arrange
      const mockTasks = {
        data: [
          {
            id: 'task-1',
            title: 'Task 1',
            description: 'Description 1',
            status: 'TODO',
            priority: 'MEDIUM',
            projectId: 'project-1',
          },
          {
            id: 'task-2',
            title: 'Task 2',
            description: 'Description 2',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            projectId: 'project-1',
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
        },
      };
      
      (TaskService.prototype.getTasksByTenant as jest.Mock).mockResolvedValue(mockTasks);
      
      // Act
      const response = await request(app).get('/api/tasks');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockTasks.data);
      expect(response.body.pagination).toEqual(mockTasks.pagination);
    });
    
    it('should handle errors', async () => {
      // Arrange
      (TaskService.prototype.getTasksByTenant as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );
      
      // Act
      const response = await request(app).get('/api/tasks');
      
      // Assert
      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
    });
  });
  
  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      // Arrange
      const mockTask = {
        id: 'new-task-id',
        title: 'New Task',
        description: 'New Description',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: 'project-1',
      };
      
      const taskData = {
        title: 'New Task',
        description: 'New Description',
        projectId: 'project-1',
      };
      
      (TaskService.prototype.createTask as jest.Mock).mockResolvedValue(mockTask);
      
      // Act
      const response = await request(app)
        .post('/api/tasks')
        .send(taskData);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockTask);
    });
    
    it('should handle validation errors', async () => {
      // Arrange
      const invalidTaskData = {
        // Missing required title field
        description: 'New Description',
        projectId: 'project-1',
      };
      
      (TaskService.prototype.createTask as jest.Mock).mockImplementation(() => {
        throw { name: 'ZodError', errors: [{ path: ['title'], message: 'Required' }] };
      });
      
      // Act
      const response = await request(app)
        .post('/api/tasks')
        .send(invalidTaskData);
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });
  
  describe('GET /api/tasks/:taskId', () => {
    it('should return a task by ID', async () => {
      // Arrange
      const mockTask = {
        id: 'task-1',
        title: 'Task 1',
        description: 'Description 1',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: 'project-1',
      };
      
      (TaskService.prototype.getTaskById as jest.Mock).mockResolvedValue(mockTask);
      
      // Act
      const response = await request(app).get('/api/tasks/task-1');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockTask);
    });
    
    it('should return 404 when task not found', async () => {
      // Arrange
      (TaskService.prototype.getTaskById as jest.Mock).mockResolvedValue(null);
      
      // Act
      const response = await request(app).get('/api/tasks/non-existent-id');
      
      // Assert
      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });
  });
  
  describe('PUT /api/tasks/:taskId', () => {
    it('should update a task', async () => {
      // Arrange
      const mockUpdatedTask = {
        id: 'task-1',
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: 'project-1',
      };
      
      const updateData = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      };
      
      (TaskService.prototype.updateTask as jest.Mock).mockResolvedValue(mockUpdatedTask);
      
      // Act
      const response = await request(app)
        .put('/api/tasks/task-1')
        .send(updateData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockUpdatedTask);
    });
  });
  
  describe('DELETE /api/tasks/:taskId', () => {
    it('should delete a task', async () => {
      // Arrange
      (TaskService.prototype.deleteTask as jest.Mock).mockResolvedValue({ success: true });
      
      // Act
      const response = await request(app).delete('/api/tasks/task-1');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });
  
  describe('POST /api/tasks/:taskId/assign', () => {
    it('should assign a user to a task', async () => {
      // Arrange
      const mockAssignment = {
        id: 'assignment-1',
        taskId: 'task-1',
        userId: 'user-1',
        assignedAt: new Date(),
      };
      
      const assignData = {
        userId: 'user-1',
      };
      
      (TaskService.prototype.assignTask as jest.Mock).mockResolvedValue(mockAssignment);
      
      // Act
      const response = await request(app)
        .post('/api/tasks/task-1/assign')
        .send(assignData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockAssignment);
    });
  });
  
  describe('DELETE /api/tasks/:taskId/assign/:userId', () => {
    it('should unassign a user from a task', async () => {
      // Arrange
      (TaskService.prototype.unassignTask as jest.Mock).mockResolvedValue({ success: true });
      
      // Act
      const response = await request(app).delete('/api/tasks/task-1/assign/user-1');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });
  
  describe('GET /api/tasks/:taskId/assignees', () => {
    it('should get all assignees for a task', async () => {
      // Arrange
      const mockAssignees = [
        { userId: 'user-1', firstName: 'John', lastName: 'Doe' },
        { userId: 'user-2', firstName: 'Jane', lastName: 'Smith' },
      ];
      
      (TaskService.prototype.getTaskAssignees as jest.Mock).mockResolvedValue(mockAssignees);
      
      // Act
      const response = await request(app).get('/api/tasks/task-1/assignees');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockAssignees);
    });
  });
});
