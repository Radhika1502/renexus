import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { TaskStatus, TaskPriority } from '../../types';
import { createTask, getTask, updateTask, deleteTask, getAllTasks } from '../taskApi';

// Mock server setup
const server = setupServer(
  // GET single task
  rest.get('/api/tasks/:id', (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        id,
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo' as TaskStatus,
        priority: 'medium' as TaskPriority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    );
  }),
  
  // GET all tasks
  rest.get('/api/tasks', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          title: 'Task 1',
          description: 'Description 1',
          status: 'todo' as TaskStatus,
          priority: 'medium' as TaskPriority,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Task 2',
          description: 'Description 2',
          status: 'inProgress' as TaskStatus,
          priority: 'high' as TaskPriority,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ])
    );
  }),
  
  // POST create task
  rest.post('/api/tasks', (req, res, ctx) => {
    const newTask = req.body as any;
    return res(
      ctx.status(201),
      ctx.json({
        id: '3',
        ...newTask,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
    );
  }),
  
  // PUT update task
  rest.put('/api/tasks/:id', (req, res, ctx) => {
    const { id } = req.params;
    const updatedTask = req.body as any;
    return res(
      ctx.status(200),
      ctx.json({
        id,
        ...updatedTask,
        updatedAt: new Date().toISOString()
      })
    );
  }),
  
  // DELETE task
  rest.delete('/api/tasks/:id', (req, res, ctx) => {
    return res(
      ctx.status(204)
    );
  })
);

// Enable API mocking before tests
beforeAll(() => server.listen());

// Reset any runtime request handlers we may add during the tests
afterEach(() => server.resetHandlers());

// Disable API mocking after the tests are done
afterAll(() => server.close());

describe('Task API', () => {
  describe('CRUD operations', () => {
    it('should create a new task', async () => {
      const newTask = {
        title: 'New Task',
        description: 'New Description',
        status: 'todo' as TaskStatus,
        priority: 'medium' as TaskPriority
      };
      
      const result = await createTask(newTask);
      
      expect(result).toHaveProperty('id', '3');
      expect(result).toHaveProperty('title', 'New Task');
      expect(result).toHaveProperty('description', 'New Description');
      expect(result).toHaveProperty('status', 'todo');
      expect(result).toHaveProperty('priority', 'medium');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
    
    it('should get a task by ID', async () => {
      const result = await getTask('1');
      
      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('title', 'Test Task');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('priority');
    });
    
    it('should update an existing task', async () => {
      const updatedTask = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'inProgress' as TaskStatus,
        priority: 'high' as TaskPriority
      };
      
      const result = await updateTask('1', updatedTask);
      
      expect(result).toHaveProperty('id', '1');
      expect(result).toHaveProperty('title', 'Updated Task');
      expect(result).toHaveProperty('description', 'Updated Description');
      expect(result).toHaveProperty('status', 'inProgress');
      expect(result).toHaveProperty('priority', 'high');
      expect(result).toHaveProperty('updatedAt');
    });
    
    it('should delete a task', async () => {
      const result = await deleteTask('1');
      expect(result).toBe(true);
    });
    
    it('should get all tasks', async () => {
      const result = await getAllTasks();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toHaveProperty('id', '1');
      expect(result[1]).toHaveProperty('id', '2');
    });
  });
});
