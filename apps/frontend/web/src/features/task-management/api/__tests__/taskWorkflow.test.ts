import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { 
  getWorkflowRules, 
  createWorkflowRule, 
  updateWorkflowRule, 
  deleteWorkflowRule,
  triggerWorkflowRules
} from '../taskWorkflowApi';

// Mock server setup
const server = setupServer(
  // GET workflow rules
  rest.get('/api/workflow/rules', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          name: 'Auto-assign high priority tasks',
          description: 'Automatically assign high priority tasks to team lead',
          conditions: [
            { field: 'priority', operator: 'equals', value: 'high' }
          ],
          actions: [
            { type: 'assign', value: 'user-123' }
          ],
          isActive: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Auto-notify on deadline approaching',
          description: 'Send notification when task deadline is within 24 hours',
          conditions: [
            { field: 'dueDate', operator: 'within', value: '24h' }
          ],
          actions: [
            { type: 'notify', value: 'all-assignees' }
          ],
          isActive: true,
          createdAt: new Date().toISOString()
        }
      ])
    );
  }),
  
  // POST create workflow rule
  rest.post('/api/workflow/rules', (req, res, ctx) => {
    const rule = req.body as any;
    return res(
      ctx.status(201),
      ctx.json({
        id: '3',
        ...rule,
        createdAt: new Date().toISOString()
      })
    );
  }),
  
  // PUT update workflow rule
  rest.put('/api/workflow/rules/:id', (req, res, ctx) => {
    const { id } = req.params;
    const rule = req.body as any;
    return res(
      ctx.status(200),
      ctx.json({
        id,
        ...rule,
        updatedAt: new Date().toISOString()
      })
    );
  }),
  
  // DELETE workflow rule
  rest.delete('/api/workflow/rules/:id', (req, res, ctx) => {
    return res(
      ctx.status(204)
    );
  }),
  
  // POST trigger workflow rules
  rest.post('/api/workflow/trigger', (req, res, ctx) => {
    const { taskId, event } = req.body as any;
    
    // Simulate rules being triggered
    const rulesTriggered = [
      {
        ruleId: '1',
        ruleName: 'Auto-assign high priority tasks',
        actions: [
          { type: 'assign', value: 'user-123', success: true }
        ]
      }
    ];
    
    return res(
      ctx.status(200),
      ctx.json({
        taskId,
        event,
        rulesTriggered,
        timestamp: new Date().toISOString()
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

describe('Task Workflow API', () => {
  it('should get all workflow rules', async () => {
    const result = await getWorkflowRules();
    
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty('id', '1');
    expect(result[0]).toHaveProperty('name', 'Auto-assign high priority tasks');
    expect(result[0]).toHaveProperty('conditions');
    expect(result[0]).toHaveProperty('actions');
    expect(result[0]).toHaveProperty('isActive', true);
  });
  
  it('should create a new workflow rule', async () => {
    const newRule = {
      name: 'Auto-tag support tasks',
      description: 'Automatically tag tasks with "support" when they contain support keywords',
      conditions: [
        { field: 'title', operator: 'contains', value: 'support' }
      ],
      actions: [
        { type: 'addTag', value: 'support' }
      ],
      isActive: true
    };
    
    const result = await createWorkflowRule(newRule);
    
    expect(result).toHaveProperty('id', '3');
    expect(result).toHaveProperty('name', 'Auto-tag support tasks');
    expect(result).toHaveProperty('conditions');
    expect(result.conditions.length).toBe(1);
    expect(result).toHaveProperty('actions');
    expect(result.actions.length).toBe(1);
    expect(result).toHaveProperty('isActive', true);
    expect(result).toHaveProperty('createdAt');
  });
  
  it('should update an existing workflow rule', async () => {
    const updatedRule = {
      name: 'Updated rule name',
      description: 'Updated description',
      conditions: [
        { field: 'status', operator: 'equals', value: 'done' }
      ],
      actions: [
        { type: 'notify', value: 'all-watchers' }
      ],
      isActive: false
    };
    
    const result = await updateWorkflowRule('1', updatedRule);
    
    expect(result).toHaveProperty('id', '1');
    expect(result).toHaveProperty('name', 'Updated rule name');
    expect(result).toHaveProperty('description', 'Updated description');
    expect(result).toHaveProperty('conditions');
    expect(result.conditions.length).toBe(1);
    expect(result).toHaveProperty('actions');
    expect(result.actions.length).toBe(1);
    expect(result).toHaveProperty('isActive', false);
    expect(result).toHaveProperty('updatedAt');
  });
  
  it('should delete a workflow rule', async () => {
    const result = await deleteWorkflowRule('1');
    expect(result).toBe(true);
  });
  
  it('should trigger workflow rules for a task event', async () => {
    const result = await triggerWorkflowRules('task-123', 'update');
    
    expect(result).toHaveProperty('taskId', 'task-123');
    expect(result).toHaveProperty('event', 'update');
    expect(result).toHaveProperty('rulesTriggered');
    expect(Array.isArray(result.rulesTriggered)).toBe(true);
    expect(result.rulesTriggered.length).toBe(1);
    expect(result.rulesTriggered[0]).toHaveProperty('ruleId', '1');
    expect(result.rulesTriggered[0]).toHaveProperty('ruleName');
    expect(result.rulesTriggered[0]).toHaveProperty('actions');
    expect(result).toHaveProperty('timestamp');
  });
});
