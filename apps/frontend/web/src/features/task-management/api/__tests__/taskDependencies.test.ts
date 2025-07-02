import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { createTaskDependency, removeTaskDependency, getTaskDependencies, checkCircularDependency } from '../taskDependencyApi';

// Mock server setup
const server = setupServer(
  // GET task dependencies
  rest.get('/api/tasks/:taskId/dependencies', (req, res, ctx) => {
    const { taskId } = req.params;
    return res(
      ctx.status(200),
      ctx.json([
        { id: '1', sourceTaskId: taskId, targetTaskId: '2', type: 'blocks' },
        { id: '2', sourceTaskId: taskId, targetTaskId: '3', type: 'relates_to' }
      ])
    );
  }),
  
  // POST create dependency
  rest.post('/api/tasks/dependencies', (req, res, ctx) => {
    const dependency = req.body as any;
    return res(
      ctx.status(201),
      ctx.json({
        id: '3',
        ...dependency,
        createdAt: new Date().toISOString()
      })
    );
  }),
  
  // DELETE dependency
  rest.delete('/api/tasks/dependencies/:id', (req, res, ctx) => {
    return res(
      ctx.status(204)
    );
  }),
  
  // Check circular dependency
  rest.post('/api/tasks/dependencies/check-circular', (req, res, ctx) => {
    const { sourceTaskId, targetTaskId } = req.body as any;
    
    // Simulate circular dependency when specific IDs are used
    const hasCircular = sourceTaskId === '5' && targetTaskId === '1';
    
    return res(
      ctx.status(200),
      ctx.json({
        hasCircularDependency: hasCircular,
        path: hasCircular ? ['1', '3', '4', '5', '1'] : []
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

describe('Task Dependencies API', () => {
  it('should create a new task dependency', async () => {
    const newDependency = {
      sourceTaskId: '1',
      targetTaskId: '2',
      type: 'blocks'
    };
    
    const result = await createTaskDependency(newDependency);
    
    expect(result).toHaveProperty('id', '3');
    expect(result).toHaveProperty('sourceTaskId', '1');
    expect(result).toHaveProperty('targetTaskId', '2');
    expect(result).toHaveProperty('type', 'blocks');
    expect(result).toHaveProperty('createdAt');
  });
  
  it('should remove a task dependency', async () => {
    const result = await removeTaskDependency('1');
    expect(result).toBe(true);
  });
  
  it('should get all dependencies for a task', async () => {
    const result = await getTaskDependencies('1');
    
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty('id', '1');
    expect(result[0]).toHaveProperty('sourceTaskId', '1');
    expect(result[0]).toHaveProperty('targetTaskId', '2');
    expect(result[0]).toHaveProperty('type', 'blocks');
  });
  
  it('should detect circular dependencies', async () => {
    // Test case with no circular dependency
    const result1 = await checkCircularDependency('1', '2');
    expect(result1.hasCircularDependency).toBe(false);
    expect(result1.path).toEqual([]);
    
    // Test case with circular dependency
    const result2 = await checkCircularDependency('5', '1');
    expect(result2.hasCircularDependency).toBe(true);
    expect(result2.path).toEqual(['1', '3', '4', '5', '1']);
  });
});
