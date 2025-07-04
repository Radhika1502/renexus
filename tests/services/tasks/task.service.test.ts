import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TaskService } from '../../../services/tasks/task.service';
import { db } from '../../../packag../packages/database/db';

// Mock the database
jest.mock('../../../packag../packages/database/db', () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 'test-task-id' }]),
    query: {
      tasks: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      taskAssignees: {
        findMany: jest.fn(),
      }
    },
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
  }
}));

describe('TaskService', () => {
  let taskService: TaskService;
  const mockTask = {
    id: 'test-task-id',
    title: 'Test Task',
    description: 'Test Description',
    status: 'TODO',
    priority: 'MEDIUM',
    projectId: 'test-project-id',
    tenantId: 'test-tenant-id',
    createdById: 'test-user-id',
    estimatedHours: 5,
    dueDate: null,
    category: 'Development',
    customFields: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    taskService = new TaskService();
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      // Arrange
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: 'test-project-id',
        tenantId: 'test-tenant-id',
        createdById: 'test-user-id',
        estimatedHours: 5,
      };

      (db.insert as jest.Mock).mockReturnThis();
      (db.values as jest.Mock).mockReturnThis();
      (db.returning as jest.Mock).mockResolvedValue([mockTask]);

      // Act
      const result = await taskService.createTask(taskData);

      // Assert
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalled();
      expect(db.returning).toHaveBeenCalled();
      expect(result).toEqual(mockTask);
    });
  });

  describe('getTaskById', () => {
    it('should return a task when found', async () => {
      // Arrange
      const taskId = 'test-task-id';
      const tenantId = 'test-tenant-id';

      (db.query.tasks.findFirst as jest.Mock).mockResolvedValue(mockTask);

      // Act
      const result = await taskService.getTaskById(taskId, tenantId);

      // Assert
      expect(db.query.tasks.findFirst).toHaveBeenCalled();
      expect(result).toEqual(mockTask);
    });

    it('should return null when task not found', async () => {
      // Arrange
      const taskId = 'non-existent-id';
      const tenantId = 'test-tenant-id';

      (db.query.tasks.findFirst as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await taskService.getTaskById(taskId, tenantId);

      // Assert
      expect(db.query.tasks.findFirst).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      // Arrange
      const taskId = 'test-task-id';
      const tenantId = 'test-tenant-id';
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated Description',
        status: 'IN_PROGRESS',
      };

      (db.update as jest.Mock).mockReturnThis();
      (db.set as jest.Mock).mockReturnThis();
      (db.where as jest.Mock).mockReturnThis();
      (db.returning as jest.Mock).mockResolvedValue([{
        ...mockTask,
        title: 'Updated Task Title',
        description: 'Updated Description',
        status: 'IN_PROGRESS',
      }]);

      // Act
      const result = await taskService.updateTask(taskId, tenantId, updateData);

      // Assert
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(db.returning).toHaveBeenCalled();
      expect(result.title).toBe('Updated Task Title');
      expect(result.status).toBe('IN_PROGRESS');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      // Arrange
      const taskId = 'test-task-id';
      const tenantId = 'test-tenant-id';

      (db.delete as jest.Mock).mockReturnThis();
      (db.where as jest.Mock).mockReturnThis();
      (db.returning as jest.Mock).mockResolvedValue([mockTask]);

      // Act
      const result = await taskService.deleteTask(taskId, tenantId);

      // Assert
      expect(db.delete).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('getTasksByProject', () => {
    it('should return tasks for a project with pagination', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const tenantId = 'test-tenant-id';
      const page = 1;
      const limit = 10;
      const mockTasks = [mockTask, { ...mockTask, id: 'test-task-id-2' }];

      (db.query.tasks.findMany as jest.Mock).mockResolvedValue(mockTasks);
      (db.select as jest.Mock).mockReturnThis();
      (db.from as jest.Mock).mockReturnThis();
      (db.where as jest.Mock).mockReturnThis();
      (db.count as jest.Mock).mockResolvedValue([{ count: 2 }]);

      // Act
      const result = await taskService.getTasksByProject(projectId, tenantId, page, limit);

      // Assert
      expect(db.query.tasks.findMany).toHaveBeenCalled();
      expect(result.data).toEqual(mockTasks);
      expect(result.total).toBe(2);
    });
  });

  describe('assignTask', () => {
    it('should assign a user to a task successfully', async () => {
      // Arrange
      const assignData = {
        taskId: 'test-task-id',
        userId: 'test-user-id',
        tenantId: 'test-tenant-id',
      };

      (db.insert as jest.Mock).mockReturnThis();
      (db.values as jest.Mock).mockReturnThis();
      (db.returning as jest.Mock).mockResolvedValue([{
        id: 'test-assignment-id',
        taskId: 'test-task-id',
        userId: 'test-user-id',
        assignedAt: new Date(),
      }]);

      // Act
      const result = await taskService.assignTask(assignData);

      // Assert
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalled();
      expect(db.returning).toHaveBeenCalled();
      expect(result.taskId).toBe('test-task-id');
      expect(result.userId).toBe('test-user-id');
    });
  });

  describe('unassignTask', () => {
    it('should unassign a user from a task successfully', async () => {
      // Arrange
      const taskId = 'test-task-id';
      const userId = 'test-user-id';
      const tenantId = 'test-tenant-id';

      (db.delete as jest.Mock).mockReturnThis();
      (db.where as jest.Mock).mockReturnThis();
      (db.returning as jest.Mock).mockResolvedValue([{
        id: 'test-assignment-id',
        taskId: 'test-task-id',
        userId: 'test-user-id',
        assignedAt: new Date(),
      }]);

      // Act
      const result = await taskService.unassignTask(taskId, userId, tenantId);

      // Assert
      expect(db.delete).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('getTaskAssignees', () => {
    it('should return all assignees for a task', async () => {
      // Arrange
      const taskId = 'test-task-id';
      const tenantId = 'test-tenant-id';
      const mockAssignees = [
        { userId: 'user-1', firstName: 'John', lastName: 'Doe' },
        { userId: 'user-2', firstName: 'Jane', lastName: 'Smith' },
      ];

      (db.query.taskAssignees.findMany as jest.Mock).mockResolvedValue(mockAssignees);

      // Act
      const result = await (taskService as any).getTaskAssignees(taskId);

      // Assert
      expect(db.query.taskAssignees.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockAssignees);
    });
  });
});

