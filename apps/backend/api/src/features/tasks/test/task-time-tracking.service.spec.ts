import { Test, TestingModule } from '@nestjs/testing';
import { TaskTimeTrackingService } from '../task-time-tracking.service';
import { PrismaService } from '../../../prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TaskTimeTrackingService', () => {
  let service: TaskTimeTrackingService;
  let prismaService: PrismaService;

  // Mock data
  const mockTask = {
    id: 'task1',
    title: 'Sample Task',
    description: 'Task description',
    projectId: 'project1',
  };

  const mockTimeEntries = [
    {
      id: 'entry1',
      taskId: 'task1',
      userId: 'user1',
      userName: 'Test User',
      startTime: new Date('2025-07-01T10:00:00.000Z'),
      endTime: new Date('2025-07-01T12:00:00.000Z'),
      duration: 7200, // 2 hours in seconds
      notes: 'Test entry',
    },
    {
      id: 'entry2',
      taskId: 'task1',
      userId: 'user1',
      userName: 'Test User',
      startTime: new Date('2025-07-01T14:00:00.000Z'),
      endTime: new Date('2025-07-01T16:00:00.000Z'),
      duration: 7200, // 2 hours in seconds
      notes: 'Second entry',
    },
  ];

  // Create a mock Prisma service
  const mockPrismaService = {
    task: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    timeLog: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      aggregate: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskTimeTrackingService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TaskTimeTrackingService>(TaskTimeTrackingService);
    prismaService = module.get<PrismaService>(PrismaService);
    
    // Reset mock implementations
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTimeEntries', () => {
    it('should return time entries for a task', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.timeLog.findMany.mockResolvedValue(mockTimeEntries);

      const result = await service.getTimeEntries('task1');
      
      expect(result).toEqual(mockTimeEntries);
      expect(mockPrismaService.timeLog.findMany).toHaveBeenCalledWith({
        where: { taskId: 'task1' },
        orderBy: { startTime: 'desc' },
      });
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.getTimeEntries('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createTimeEntry', () => {
    it('should create a time entry for a task', async () => {
      const timeEntryData = {
        startTime: new Date('2025-07-01T10:00:00.000Z'),
        endTime: new Date('2025-07-01T12:00:00.000Z'),
        duration: 7200,
        notes: 'Test entry',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.timeLog.create.mockResolvedValue({
        id: 'new-entry',
        taskId: 'task1',
        userId: 'user1',
        userName: 'Test User',
        ...timeEntryData,
      });

      const result = await service.createTimeEntry(
        'task1',
        'user1',
        'Test User',
        timeEntryData,
      );

      expect(result).toHaveProperty('id', 'new-entry');
      expect(result).toHaveProperty('taskId', 'task1');
      expect(mockPrismaService.timeLog.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if start time is after end time', async () => {
      const invalidTimeEntryData = {
        startTime: new Date('2025-07-01T14:00:00.000Z'),
        endTime: new Date('2025-07-01T12:00:00.000Z'), // Earlier than start
        duration: 7200,
        notes: 'Test entry',
      };

      await expect(
        service.createTimeEntry('task1', 'user1', 'Test User', invalidTimeEntryData)
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if task does not exist', async () => {
      const timeEntryData = {
        startTime: new Date('2025-07-01T10:00:00.000Z'),
        endTime: new Date('2025-07-01T12:00:00.000Z'),
        duration: 7200,
        notes: 'Test entry',
      };

      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(
        service.createTimeEntry('nonexistent', 'user1', 'Test User', timeEntryData)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('startTimer', () => {
    it('should start a timer for a task', async () => {
      const startTime = new Date();
      
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.timeLog.findFirst.mockResolvedValue(null); // No active timer
      mockPrismaService.timeLog.create.mockResolvedValue({
        id: 'timer1',
        taskId: 'task1',
        userId: 'user1',
        userName: 'Test User',
        startTime,
        endTime: null,
        duration: null,
      });

      const result = await service.startTimer('task1', 'user1', 'Test User', startTime);
      
      expect(result).toHaveProperty('id', 'timer1');
      expect(result.endTime).toBeNull();
      expect(result.duration).toBeNull();
      expect(mockPrismaService.timeLog.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if user already has an active timer', async () => {
      const startTime = new Date();
      
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.timeLog.findFirst.mockResolvedValue({
        id: 'active-timer',
        taskId: 'task2',
        userId: 'user1',
        startTime: new Date(),
        endTime: null,
      });

      await expect(
        service.startTimer('task1', 'user1', 'Test User', startTime)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('stopTimer', () => {
    it('should stop an active timer', async () => {
      const endTime = new Date();
      const duration = 3600; // 1 hour

      mockPrismaService.timeLog.findFirst.mockResolvedValue({
        id: 'timer1',
        taskId: 'task1',
        userId: 'user1',
        userName: 'Test User',
        startTime: new Date(endTime.getTime() - duration * 1000),
        endTime: null,
        duration: null,
      });

      mockPrismaService.timeLog.update.mockResolvedValue({
        id: 'timer1',
        taskId: 'task1',
        userId: 'user1',
        userName: 'Test User',
        startTime: new Date(endTime.getTime() - duration * 1000),
        endTime,
        duration,
        notes: 'Completed work',
      });

      const result = await service.stopTimer(
        'task1',
        'user1',
        endTime,
        duration,
        'Completed work'
      );
      
      expect(result).toHaveProperty('id', 'timer1');
      expect(result.endTime).toEqual(endTime);
      expect(result.duration).toEqual(duration);
      expect(result.notes).toEqual('Completed work');
      expect(mockPrismaService.timeLog.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if no active timer exists', async () => {
      mockPrismaService.timeLog.findFirst.mockResolvedValue(null);

      await expect(
        service.stopTimer('task1', 'user1', new Date(), 3600, 'Notes')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActiveTimer', () => {
    it('should return the active timer for a user', async () => {
      const activeTimer = {
        id: 'timer1',
        taskId: 'task1',
        userId: 'user1',
        userName: 'Test User',
        startTime: new Date(),
        endTime: null,
        duration: null,
        task: {
          id: 'task1',
          title: 'Sample Task',
        },
      };

      mockPrismaService.timeLog.findFirst.mockResolvedValue(activeTimer);

      const result = await service.getActiveTimer('user1');
      
      expect(result).toEqual(activeTimer);
      expect(mockPrismaService.timeLog.findFirst).toHaveBeenCalled();
    });

    it('should return null if no active timer exists', async () => {
      mockPrismaService.timeLog.findFirst.mockResolvedValue(null);

      const result = await service.getActiveTimer('user1');
      expect(result).toBeNull();
    });
  });

  describe('getUserTimeEntries', () => {
    it('should return time entries for a user in date range', async () => {
      const startDate = new Date('2025-07-01');
      const endDate = new Date('2025-07-02');

      mockPrismaService.timeLog.findMany.mockResolvedValue(mockTimeEntries);

      const result = await service.getUserTimeEntries('user1', startDate, endDate);
      
      expect(result).toEqual(mockTimeEntries);
      expect(mockPrismaService.timeLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user1',
            startTime: {
              gte: startDate,
              lte: endDate,
            },
          },
        })
      );
    });
  });

  describe('generateTaskTimeReport', () => {
    it('should generate a report of time entries for a task', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(mockTask);
      mockPrismaService.timeLog.findMany.mockResolvedValue(mockTimeEntries);

      const result = await service.generateTaskTimeReport('task1');
      
      expect(result).toHaveProperty('task', mockTask);
      expect(result).toHaveProperty('summary');
      expect(result.summary.totalDuration).toBe(14400); // Sum of durations
      expect(result.summary.entryCount).toBe(2);
      expect(result).toHaveProperty('entries', mockTimeEntries);
    });

    it('should throw NotFoundException if task does not exist', async () => {
      mockPrismaService.task.findUnique.mockResolvedValue(null);

      await expect(service.generateTaskTimeReport('nonexistent')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
