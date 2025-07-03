import { Test, TestingModule } from '@nestjs/testing';
import { ReportingService } from './reporting.service';
import { PrismaService } from '../../prisma.service';
import { TaskStatus, TaskPriority } from '../tasks/task-status.enum';
import { Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('ReportingService', () => {
  let service: ReportingService;
  let prisma: PrismaService;

  const mockPrismaService = {
    task: {
      findMany: jest.fn(),
    },
  };

  const mockTasks: any[] = [
    {
      id: 'task-1',
      title: 'Test Task 1',
      description: 'Test Description',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      projectId: 'project-1',
      assigneeId: 'user-1',
      assignee: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
      },
      timeLogs: [
        { id: '1', duration: 3600, startTime: new Date(), endTime: new Date() }, // 1 hour
        { id: '2', duration: 1800, startTime: new Date(), endTime: new Date() }, // 30 minutes
      ],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdFromTemplate: false,
    },
    {
      id: 'task-2',
      title: 'Test Task 2',
      description: 'Another Test Description',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      projectId: 'project-1',
      assigneeId: 'user-2',
      assignee: {
        id: 'user-2',
        name: 'Another User',
        email: 'another@example.com',
      },
      timeLogs: [
        { id: '3', duration: 1800, startTime: new Date(), endTime: new Date() }, // 30 minutes
      ],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdFromTemplate: false,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportingService>(ReportingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTaskCompletionReport', () => {
    it('should return task completion report for a project', async () => {
      // Mock the Prisma response
      mockPrismaService.task.findMany.mockResolvedValue(mockTasks);

      const result = await service.getTaskCompletionReport({
        projectId: 'project-1',
        timeRange: '7d',
      });

      // Verify the response structure
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('byStatus');
      expect(result).toHaveProperty('byPriority');
      expect(result).toHaveProperty('byAssignee');
      expect(result).toHaveProperty('byDay');
      expect(result).toHaveProperty('dateRange');
      expect(result).toHaveProperty('recentActivity');

      // Verify the summary calculations
      expect(result.summary.totalTasks).toBe(2);
      expect(result.summary.completedTasks).toBe(1);
      expect(result.summary.inProgressTasks).toBe(1);
      expect(result.summary.notStartedTasks).toBe(0);
      expect(result.summary.totalTimeSpent).toBe(5400); // 1.5 hours in seconds
      expect(result.summary.averageTimePerTask).toBe(2700); // 45 minutes per task
      expect(result.summary.completionRate).toBe(50); // 50% completion rate

      // Verify the Prisma query was called with correct parameters
      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
          createdAt: expect.any(Object),
        },
        include: {
          assignee: true,
          timeLogs: {
            select: {
              id: true,
              duration: true,
              startTime: true,
              endTime: true,
            },
          },
          comments: {
            select: {
              id: true,
              content: true,
              createdAt: true,
              userId: true,
            },
          },
        },
      });
    });

    it('should handle empty task list', async () => {
      mockPrismaService.task.findMany.mockResolvedValue([]);

      const result = await service.getTaskCompletionReport({
        projectId: 'project-1',
      });

      expect(result.summary.totalTasks).toBe(0);
      expect(result.summary.completedTasks).toBe(0);
      expect(result.summary.inProgressTasks).toBe(0);
      expect(result.summary.notStartedTasks).toBe(0);
      expect(result.summary.totalTimeSpent).toBe(0);
      expect(result.summary.averageTimePerTask).toBe(0);
      expect(result.summary.completionRate).toBe(0);
    });

    it('should filter tasks by status when statuses are provided', async () => {
      mockPrismaService.task.findMany.mockResolvedValue(
        mockTasks.filter((task) => task.status === TaskStatus.DONE),
      );

      await service.getTaskCompletionReport({
        projectId: 'project-1',
        statuses: [TaskStatus.DONE],
      });

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: {
              in: [TaskStatus.DONE],
            },
          }),
        }),
      );
    });

    it('should filter tasks by assignee when userIds are provided', async () => {
      mockPrismaService.task.findMany.mockResolvedValue(
        mockTasks.filter((task) => task.assigneeId === 'user-1'),
      );

      await service.getTaskCompletionReport({
        projectId: 'project-1',
        userIds: ['user-1'],
      });

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assigneeId: {
              in: ['user-1'],
            },
          }),
        }),
      );
    });

    it('should handle custom date range when provided', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      
      await service.getTaskCompletionReport({
        projectId: 'project-1',
        timeRange: 'custom',
        startDate,
        endDate,
      });

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }),
        }),
      );
    });

    it('should handle tasks without time logs', async () => {
      const tasksWithoutTimeLogs = [
        {
          ...mockTasks[0],
          timeLogs: [],
        },
      ];
      
      mockPrismaService.task.findMany.mockResolvedValue(tasksWithoutTimeLogs);

      const result = await service.getTaskCompletionReport({
        projectId: 'project-1',
      });

      expect(result.summary.totalTimeSpent).toBe(0);
      expect(result.summary.averageTimePerTask).toBe(0);
    });

    it('should handle tasks with null time logs', async () => {
      const tasksWithNullTimeLogs = [
        {
          ...mockTasks[0],
          timeLogs: [
            { id: '1', duration: null, startTime: null, endTime: null },
          ],
        },
      ];
      
      mockPrismaService.task.findMany.mockResolvedValue(tasksWithNullTimeLogs);

      const result = await service.getTaskCompletionReport({
        projectId: 'project-1',
      });

      expect(result.summary.totalTimeSpent).toBe(0);
      expect(result.summary.averageTimePerTask).toBe(0);
    });

    it('should handle tasks without assignee', async () => {
      const unassignedTask = {
        ...mockTasks[0],
        assigneeId: null,
        assignee: null,
      };
      
      mockPrismaService.task.findMany.mockResolvedValue([unassignedTask]);

      const result = await service.getTaskCompletionReport({
        projectId: 'project-1',
      });

      expect(result.byAssignee).toContainEqual({
        userId: null,
        userName: 'Unassigned',
        totalTasks: 1,
        completedTasks: 1,
        inProgressTasks: 0,
        timeSpent: 5400,
      });
    });

    it('should handle different time ranges', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      
      // Test 7d range
      mockPrismaService.task.findMany.mockClear();
      await service.getTaskCompletionReport({
        projectId: 'project-1',
        timeRange: '7d',
      });

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        }),
      );

      // Test 30d range
      mockPrismaService.task.findMany.mockClear();
      await service.getTaskCompletionReport({
        projectId: 'project-1',
        timeRange: '30d',
      });

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        }),
      );
    });

    it('should throw BadRequestException for invalid date range', async () => {
      await expect(
        service.getTaskCompletionReport({
          projectId: 'project-1',
          timeRange: 'custom',
          startDate: new Date('2023-12-31'),
          endDate: new Date('2023-01-01'), // End date before start date
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
