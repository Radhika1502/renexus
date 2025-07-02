/**
 * Test Coverage Helper - Phase 5 Integration Test Fixes
 * 
 * This module provides enhanced mock implementations for services
 * to ensure adequate code coverage in integration tests.
 */

/**
 * Creates an enhanced project service mock implementation
 * with comprehensive code path coverage
 */
function createProjectServiceMock(jest) {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Comprehensive mock for ProjectService
  const projectServiceMock = {
    createProject: jest.fn().mockImplementation((data) => {
      if (!data.name) {
        throw new Error('Project name is required');
      }
      return Promise.resolve({
        id: 'project-new',
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }),
    
    getAllProjects: jest.fn().mockImplementation((query) => {
      const { page = 1, limit = 10, sortBy, sortOrder, status, search } = query || {};
      
      // Test different code paths with conditionals
      let projects = [
        { id: 'project-1', name: 'Project 1', status: 'active' },
        { id: 'project-2', name: 'Project 2', status: 'archived' }
      ];
      
      // Apply filtering
      if (status) {
        projects = projects.filter(p => p.status === status);
      }
      
      // Apply search
      if (search) {
        projects = projects.filter(p => p.name.includes(search));
      }
      
      // Apply sorting
      if (sortBy) {
        projects.sort((a, b) => {
          if (sortOrder === 'desc') {
            return a[sortBy] < b[sortBy] ? 1 : -1;
          }
          return a[sortBy] > b[sortBy] ? 1 : -1;
        });
      }
      
      return Promise.resolve({
        data: projects,
        total: projects.length,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(projects.length / parseInt(limit, 10))
      });
    }),
    
    getProjectById: jest.fn().mockImplementation((id) => {
      if (id === 'not-found') {
        return Promise.resolve(null);
      }
      
      if (id === 'error') {
        return Promise.reject(new Error('Database error'));
      }
      
      return Promise.resolve({
        id,
        name: `Project ${id}`,
        description: 'Project description',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }),
    
    updateProject: jest.fn().mockImplementation((id, data) => {
      if (id === 'not-found') {
        return Promise.resolve(null);
      }
      
      if (id === 'error') {
        return Promise.reject(new Error('Database error'));
      }
      
      return Promise.resolve({
        id,
        ...data,
        updatedAt: new Date().toISOString()
      });
    }),
    
    deleteProject: jest.fn().mockImplementation((id) => {
      if (id === 'not-found') {
        return Promise.resolve(false);
      }
      
      if (id === 'error') {
        return Promise.reject(new Error('Database error'));
      }
      
      return Promise.resolve(true);
    }),
    
    getProjectStats: jest.fn().mockImplementation((id) => {
      if (id === 'not-found') {
        return Promise.resolve(null);
      }
      
      if (id === 'error') {
        return Promise.reject(new Error('Database error'));
      }
      
      return Promise.resolve({
        tasksCount: 10,
        completedTasksCount: 5,
        pendingTasksCount: 5,
        teamMembersCount: 3
      });
    })
  };
  
  return projectServiceMock;
}

/**
 * Creates an enhanced task service mock implementation
 * with comprehensive code path coverage
 */
function createTaskServiceMock(jest) {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Comprehensive mock for TaskService
  const taskServiceMock = {
    createTask: jest.fn().mockImplementation((data) => {
      if (!data.title) {
        throw new Error('Task title is required');
      }
      
      if (!data.projectId) {
        throw new Error('Project ID is required');
      }
      
      return Promise.resolve({
        id: 'task-new',
        ...data,
        status: data.status || 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }),
    
    getAllTasks: jest.fn().mockImplementation((query) => {
      const { page = 1, limit = 10, projectId, status, assigneeId, priority, search } = query || {};
      
      // Test different code paths with conditionals
      let tasks = [
        { 
          id: 'task-1', 
          title: 'Task 1', 
          status: 'pending', 
          projectId: 'project-1',
          assigneeId: 'user-1',
          priority: 'high' 
        },
        { 
          id: 'task-2', 
          title: 'Task 2', 
          status: 'completed', 
          projectId: 'project-1',
          assigneeId: 'user-2',
          priority: 'medium' 
        },
        { 
          id: 'task-3', 
          title: 'Task 3', 
          status: 'pending', 
          projectId: 'project-2',
          assigneeId: 'user-1',
          priority: 'low' 
        }
      ];
      
      // Apply filters
      if (projectId) {
        tasks = tasks.filter(t => t.projectId === projectId);
      }
      
      if (status) {
        tasks = tasks.filter(t => t.status === status);
      }
      
      if (assigneeId) {
        tasks = tasks.filter(t => t.assigneeId === assigneeId);
      }
      
      if (priority) {
        tasks = tasks.filter(t => t.priority === priority);
      }
      
      if (search) {
        tasks = tasks.filter(t => t.title.includes(search));
      }
      
      return Promise.resolve({
        data: tasks,
        total: tasks.length,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(tasks.length / parseInt(limit, 10))
      });
    }),
    
    getTaskById: jest.fn().mockImplementation((id) => {
      if (id === 'not-found') {
        return Promise.resolve(null);
      }
      
      if (id === 'error') {
        return Promise.reject(new Error('Database error'));
      }
      
      return Promise.resolve({
        id,
        title: `Task ${id}`,
        description: 'Task description',
        status: 'pending',
        projectId: 'project-1',
        assigneeId: 'user-1',
        priority: 'medium',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }),
    
    updateTask: jest.fn().mockImplementation((id, data) => {
      if (id === 'not-found') {
        return Promise.resolve(null);
      }
      
      if (id === 'error') {
        return Promise.reject(new Error('Database error'));
      }
      
      return Promise.resolve({
        id,
        ...data,
        updatedAt: new Date().toISOString()
      });
    }),
    
    deleteTask: jest.fn().mockImplementation((id) => {
      if (id === 'not-found') {
        return Promise.resolve(false);
      }
      
      if (id === 'error') {
        return Promise.reject(new Error('Database error'));
      }
      
      return Promise.resolve(true);
    }),
    
    getTaskAnalytics: jest.fn().mockImplementation((filters) => {
      const { projectId, startDate, endDate, groupBy } = filters || {};
      
      // Different analytics based on groupBy
      let analytics = [];
      
      if (groupBy === 'status') {
        analytics = [
          { status: 'pending', count: 5 },
          { status: 'in-progress', count: 3 },
          { status: 'completed', count: 7 }
        ];
      } else if (groupBy === 'priority') {
        analytics = [
          { priority: 'high', count: 4 },
          { priority: 'medium', count: 6 },
          { priority: 'low', count: 5 }
        ];
      } else if (groupBy === 'assignee') {
        analytics = [
          { assigneeId: 'user-1', count: 7 },
          { assigneeId: 'user-2', count: 8 }
        ];
      } else {
        analytics = [
          { date: '2025-06-25', count: 3 },
          { date: '2025-06-26', count: 5 },
          { date: '2025-06-27', count: 7 }
        ];
      }
      
      // Apply project filter
      if (projectId) {
        // Simulate filtered data
        analytics = analytics.map(item => ({ ...item, count: Math.floor(item.count / 2) }));
      }
      
      // Apply date filters
      if (startDate || endDate) {
        // Simulate date filtering
        analytics = analytics.slice(0, 2);
      }
      
      return Promise.resolve(analytics);
    }),
    
    getTaskTrends: jest.fn().mockImplementation((period) => {
      let trends = [];
      
      if (period === 'day') {
        trends = [
          { hour: '00:00', created: 1, completed: 0 },
          { hour: '06:00', created: 2, completed: 1 },
          { hour: '12:00', created: 5, completed: 3 },
          { hour: '18:00', created: 3, completed: 4 }
        ];
      } else if (period === 'week') {
        trends = [
          { day: 'Monday', created: 5, completed: 3 },
          { day: 'Tuesday', created: 7, completed: 4 },
          { day: 'Wednesday', created: 3, completed: 6 },
          { day: 'Thursday', created: 4, completed: 5 },
          { day: 'Friday', created: 6, completed: 8 }
        ];
      } else {
        trends = [
          { date: '2025-06-01', created: 15, completed: 10 },
          { date: '2025-06-08', created: 20, completed: 18 },
          { date: '2025-06-15', created: 12, completed: 15 },
          { date: '2025-06-22', created: 18, completed: 17 }
        ];
      }
      
      return Promise.resolve(trends);
    })
  };
  
  return taskServiceMock;
}

module.exports = {
  createProjectServiceMock,
  createTaskServiceMock
};
