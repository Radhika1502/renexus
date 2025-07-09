import { describe, expect, jest, it } from '@jest/globals';
import { db } from '@packages/database/db';
import { Task } from '@packages/api-types/task';
import { TaskService } from '@services/tasks/task.service';

// Mock the database
jest.mock('@packages/database/db', () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    execute: jest.fn()
  }
}));

describe('Task Service', () => {
  let taskService: TaskService;
  const mockTask: Task = {
    id: '123',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium',
    projectId: 'project123',
    assigneeId: 'user123',
    createdAt: new Date(),
    updatedAt: new Date(),
    dueDate: new Date()
  };

  beforeEach(() => {
    taskService = new TaskService();
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const mockValues = jest.fn().mockResolvedValue([mockTask]);
      const mockInsert = jest.fn().mockReturnValue({ values: mockValues });
      (db.insert as jest.Mock).mockImplementation(mockInsert);

      const result = await taskService.createTask({
        title: 'Test Task',
        description: 'Test Description',
        projectId: 'project123',
        assigneeId: 'user123'
      });

      expect(result).toEqual(mockTask);
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
    });
  });

  describe('getTask', () => {
    it('should return a task by id', async () => {
      const mockWhere = jest.fn().mockResolvedValue([mockTask]);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });
      (db.select as jest.Mock).mockImplementation(mockSelect);

      const result = await taskService.getTask('123');
      expect(result).toEqual(mockTask);
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    it('should update a task', async () => {
      const mockWhere = jest.fn().mockResolvedValue([mockTask]);
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });
      (db.update as jest.Mock).mockImplementation(mockUpdate);

      const result = await taskService.updateTask('123', { title: 'Updated Task' });
      expect(result).toEqual(mockTask);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      const mockWhere = jest.fn().mockResolvedValue([mockTask]);
      const mockDelete = jest.fn().mockReturnValue({ where: mockWhere });
      (db.delete as jest.Mock).mockImplementation(mockDelete);

      await taskService.deleteTask('123');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });
});

