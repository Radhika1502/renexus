/**
 * Enhanced mock database module for Phase 5 integration tests
 * Provides a comprehensive set of mocks for all database interactions
 */

// Mock data for tests with all required properties
const mockProjects = [
  {
    id: 'project-1',
    name: 'Project 1',
    description: 'Description 1',
    status: 'active',
    tenantId: 'tenant-1',
    createdAt: new Date('2023-01-01').toISOString(),
    updatedAt: new Date('2023-01-10').toISOString()
  },
  {
    id: 'project-2',
    name: 'Project 2',
    description: 'Description 2',
    status: 'archived',
    tenantId: 'tenant-1',
    createdAt: new Date('2023-02-01').toISOString(),
    updatedAt: new Date('2023-02-15').toISOString()
  }
];

const mockTasks = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'Description 1',
    status: 'TODO',
    priority: 'MEDIUM',
    projectId: 'project-1',
    assigneeId: 'user-1',
    createdAt: new Date('2023-01-05').toISOString(),
    updatedAt: new Date('2023-01-10').toISOString(),
    dueDate: new Date('2023-02-01').toISOString()
  },
  {
    id: 'task-2',
    title: 'Task 2',
    description: 'Description 2',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    projectId: 'project-1',
    assigneeId: 'user-2',
    createdAt: new Date('2023-01-15').toISOString(),
    updatedAt: new Date('2023-01-20').toISOString(),
    dueDate: new Date('2023-02-10').toISOString()
  }
];

const mockUsers = [
  {
    id: 'user-1',
    name: 'User 1',
    email: 'user1@example.com',
    tenantId: 'tenant-1',
    role: 'ADMIN',
    createdAt: new Date('2023-01-01').toISOString(),
    updatedAt: new Date('2023-01-01').toISOString()
  },
  {
    id: 'user-2',
    name: 'User 2',
    email: 'user2@example.com',
    tenantId: 'tenant-1',
    role: 'USER',
    createdAt: new Date('2023-01-02').toISOString(),
    updatedAt: new Date('2023-01-02').toISOString()
  }
];

const mockTimeLogs = [
  {
    id: 'log-1',
    taskId: 'task-1',
    userId: 'user-1',
    description: 'Working on task 1',
    startTime: '2023-01-10T10:00:00Z',
    endTime: '2023-01-10T12:00:00Z',
    duration: 7200, // 2 hours in seconds
    createdAt: new Date('2023-01-10').toISOString()
  },
  {
    id: 'log-2',
    taskId: 'task-2',
    userId: 'user-2',
    description: 'Working on task 2',
    startTime: '2023-01-15T14:00:00Z',
    endTime: '2023-01-15T17:00:00Z',
    duration: 10800, // 3 hours in seconds
    createdAt: new Date('2023-01-15').toISOString()
  }
];

// Enhanced database mock with comprehensive method implementations
const dbMock = {
  // Basic query methods
  query: jest.fn().mockImplementation(() => Promise.resolve([])),
  execute: jest.fn().mockImplementation(() => Promise.resolve({ rows: [] })),
  
  // Select operations with table-specific responses
  select: jest.fn().mockImplementation((table) => {
    const mockResponses = {
      projects: mockProjects,
      tasks: mockTasks,
      users: mockUsers,
      timeLogs: mockTimeLogs,
      taskAssignees: mockTasks.map(task => ({
        taskId: task.id,
        userId: task.assigneeId
      }))
    };
    return Promise.resolve(mockResponses[table] || []);
  }),
  
  // Insert operations
  insert: jest.fn().mockImplementation((table, data) => {
    const newId = `new-${table.slice(0, -1)}-id`;
    const newRecord = {
      ...data,
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return Promise.resolve(newRecord);
  }),
  
  // Update operations
  update: jest.fn().mockImplementation((table, id, data) => {
    let record;
    switch(table) {
      case 'projects':
        record = mockProjects.find(p => p.id === id) || mockProjects[0];
        break;
      case 'tasks':
        record = mockTasks.find(t => t.id === id) || mockTasks[0];
        break;
      case 'users':
        record = mockUsers.find(u => u.id === id) || mockUsers[0];
        break;
      default:
        record = { id };
    }
    return Promise.resolve({
      ...record,
      ...data,
      updatedAt: new Date().toISOString()
    });
  }),
  
  // Delete operations
  delete: jest.fn().mockImplementation(() => Promise.resolve({ success: true })),
  
  // Transaction support
  transaction: jest.fn().mockImplementation((callback) => {
    return Promise.resolve(callback(dbMock));
  }),
  
  // Query builder methods
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  first: jest.fn().mockImplementation(() => {
    // Return first item based on last called table
    const table = dbMock.lastTable || 'tasks';
    const mockResponses = {
      projects: mockProjects[0],
      tasks: mockTasks[0],
      users: mockUsers[0],
      timeLogs: mockTimeLogs[0]
    };
    return Promise.resolve(mockResponses[table] || null);
  }),
  exec: jest.fn().mockImplementation(() => {
    // Return collection based on last called table
    const table = dbMock.lastTable || 'tasks';
    const mockResponses = {
      projects: mockProjects,
      tasks: mockTasks,
      users: mockUsers,
      timeLogs: mockTimeLogs
    };
    return Promise.resolve(mockResponses[table] || []);
  }),
  
  // Track last used table for context-aware responses
  lastTable: null,
  table: jest.fn().mockImplementation((tableName) => {
    dbMock.lastTable = tableName;
    return dbMock;
  })
};

// Enhanced schema mock with comprehensive field definitions
const schemaMock = {
  tasks: { 
    id: 'id', 
    title: 'title', 
    description: 'description',
    status: 'status', 
    priority: 'priority',
    projectId: 'projectId',
    assigneeId: 'assigneeId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    dueDate: 'dueDate'
  },
  taskAssignees: { 
    taskId: 'taskId', 
    userId: 'userId', 
    assignedAt: 'assignedAt',
    assignedBy: 'assignedBy'
  },
  users: { 
    id: 'id', 
    name: 'name', 
    email: 'email',
    password: 'password',
    tenantId: 'tenantId',
    role: 'role',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },
  projects: { 
    id: 'id', 
    name: 'name',
    description: 'description',
    status: 'status',
    tenantId: 'tenantId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },
  timeLogs: { 
    id: 'id', 
    taskId: 'taskId', 
    userId: 'userId', 
    description: 'description',
    startTime: 'startTime', 
    endTime: 'endTime', 
    duration: 'duration',
    createdAt: 'createdAt'
  }
};

// Comprehensive Prisma-style mock for NestJS tests
const prismaMock = {
  task: {
    findMany: jest.fn().mockResolvedValue(mockTasks),
    findFirst: jest.fn().mockResolvedValue(mockTasks[0]),
    findUnique: jest.fn().mockResolvedValue(mockTasks[0]),
    create: jest.fn().mockResolvedValue(mockTasks[0]),
    update: jest.fn().mockResolvedValue(mockTasks[0]),
    delete: jest.fn().mockResolvedValue(mockTasks[0]),
    deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
    upsert: jest.fn().mockResolvedValue(mockTasks[0]),
    count: jest.fn().mockResolvedValue(mockTasks.length)
  },
  timeLog: {
    findMany: jest.fn().mockResolvedValue(mockTimeLogs),
    findFirst: jest.fn().mockResolvedValue(mockTimeLogs[0]),
    findUnique: jest.fn().mockResolvedValue(mockTimeLogs[0]),
    create: jest.fn().mockResolvedValue(mockTimeLogs[0]),
    update: jest.fn().mockResolvedValue(mockTimeLogs[0]),
    delete: jest.fn().mockResolvedValue(mockTimeLogs[0]),
    deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
    upsert: jest.fn().mockResolvedValue(mockTimeLogs[0]),
    count: jest.fn().mockResolvedValue(mockTimeLogs.length),
    aggregate: jest.fn().mockResolvedValue({
      _sum: {
        duration: mockTimeLogs.reduce((sum, log) => sum + log.duration, 0)
      },
      _avg: {
        duration: mockTimeLogs.reduce((sum, log) => sum + log.duration, 0) / mockTimeLogs.length
      },
      _count: {
        duration: mockTimeLogs.length
      }
    })
  },
  project: {
    findMany: jest.fn().mockResolvedValue(mockProjects),
    findFirst: jest.fn().mockResolvedValue(mockProjects[0]),
    findUnique: jest.fn().mockResolvedValue(mockProjects[0]),
    create: jest.fn().mockResolvedValue(mockProjects[0]),
    update: jest.fn().mockResolvedValue(mockProjects[0]),
    delete: jest.fn().mockResolvedValue(mockProjects[0]),
    deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
    upsert: jest.fn().mockResolvedValue(mockProjects[0]),
    count: jest.fn().mockResolvedValue(mockProjects.length)
  },
  user: {
    findMany: jest.fn().mockResolvedValue(mockUsers),
    findFirst: jest.fn().mockResolvedValue(mockUsers[0]),
    findUnique: jest.fn().mockResolvedValue(mockUsers[0]),
    create: jest.fn().mockResolvedValue(mockUsers[0]),
    update: jest.fn().mockResolvedValue(mockUsers[0]),
    delete: jest.fn().mockResolvedValue(mockUsers[0]),
    deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
    upsert: jest.fn().mockResolvedValue(mockUsers[0]),
    count: jest.fn().mockResolvedValue(mockUsers.length)
  },
  $transaction: jest.fn().mockImplementation((operations) => {
    if (Array.isArray(operations)) {
      return Promise.all(operations);
    } else if (typeof operations === 'function') {
      return operations(prismaMock);
    }
    return Promise.resolve([]);
  })
};

module.exports = {
  dbMock,
  schemaMock,
  prismaMock,
  mockProjects,
  mockTasks,
  mockUsers,
  mockTimeLogs
};
