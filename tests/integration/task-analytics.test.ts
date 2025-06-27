// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../apps/api/src/app.module';
import { PrismaService } from '../../apps/api/src/prisma.service';
import { TaskAnalyticsController } from '../../apps/api/src/features/task-analytics/task-analytics.controller';

describe('TaskAnalyticsController (Integration)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Mock data
  const mockTask = {
    id: 'task-test-1',
    title: 'Test Task',
    description: 'Task for testing',
    status: 'IN_PROGRESS',
    projectId: 'project-test-1',
    assigneeId: 'user-test-1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    updatedAt: new Date()
  };

  const mockTimeLogs = [
    {
      id: 'time-log-1',
      taskId: 'task-test-1',
      userId: 'user-test-1',
      startTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours
      description: 'Working on implementation',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'time-log-2',
      taskId: 'task-test-1',
      userId: 'user-test-1',
      startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours
      description: 'Fixing bugs',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    }
  ];

  beforeAll(async () => {
    // Mock the NestJS module
    const mockPrismaService = {
      task: {
        create: jest.fn().mockResolvedValue(mockTask),
        findUnique: jest.fn().mockResolvedValue(mockTask),
        findMany: jest.fn().mockResolvedValue([mockTask])
      },
      timeLog: {
        findMany: jest.fn().mockResolvedValue(mockTimeLogs),
        aggregate: jest.fn().mockResolvedValue({
          _sum: {
            duration: 5 * 60 * 60 * 1000 // 5 hours in milliseconds
          }
        })
      },
      $transaction: jest.fn().mockImplementation((callback) => callback(mockPrismaService))
    };
    
    const mockTaskAnalyticsController = {
      getTaskTimeStats: jest.fn().mockResolvedValue({
        totalTime: 5 * 60 * 60 * 1000,
        timeEntries: mockTimeLogs.length,
        averageTimePerEntry: (5 * 60 * 60 * 1000) / mockTimeLogs.length
      }),
      getProjectTimeDistribution: jest.fn().mockResolvedValue([
        { projectId: 'project-test-1', totalTime: 5 * 60 * 60 * 1000, percentage: 100 }
      ])
    };
    
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(PrismaService)
    .useValue(mockPrismaService)
    .overrideProvider(TaskAnalyticsController)
    .useValue(mockTaskAnalyticsController)
    .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    // No need to seed test data as we're using mocks
    // Mock data is already set up in the mock services
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.timeLog.deleteMany({
      where: { taskId: mockTask.id }
    });
    await prismaService.task.delete({
      where: { id: mockTask.id }
    });
    await app.close();
  });

  describe('/tasks/:taskId/analytics', () => {
    it('should return task analytics data', async () => {
      const response = await request(app.getHttpServer())
        .get(`/tasks/${mockTask.id}/analytics`)
        .expect(200);

      expect(response.body).toHaveProperty('timeSpent');
      expect(response.body.timeSpent).toEqual(expect.any(Number));
      expect(response.body.timeSpent).toBeGreaterThanOrEqual(5); // 5 hours total from mock data
      
      expect(response.body).toHaveProperty('completionTrends');
      expect(Array.isArray(response.body.completionTrends)).toBeTruthy();
    });

    it('should return 404 for non-existent task', async () => {
      await request(app.getHttpServer())
        .get('/tasks/non-existent-task/analytics')
        .expect(404);
    });
  });

  describe('/projects/:projectId/analytics/completion-trends', () => {
    it('should return project completion trends', async () => {
      const response = await request(app.getHttpServer())
        .get(`/projects/${mockTask.projectId}/analytics/completion-trends`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('week');
      expect(response.body[0]).toHaveProperty('count');
    });
  });
});
