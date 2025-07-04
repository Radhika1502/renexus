import { rest } from 'msw';

// Mock data for tasks
const tasks = [
  {
    id: 'task-1',
    title: 'Implement authentication',
    description: 'Set up JWT authentication flow',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assigneeId: 'user-1',
    projectId: 'project-1',
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2023-01-16T14:30:00Z',
    estimatedHours: 8,
    loggedHours: 4,
    timeLog: [
      {
        hours: 2,
        description: 'Researched JWT libraries',
        date: '2023-01-15T14:00:00Z',
        userId: 'user-1'
      },
      {
        hours: 2,
        description: 'Implemented token generation',
        date: '2023-01-16T10:00:00Z',
        userId: 'user-1'
      }
    ]
  },
  {
    id: 'task-2',
    title: 'Design database schema',
    description: 'Create ERD and SQL scripts',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    assigneeId: 'user-2',
    projectId: 'project-1',
    createdAt: '2023-01-10T09:00:00Z',
    updatedAt: '2023-01-12T16:45:00Z',
    estimatedHours: 6,
    loggedHours: 5,
    timeLog: [
      {
        hours: 3,
        description: 'Created initial ERD',
        date: '2023-01-10T13:00:00Z',
        userId: 'user-2'
      },
      {
        hours: 2,
        description: 'Finalized schema and created SQL scripts',
        date: '2023-01-12T14:00:00Z',
        userId: 'user-2'
      }
    ]
  }
];

// Mock data for team performance
const teamPerformance = [
  {
    teamId: 'team-1',
    teamName: 'Frontend Team',
    completedTasks: 24,
    totalTasks: 30,
    completionRate: 0.8,
    averageTimeToComplete: 3.5, // days
    projectId: 'project-1'
  },
  {
    teamId: 'team-2',
    teamName: 'Backend Team',
    completedTasks: 18,
    totalTasks: 25,
    completionRate: 0.72,
    averageTimeToComplete: 4.2, // days
    projectId: 'project-1'
  },
  {
    teamId: 'team-3',
    teamName: 'QA Team',
    completedTasks: 15,
    totalTasks: 20,
    completionRate: 0.75,
    averageTimeToComplete: 2.8, // days
    projectId: 'project-1'
  }
];

// Mock data for timeline events
const timelineEvents = [
  {
    id: 'event-1',
    title: 'Project kickoff',
    description: 'Initial project meeting with stakeholders',
    date: '2023-01-05T10:00:00Z',
    type: 'MILESTONE',
    projectId: 'project-1'
  },
  {
    id: 'event-2',
    title: 'Design phase completed',
    description: 'UI/UX designs approved by client',
    date: '2023-01-15T16:30:00Z',
    type: 'MILESTONE',
    projectId: 'project-1'
  },
  {
    id: 'event-3',
    title: 'Sprint 1 started',
    description: 'First development sprint begins',
    date: '2023-01-20T09:00:00Z',
    type: 'SPRINT',
    projectId: 'project-1'
  },
  {
    id: 'event-4',
    title: 'Database migration issue',
    description: 'Critical issue with database migration script',
    date: '2023-01-25T14:20:00Z',
    type: 'ISSUE',
    projectId: 'project-1'
  },
  {
    id: 'event-5',
    title: 'Sprint 1 completed',
    description: 'First sprint completed with 90% of planned story points',
    date: '2023-02-03T17:00:00Z',
    type: 'SPRINT',
    projectId: 'project-1'
  }
];

export const handlers = [
  // Task endpoints
  rest.get('/api/tasks', (req, res, ctx) => {
    const status = req.url.searchParams.get('status');
    const assigneeId = req.url.searchParams.get('assigneeId');
    const projectId = req.url.searchParams.get('projectId');
    
    let filteredTasks = [...tasks];
    
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    
    if (assigneeId) {
      filteredTasks = filteredTasks.filter(task => task.assigneeId === assigneeId);
    }
    
    if (projectId) {
      filteredTasks = filteredTasks.filter(task => task.projectId === projectId);
    }
    
    return res(ctx.status(200), ctx.json(filteredTasks));
  }),
  
  rest.get('/api/tasks/:taskId', (req, res, ctx) => {
    const { taskId } = req.params;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      return res(ctx.status(404), ctx.json({ message: 'Task not found' }));
    }
    
    return res(ctx.status(200), ctx.json(task));
  }),
  
  rest.post('/api/tasks', (req, res, ctx) => {
    const newTask = {
      id: `task-${tasks.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      loggedHours: 0,
      timeLog: [],
      ...req.body
    };
    
    tasks.push(newTask);
    
    return res(ctx.status(201), ctx.json({ status: 'success', data: newTask }));
  }),
  
  rest.patch('/api/tasks/:taskId', (req, res, ctx) => {
    const { taskId } = req.params;
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res(ctx.status(404), ctx.json({ message: 'Task not found' }));
    }
    
    const updatedTask = {
      ...tasks[taskIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    tasks[taskIndex] = updatedTask;
    
    return res(ctx.status(200), ctx.json(updatedTask));
  }),
  
  rest.delete('/api/tasks/:taskId', (req, res, ctx) => {
    const { taskId } = req.params;
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res(ctx.status(404), ctx.json({ message: 'Task not found' }));
    }
    
    tasks.splice(taskIndex, 1);
    
    return res(ctx.status(200), ctx.json({ status: 'success', message: 'Task deleted' }));
  }),

  // Team performance endpoint
  rest.get('/api/analytics/team-performance', (req, res, ctx) => {
    const startDate = req.url.searchParams.get('startDate');
    const endDate = req.url.searchParams.get('endDate');
    const projectId = req.url.searchParams.get('projectId');
    
    // In a real implementation, we would filter by date range
    // For this mock, we'll just return all data
    let filteredTeamPerformance = [...teamPerformance];
    
    if (projectId) {
      filteredTeamPerformance = filteredTeamPerformance.filter(team => team.projectId === projectId);
    }
    
    return res(ctx.status(200), ctx.json(filteredTeamPerformance));
  }),

  // Timeline events endpoint
  rest.get('/api/timeline-events', (req, res, ctx) => {
    const startDate = req.url.searchParams.get('startDate');
    const endDate = req.url.searchParams.get('endDate');
    const type = req.url.searchParams.get('type');
    const projectId = req.url.searchParams.get('projectId');
    
    let filteredEvents = [...timelineEvents];
    
    if (type) {
      filteredEvents = filteredEvents.filter(event => event.type === type);
    }
    
    if (projectId) {
      filteredEvents = filteredEvents.filter(event => event.projectId === projectId);
    }
    
    // In a real implementation, we would filter by date range
    // For this mock, we'll just return all data
    
    return res(ctx.status(200), ctx.json(filteredEvents));
  })
];
