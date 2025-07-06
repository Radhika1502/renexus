import autocannon from 'autocannon';
import { app } from '../../app';
import { createServer } from 'http';
import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  createTestUser,
  generateAuthToken 
} from '../setup';
import { PrismaClient } from '@prisma/client';

describe('API Performance Tests', () => {
  let server: any;
  let prisma: PrismaClient;
  let authToken: string;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
    const user = await createTestUser(prisma);
    authToken = generateAuthToken(user.id);
    server = createServer(app).listen(3001);
  });

  afterAll(async () => {
    await teardownTestDatabase(prisma);
    server.close();
  });

  const runLoadTest = (
    url: string,
    method: 'GET' | 'POST' = 'GET',
    headers = {},
    body?: any
  ) => {
    return new Promise((resolve, reject) => {
      const instance = autocannon({
        url: `http://localhost:3001${url}`,
        connections: 10,
        pipelining: 1,
        duration: 10,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      autocannon.track(instance);

      instance.on('done', resolve);
      instance.on('error', reject);
    });
  };

  it('should handle high load on project listing', async () => {
    const result: any = await runLoadTest('/api/projects', 'GET', {
      Authorization: `Bearer ${authToken}`,
    });

    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.non2xx).toBe(0);
    expect(result.latency.p99).toBeLessThan(1000); // 99th percentile under 1s
  });

  it('should handle concurrent task creation', async () => {
    const result: any = await runLoadTest(
      '/api/tasks',
      'POST',
      {
        Authorization: `Bearer ${authToken}`,
      },
      {
        title: 'Performance Test Task',
        description: 'Testing concurrent task creation',
        priority: 'MEDIUM',
      }
    );

    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.non2xx).toBe(0);
    expect(result.latency.p95).toBeLessThan(500); // 95th percentile under 500ms
  });

  it('should handle notification fetching under load', async () => {
    // Create test notifications
    await Promise.all(
      Array.from({ length: 100 }, () =>
        prisma.notification.create({
          data: {
            userId: 'test-user',
            type: 'test',
            title: 'Test Notification',
            message: 'Performance test notification',
            isRead: false,
          },
        })
      )
    );

    const result: any = await runLoadTest('/api/notifications', 'GET', {
      Authorization: `Bearer ${authToken}`,
    });

    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.non2xx).toBe(0);
    expect(result.latency.average).toBeLessThan(200); // Average under 200ms
  });

  it('should handle real-time updates efficiently', async () => {
    const result: any = await runLoadTest('/api/events', 'GET', {
      Authorization: `Bearer ${authToken}`,
      'Accept': 'text/event-stream',
    });

    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.non2xx).toBe(0);
    expect(result.latency.p99).toBeLessThan(100); // 99th percentile under 100ms
  });

  it('should handle search queries under load', async () => {
    const result: any = await runLoadTest('/api/search', 'GET', {
      Authorization: `Bearer ${authToken}`,
    }, {
      query: 'test',
      type: 'task',
    });

    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.non2xx).toBe(0);
    expect(result.latency.average).toBeLessThan(300); // Average under 300ms
  });

  it('should maintain performance with database operations', async () => {
    // Create test data
    await Promise.all([
      createTestUser(prisma),
      createTestUser(prisma),
      createTestUser(prisma),
    ]);

    const result: any = await runLoadTest('/api/users', 'GET', {
      Authorization: `Bearer ${authToken}`,
    });

    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.non2xx).toBe(0);
    expect(result.latency.p95).toBeLessThan(200); // 95th percentile under 200ms
  });
}); 