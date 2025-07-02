import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { getTaskAnalytics, getTasksByStatus, getTasksByPriority, getTaskVelocity } from '../taskAnalyticsApi';

// Mock server setup
const server = setupServer(
  // GET task analytics summary
  rest.get('/api/analytics/tasks/summary', (req, res, ctx) => {
    const dateRange = req.url.searchParams.get('dateRange') || 'week';
    
    return res(
      ctx.status(200),
      ctx.json({
        totalTasks: 120,
        completedTasks: 85,
        inProgressTasks: 25,
        backlogTasks: 10,
        averageCompletionTime: 3.5, // days
        dateRange
      })
    );
  }),
  
  // GET tasks by status
  rest.get('/api/analytics/tasks/by-status', (req, res, ctx) => {
    const dateRange = req.url.searchParams.get('dateRange') || 'week';
    
    return res(
      ctx.status(200),
      ctx.json({
        dateRange,
        data: [
          { status: 'backlog', count: 10 },
          { status: 'todo', count: 15 },
          { status: 'inProgress', count: 25 },
          { status: 'review', count: 5 },
          { status: 'done', count: 85 }
        ]
      })
    );
  }),
  
  // GET tasks by priority
  rest.get('/api/analytics/tasks/by-priority', (req, res, ctx) => {
    const dateRange = req.url.searchParams.get('dateRange') || 'week';
    
    return res(
      ctx.status(200),
      ctx.json({
        dateRange,
        data: [
          { priority: 'lowest', count: 5 },
          { priority: 'low', count: 15 },
          { priority: 'medium', count: 60 },
          { priority: 'high', count: 30 },
          { priority: 'highest', count: 10 }
        ]
      })
    );
  }),
  
  // GET task velocity
  rest.get('/api/analytics/tasks/velocity', (req, res, ctx) => {
    const dateRange = req.url.searchParams.get('dateRange') || 'week';
    
    return res(
      ctx.status(200),
      ctx.json({
        dateRange,
        data: [
          { date: '2025-06-25', completed: 12 },
          { date: '2025-06-26', completed: 8 },
          { date: '2025-06-27', completed: 15 },
          { date: '2025-06-28', completed: 5 },
          { date: '2025-06-29', completed: 0 },
          { date: '2025-06-30', completed: 18 },
          { date: '2025-07-01', completed: 14 },
          { date: '2025-07-02', completed: 13 }
        ],
        averageVelocity: 10.6
      })
    );
  })
);

// Enable API mocking before tests
beforeAll(() => server.listen());

// Reset any runtime request handlers we may add during the tests
afterEach(() => server.resetHandlers());

// Disable API mocking after the tests are done
afterAll(() => server.close());

describe('Task Analytics API', () => {
  it('should get task analytics summary with different date ranges', async () => {
    // Test with default date range (week)
    const weekResult = await getTaskAnalytics();
    
    expect(weekResult).toHaveProperty('totalTasks', 120);
    expect(weekResult).toHaveProperty('completedTasks', 85);
    expect(weekResult).toHaveProperty('inProgressTasks', 25);
    expect(weekResult).toHaveProperty('backlogTasks', 10);
    expect(weekResult).toHaveProperty('dateRange', 'week');
    
    // Test with month date range
    const monthResult = await getTaskAnalytics('month');
    expect(monthResult).toHaveProperty('dateRange', 'month');
    
    // Test with quarter date range
    const quarterResult = await getTaskAnalytics('quarter');
    expect(quarterResult).toHaveProperty('dateRange', 'quarter');
    
    // Test with year date range
    const yearResult = await getTaskAnalytics('year');
    expect(yearResult).toHaveProperty('dateRange', 'year');
  });
  
  it('should get tasks by status with different date ranges', async () => {
    // Test with default date range (week)
    const weekResult = await getTasksByStatus();
    
    expect(weekResult).toHaveProperty('dateRange', 'week');
    expect(weekResult).toHaveProperty('data');
    expect(Array.isArray(weekResult.data)).toBe(true);
    expect(weekResult.data.length).toBe(5);
    expect(weekResult.data[0]).toHaveProperty('status');
    expect(weekResult.data[0]).toHaveProperty('count');
    
    // Test with month date range
    const monthResult = await getTasksByStatus('month');
    expect(monthResult).toHaveProperty('dateRange', 'month');
    
    // Test with custom date range
    const customResult = await getTasksByStatus('custom');
    expect(customResult).toHaveProperty('dateRange', 'custom');
  });
  
  it('should get tasks by priority with different date ranges', async () => {
    // Test with default date range (week)
    const weekResult = await getTasksByPriority();
    
    expect(weekResult).toHaveProperty('dateRange', 'week');
    expect(weekResult).toHaveProperty('data');
    expect(Array.isArray(weekResult.data)).toBe(true);
    expect(weekResult.data.length).toBe(5);
    expect(weekResult.data[0]).toHaveProperty('priority');
    expect(weekResult.data[0]).toHaveProperty('count');
    
    // Test with month date range
    const monthResult = await getTasksByPriority('month');
    expect(monthResult).toHaveProperty('dateRange', 'month');
  });
  
  it('should get task velocity with different date ranges', async () => {
    // Test with default date range (week)
    const weekResult = await getTaskVelocity();
    
    expect(weekResult).toHaveProperty('dateRange', 'week');
    expect(weekResult).toHaveProperty('data');
    expect(Array.isArray(weekResult.data)).toBe(true);
    expect(weekResult.data.length).toBe(8); // 8 days of data
    expect(weekResult.data[0]).toHaveProperty('date');
    expect(weekResult.data[0]).toHaveProperty('completed');
    expect(weekResult).toHaveProperty('averageVelocity', 10.6);
    
    // Test with month date range
    const monthResult = await getTaskVelocity('month');
    expect(monthResult).toHaveProperty('dateRange', 'month');
  });
});
