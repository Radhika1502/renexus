/**
 * Integration tests for Task Analytics API
 * Using real database connections and actual implementations
 */

// @ts-nocheck
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../apps/api/src/app.module';
import { PrismaService } from '../../apps/api/src/prisma.service';
import { TaskAnalyticsController } from '../../apps/api/src/features/task-analytics/task-analytics.controller';
import { TaskAnalyticsService } from '../../apps/api/src/features/task-analytics/task-analytics.service';
import { testDb } from '../setup/test-db';

// Only mock the authentication - we'll use real implementations for everything else
jest.mock('../../apps/api/src/auth/auth.guard', () => {
  return {
    AuthGuard: jest.fn().mockImplementation(() => {
      return {
        canActivate: jest.fn().mockImplementation(context => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            id: 'test-user-1',
            email: 'test1@example.com',
            tenantId: 'test-tenant-1',
            role: 'ADMIN'
          };
          return true;
        })
      };
    })
  };
});

describe('TaskAnalyticsController (Integration)', () => {
  let app: INestApplication;
  let taskAnalyticsService: TaskAnalyticsService;
  let prismaService: PrismaService;

  beforeAll(async () => {
    // Create a real NestJS application for integration testing
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule], // Use the real AppModule
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Get the real services from the NestJS container
    taskAnalyticsService = moduleFixture.get<TaskAnalyticsService>(TaskAnalyticsService);
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
    
    // Initialize the application
    await app.init();
  });

  afterAll(async () => {
    // Close the application when tests are done
    await app.close();
    
    // Note: Database connections are closed in jest-teardown.js
  });

  describe('GET /task-analytics/task-time-stats', () => {
    it('should return task time statistics using real database data', async () => {
      // Act - using real database
      const response = await request(app.getHttpServer())
        .get('/api/task-analytics/task-time-stats?taskId=test-task-1')
        .expect(200);

      // Assert
      expect(response.body).toBeDefined();
      expect(response.body.totalTime).toBeDefined();
      expect(response.body.timeEntries).toBeDefined();
      expect(response.body.averageTimePerEntry).toBeDefined();
      
      // If time entries exist, averageTimePerEntry should be totalTime / timeEntries
      if (response.body.timeEntries > 0) {
        expect(response.body.averageTimePerEntry).toBe(
          response.body.totalTime / response.body.timeEntries
        );
      }
    });
  });

  describe('GET /task-analytics/project-time-distribution', () => {
    it('should return project time distribution using real database data', async () => {
      // Act - using real database
      const response = await request(app.getHttpServer())
        .get('/api/task-analytics/project-time-distribution')
        .expect(200);

      // Assert
      expect(Array.isArray(response.body)).toBe(true);
      
      // If we have project time data
      if (response.body.length > 0) {
        const firstProject = response.body[0];
        expect(firstProject.projectId).toBeDefined();
        expect(firstProject.totalTime).toBeDefined();
        expect(firstProject.percentage).toBeDefined();
      }
    });
  });

  describe('GET /task-analytics/task-completion-trend', () => {
    it('should return task completion trend using real database data', async () => {
      // Act - using real database
      const response = await request(app.getHttpServer())
        .get('/api/task-analytics/task-completion-trend?timeframe=week&projectId=test-project-1')
        .expect(200);

      // Assert
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /task-analytics/task-status-distribution', () => {
    it('should return task status distribution using real database data', async () => {
      // Act - using real database
      const response = await request(app.getHttpServer())
        .get('/api/task-analytics/task-status-distribution?projectId=test-project-1')
        .expect(200);

      // Assert
      expect(response.body).toBeDefined();
      
      // The response format may vary based on your implementation,
      // but common fields in task status distribution would be:
      // TODO, IN_PROGRESS, COMPLETED, REVIEW, etc.
      const keys = Object.keys(response.body);
      expect(keys.length).toBeGreaterThan(0);
    });
  });

  describe('GET /task-analytics/average-completion-time', () => {
    it('should return average completion time using real database data', async () => {
      // Act - using real database
      const response = await request(app.getHttpServer())
        .get('/api/task-analytics/average-completion-time?projectId=test-project-1')
        .expect(200);

      // Assert
      expect(response.body).toBeDefined();
      expect(response.body.averageDays).toBeDefined();
      
      // Check if we have priority breakdown
      if (response.body.byPriority) {
        expect(typeof response.body.byPriority).toBe('object');
      }
    });
  });

  describe('GET /task-analytics/user-productivity', () => {
    it('should return user productivity metrics using real database data', async () => {
      // Act - using real database
      const response = await request(app.getHttpServer())
        .get(`/api/task-analytics/user-productivity?userId=test-user-1&timeframe=month`)
        .expect(200);

      // Assert
      expect(response.body).toBeDefined();
      expect(response.body.tasksCompleted).toBeDefined();
      expect(response.body.totalTimeLogged).toBeDefined();
      
      // Additional metrics that might be present
      if (response.body.byStatus) {
        expect(Array.isArray(response.body.byStatus)).toBe(true);
      }
    });
  });
});
