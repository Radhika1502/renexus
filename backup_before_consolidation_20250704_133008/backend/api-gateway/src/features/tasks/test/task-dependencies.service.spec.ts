import { Test, TestingModule } from '@nestjs/testing';
import { TaskDependenciesService } from '../task-dependencies.service';
import { PrismaService } from '../../../prisma.service';

describe('TaskDependenciesService', () => {
  let service: TaskDependenciesService;
  let prismaService: PrismaService;

  // Mock data
  const mockTasks = [
    { id: 'task1', title: 'Task 1' },
    { id: 'task2', title: 'Task 2' },
    { id: 'task3', title: 'Task 3' },
    { id: 'task4', title: 'Task 4' },
  ];

  const mockDependencies = [
    { id: 'dep1', taskId: 'task2', dependsOnTaskId: 'task1' }, // task2 depends on task1
    { id: 'dep2', taskId: 'task3', dependsOnTaskId: 'task2' }, // task3 depends on task2
  ];

  // Create a mock Prisma service
  const mockPrismaService = {
    task: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    taskDependency: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskDependenciesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TaskDependenciesService>(TaskDependenciesService);
    prismaService = module.get<PrismaService>(PrismaService);
    
    // Reset mock implementations
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findDependencies', () => {
    it('should find all dependencies for a task', async () => {
      mockPrismaService.taskDependency.findMany.mockResolvedValue([
        { id: 'dep1', taskId: 'task3', dependsOnTaskId: 'task1' },
        { id: 'dep2', taskId: 'task3', dependsOnTaskId: 'task2' },
      ]);

      const result = await service.findDependencies('task3');
      expect(result).toHaveLength(2);
      expect(mockPrismaService.taskDependency.findMany).toHaveBeenCalledWith({
        where: { taskId: 'task3' },
        include: { dependsOnTask: true },
      });
    });
  });

  describe('findDependents', () => {
    it('should find all tasks that depend on the specified task', async () => {
      mockPrismaService.taskDependency.findMany.mockResolvedValue([
        { id: 'dep1', taskId: 'task2', dependsOnTaskId: 'task1' },
        { id: 'dep2', taskId: 'task3', dependsOnTaskId: 'task1' },
      ]);

      const result = await service.findDependents('task1');
      expect(result).toHaveLength(2);
      expect(mockPrismaService.taskDependency.findMany).toHaveBeenCalledWith({
        where: { dependsOnTaskId: 'task1' },
        include: { task: true },
      });
    });
  });

  describe('addDependency', () => {
    it('should add a dependency between two tasks', async () => {
      mockPrismaService.task.findUnique
        .mockResolvedValueOnce({ id: 'task4' }) // First task
        .mockResolvedValueOnce({ id: 'task1' }); // Second task
      
      mockPrismaService.taskDependency.findFirst.mockResolvedValue(null); // No existing dependency
      mockPrismaService.taskDependency.create.mockResolvedValue({
        id: 'dep3',
        taskId: 'task4',
        dependsOnTaskId: 'task1',
      });

      // Mock the private checkForCircularDependency method
      jest.spyOn(service as any, 'checkForCircularDependency').mockResolvedValue(false);

      const result = await service.addDependency('task4', 'task1');
      
      expect(result).toEqual({
        id: 'dep3',
        taskId: 'task4',
        dependsOnTaskId: 'task1',
      });
      
      expect(mockPrismaService.taskDependency.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task4',
          dependsOnTaskId: 'task1',
        },
      });
    });

    it('should throw an error when a circular dependency is detected', async () => {
      mockPrismaService.task.findUnique
        .mockResolvedValueOnce({ id: 'task1' }) // First task
        .mockResolvedValueOnce({ id: 'task3' }); // Second task
      
      mockPrismaService.taskDependency.findFirst.mockResolvedValue(null); // No existing dependency
      
      // Mock circular dependency check to return true (indicating circular dependency)
      jest.spyOn(service as any, 'checkForCircularDependency').mockResolvedValue(true);

      await expect(service.addDependency('task1', 'task3')).rejects.toThrow(
        'Cannot add dependency as it would create a circular dependency',
      );
    });
  });

  describe('checkCircularDependency', () => {
    it('should detect direct circular dependencies', async () => {
      // Set up mock dependencies: task1 -> task2, checking if task2 -> task1 creates a circular dependency
      mockPrismaService.task.findUnique
        .mockResolvedValueOnce({ id: 'task1' })
        .mockResolvedValueOnce({ id: 'task2' });
      
      mockPrismaService.taskDependency.findFirst.mockResolvedValue({ id: 'dep1', taskId: 'task2', dependsOnTaskId: 'task1' });

      const result = await service.checkCircularDependency('task1', 'task2');
      expect(result.wouldCreateCircularDependency).toBe(true); // Should detect circular dependency
    });

    it('should detect indirect circular dependencies', async () => {
      // Set up test case: task1 -> task2 -> task3, checking if task3 -> task1 creates a circular dependency
      mockPrismaService.task.findUnique
        .mockResolvedValueOnce({ id: 'task3' })
        .mockResolvedValueOnce({ id: 'task1' });
      
      mockPrismaService.taskDependency.findFirst.mockResolvedValue(null); // No direct circular dependency
      
      // Mock the private method to return true for indirect circular dependency
      jest.spyOn(service as any, 'checkForCircularDependency').mockResolvedValue(true);

      const result = await service.checkCircularDependency('task3', 'task1');
      expect(result.wouldCreateCircularDependency).toBe(true); // Should detect circular dependency
    });

    it('should return false when no circular dependency exists', async () => {
      // Set up test case: task1 -> task2, task3 -> task4, checking if task1 -> task3 creates a circular dependency (it doesn't)
      mockPrismaService.task.findUnique
        .mockResolvedValueOnce({ id: 'task1' })
        .mockResolvedValueOnce({ id: 'task3' });
      
      mockPrismaService.taskDependency.findFirst.mockResolvedValue(null); // No direct circular dependency
      
      // Mock the private method to return false for no circular dependency
      jest.spyOn(service as any, 'checkForCircularDependency').mockResolvedValue(false);

      const result = await service.checkCircularDependency('task1', 'task3');
      expect(result.wouldCreateCircularDependency).toBe(false); // Should not detect circular dependency
    });
  });

  describe('findAvailableDependencies', () => {
    it('should find all available tasks that can be dependencies', async () => {
      // Existing dependencies
      mockPrismaService.taskDependency.findMany.mockResolvedValue([
        { dependsOnTaskId: 'task2' },
      ]);
      
      // All tasks in the project
      mockPrismaService.task.findMany.mockResolvedValue([
        { id: 'task3', title: 'Task 3', status: 'TODO' },
        { id: 'task4', title: 'Task 4', status: 'TODO' },
      ]);

      const result = await service.findAvailableDependencies('task1', 'project1');
      
      expect(result).toHaveLength(2); // task3 and task4
      expect(result.some(t => t.id === 'task3')).toBe(true);
      expect(result.some(t => t.id === 'task4')).toBe(true);
    });
  });
});
