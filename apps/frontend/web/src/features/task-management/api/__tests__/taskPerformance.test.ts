import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { getAllTasks } from '../taskApi';
import { performance } from 'perf_hooks';

// Generate a large number of mock tasks
const generateMockTasks = (count: number) => {
  const tasks = [];
  const statuses = ['backlog', 'todo', 'inProgress', 'review', 'done'];
  const priorities = ['lowest', 'low', 'medium', 'high', 'highest'];
  
  for (let i = 0; i < count; i++) {
    tasks.push({
      id: `task-${i}`,
      title: `Task ${i}`,
      description: `Description for task ${i}`,
      status: statuses[i % statuses.length],
      priority: priorities[i % priorities.length],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  return tasks;
};

// Mock server setup with configurable task count
let taskCount = 100;

const server = setupServer(
  // GET all tasks with configurable count
  rest.get('/api/tasks', (req, res, ctx) => {
    const tasks = generateMockTasks(taskCount);
    return res(
      ctx.status(200),
      ctx.json(tasks)
    );
  })
);

// Enable API mocking before tests
beforeAll(() => server.listen());

// Reset any runtime request handlers we may add during the tests
afterEach(() => server.resetHandlers());

// Disable API mocking after the tests are done
afterAll(() => server.close());

describe('Task API Performance', () => {
  it('should handle 100 tasks efficiently', async () => {
    taskCount = 100;
    
    const startTime = performance.now();
    const result = await getAllTasks();
    const endTime = performance.now();
    
    const executionTime = endTime - startTime;
    
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(100);
    expect(executionTime).toBeLessThan(500); // Should complete in less than 500ms
  });
  
  it('should handle 1000 tasks efficiently', async () => {
    taskCount = 1000;
    
    const startTime = performance.now();
    const result = await getAllTasks();
    const endTime = performance.now();
    
    const executionTime = endTime - startTime;
    
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1000);
    expect(executionTime).toBeLessThan(1000); // Should complete in less than 1000ms
  });
  
  it('should handle 5000 tasks efficiently', async () => {
    taskCount = 5000;
    
    const startTime = performance.now();
    const result = await getAllTasks();
    const endTime = performance.now();
    
    const executionTime = endTime - startTime;
    
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(5000);
    expect(executionTime).toBeLessThan(3000); // Should complete in less than 3000ms
  });
});
