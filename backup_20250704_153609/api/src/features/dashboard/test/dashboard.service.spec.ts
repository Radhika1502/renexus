import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../dashboard.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { TeamPerformanceDto } from '../dto/team-performance.dto';
import { TimeRangeDto } from '../dto/time-range.dto';
import { TaskStatusSummaryDto } from '../dto/task-status-summary.dto';
import { DashboardSummaryDto } from '../dto/dashboard-summary.dto';
import { TimelineEventDto } from '../dto/timeline-event.dto';

describe('DashboardService', () => {
  let service: DashboardService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    task: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    project: {
      count: jest.fn(),
    },
    user: {
      count: jest.fn(),
    },
    team: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardSummary', () => {
    it('should return dashboard summary with correct statistics', async () => {
      // Mock the Prisma responses
      mockPrismaService.task.count
        .mockResolvedValueOnce(100) // total tasks
        .mockResolvedValueOnce(60)  // completed tasks
        .mockResolvedValueOnce(30)  // in progress tasks
        .mockResolvedValueOnce(10); // pending tasks
      
      mockPrismaService.project.count
        .mockResolvedValueOnce(20)  // total projects
        .mockResolvedValueOnce(15); // active projects
      
      mockPrismaService.user.count
        .mockResolvedValueOnce(50); // total users

      const result = await service.getDashboardSummary();

      expect(result).toEqual({
        taskSummary: {
          total: 100,
          completed: 60,
          inProgress: 30,
          pending: 10,
          completionRate: 0.6,
        },
        projectSummary: {
          total: 20,
          active: 15,
        },
        userSummary: {
          total: 50,
        },
      });

      expect(mockPrismaService.task.count).toHaveBeenCalledTimes(4);
      expect(mockPrismaService.project.count).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.user.count).toHaveBeenCalledTimes(1);
    });

    it('should handle empty data gracefully', async () => {
      // Mock the Prisma responses for empty data
      mockPrismaService.task.count
        .mockResolvedValueOnce(0) // total tasks
        .mockResolvedValueOnce(0) // completed tasks
        .mockResolvedValueOnce(0) // in progress tasks
        .mockResolvedValueOnce(0); // pending tasks
      
      mockPrismaService.project.count
        .mockResolvedValueOnce(0) // total projects
        .mockResolvedValueOnce(0); // active projects
      
      mockPrismaService.user.count
        .mockResolvedValueOnce(0); // total users

      const result = await service.getDashboardSummary();

      expect(result).toEqual({
        taskSummary: {
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          completionRate: 0,
        },
        projectSummary: {
          total: 0,
          active: 0,
        },
        userSummary: {
          total: 0,
        },
      });
    });
  });

  describe('getTaskStatusSummary', () => {
    it('should return task status summary without filters', async () => {
      // Mock tasks with different statuses
      mockPrismaService.task.findMany.mockResolvedValueOnce([
        { status: 'COMPLETED' },
        { status: 'COMPLETED' },
        { status: 'IN_PROGRESS' },
        { status: 'PENDING' },
        { status: 'COMPLETED' },
      ]);

      const result = await service.getTaskStatusSummary();

      expect(result).toEqual([
        { status: 'COMPLETED', count: 3 },
        { status: 'IN_PROGRESS', count: 1 },
        { status: 'PENDING', count: 1 },
      ]);

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: {},
        select: { status: true },
      });
    });

    it('should apply projectId filter when provided', async () => {
      const projectId = 'project-123';
      
      mockPrismaService.task.findMany.mockResolvedValueOnce([
        { status: 'COMPLETED' },
        { status: 'IN_PROGRESS' },
      ]);

      await service.getTaskStatusSummary(projectId);

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: { projectId },
        select: { status: true },
      });
    });

    it('should apply time range filter when provided', async () => {
      const timeRange: TimeRangeDto = {
        start: '2023-01-01',
        end: '2023-01-31',
      };
      
      mockPrismaService.task.findMany.mockResolvedValueOnce([
        { status: 'COMPLETED' },
      ]);

      await service.getTaskStatusSummary(undefined, timeRange);

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        select: { status: true },
      });
    });
  });

  describe('getTeamPerformance', () => {
    it('should return team performance metrics', async () => {
      // Mock teams data
      mockPrismaService.team.findMany.mockResolvedValueOnce([
        {
          id: 'team-1',
          name: 'Team Alpha',
          users: [{ id: 'user-1' }, { id: 'user-2' }],
        },
      ]);

      // Mock tasks data for the team
      mockPrismaService.task.findMany.mockResolvedValueOnce([
        {
          id: 'task-1',
          status: 'COMPLETED',
          createdAt: new Date('2023-01-01'),
          completedAt: new Date('2023-01-05'),
          dueDate: new Date('2023-01-10'),
          TimeLogs: [],
        },
        {
          id: 'task-2',
          status: 'IN_PROGRESS',
          createdAt: new Date('2023-01-02'),
          completedAt: null,
          dueDate: new Date('2023-01-15'),
          TimeLogs: [],
        },
        {
          id: 'task-3',
          status: 'COMPLETED',
          createdAt: new Date('2023-01-03'),
          completedAt: new Date('2023-01-12'),
          dueDate: new Date('2023-01-10'),
          TimeLogs: [],
        },
      ]);

      const result = await service.getTeamPerformance();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        teamId: 'team-1',
        teamName: 'Team Alpha',
        totalTasks: 3,
        completedTasks: 2,
        completionRate: 2/3,
      });

      // Check that on-time delivery calculation is correct
      // One task completed before due date, one after
      expect(result[0].onTimeDeliveryRate).toBeCloseTo(1/2);
      
      // Check that average completion time calculation is correct
      // Task 1: 4 days (96 hours), Task 3: 9 days (216 hours)
      // Average: (96 + 216) / 2 = 156 hours
      expect(result[0].averageTaskCompletionTime).toBeGreaterThan(0);

      expect(mockPrismaService.team.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.task.findMany).toHaveBeenCalledTimes(1);
    });

    it('should apply time range filter when provided', async () => {
      const timeRange: TimeRangeDto = {
        start: '2023-01-01',
        end: '2023-01-31',
      };

      mockPrismaService.team.findMany.mockResolvedValueOnce([
        {
          id: 'team-1',
          name: 'Team Alpha',
          users: [{ id: 'user-1' }],
        },
      ]);

      mockPrismaService.task.findMany.mockResolvedValueOnce([]);

      await service.getTeamPerformance(timeRange);

      expect(mockPrismaService.task.findMany).toHaveBeenCalledWith({
        where: {
          assigneeId: {
            in: ['user-1'],
          },
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        include: {
          TimeLogs: true,
        },
      });
    });
  });

  describe('getTimelineEvents', () => {
    it('should return timeline events sorted by timestamp', async () => {
      // Mock task creation events
      mockPrismaService.task.findMany
        .mockResolvedValueOnce([
          {
            id: 'task-1',
            title: 'Task 1',
            createdAt: new Date('2023-01-01'),
            createdBy: { id: 'user-1', name: 'User One' },
          },
          {
            id: 'task-2',
            title: 'Task 2',
            createdAt: new Date('2023-01-02'),
            createdBy: { id: 'user-2', name: 'User Two' },
          },
        ])
        // Mock task completion events
        .mockResolvedValueOnce([
          {
            id: 'task-1',
            title: 'Task 1',
            completedAt: new Date('2023-01-05'),
            assignee: { id: 'user-3', name: 'User Three' },
          },
        ]);

      const result = await service.getTimelineEvents();

      expect(result).toHaveLength(3);
      
      // Events should be sorted by timestamp (newest first)
      expect(result[0].id).toBe('completion-task-1');
      expect(result[1].id).toBe('creation-task-2');
      expect(result[2].id).toBe('creation-task-1');

      expect(mockPrismaService.task.findMany).toHaveBeenCalledTimes(2);
    });

    it('should apply time range filter when provided', async () => {
      const timeRange: TimeRangeDto = {
        start: '2023-01-01',
        end: '2023-01-31',
      };

      mockPrismaService.task.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service.getTimelineEvents(timeRange);

      // Check that the time range filter was applied to both queries
      expect(mockPrismaService.task.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        }),
      }));

      expect(mockPrismaService.task.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        }),
      }));
    });
  });
});
