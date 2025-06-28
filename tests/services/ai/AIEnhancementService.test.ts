import AIEnhancementService from '../../../services/ai/AIEnhancementService';
import { Task } from '../../../types/task';

describe('AIEnhancementService', () => {
  let aiService: AIEnhancementService;
  
  // Sample tasks for testing
  const sampleTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Implement login functionality',
      status: 'done',
      priority: 'high',
      description: 'Create login form with email and password validation',
      estimatedHours: 8,
      actualHours: 10,
      createdAt: '2023-01-01T00:00:00Z',
      completedAt: '2023-01-05T00:00:00Z'
    },
    {
      id: 'task-2',
      title: 'Design user dashboard',
      status: 'in_progress',
      priority: 'medium',
      description: 'Create wireframes for the user dashboard with analytics widgets',
      estimatedHours: 6,
      actualHours: 3,
      createdAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-10T00:00:00Z'
    },
    {
      id: 'task-3',
      title: 'Fix navigation bug',
      status: 'done',
      priority: 'low',
      description: 'Fix the navigation menu that disappears on mobile devices',
      estimatedHours: 2,
      actualHours: 1,
      createdAt: '2023-01-03T00:00:00Z',
      completedAt: '2023-01-04T00:00:00Z'
    },
    {
      id: 'task-4',
      title: 'Write API documentation',
      status: 'todo',
      priority: 'medium',
      description: 'Document all API endpoints and parameters for the developer guide',
      estimatedHours: 4,
      createdAt: '2023-01-04T00:00:00Z'
    },
    {
      id: 'task-5',
      title: 'Implement user profile page',
      status: 'blocked',
      priority: 'high',
      description: 'Create user profile page that depends on login functionality',
      estimatedHours: 5,
      createdAt: '2023-01-05T00:00:00Z',
      updatedAt: '2023-01-06T00:00:00Z',
      dueDate: '2023-01-15T00:00:00Z'
    }
  ];
  
  beforeEach(() => {
    // Get a fresh instance before each test
    aiService = AIEnhancementService.getInstance();
  });
  
  test('getInstance returns a singleton instance', () => {
    const instance1 = AIEnhancementService.getInstance();
    const instance2 = AIEnhancementService.getInstance();
    expect(instance1).toBe(instance2);
  });
  
  test('extractKeywords returns relevant keywords from text', () => {
    const text = 'Create login form with email and password validation for user authentication';
    const keywords = aiService.extractKeywords(text);
    
    // Should return an array of keywords
    expect(Array.isArray(keywords)).toBe(true);
    
    // Should extract relevant keywords
    expect(keywords).toContain('login');
    expect(keywords).toContain('form');
    expect(keywords).toContain('email');
    expect(keywords).toContain('password');
    expect(keywords).toContain('validation');
    
    // Should not contain stop words
    expect(keywords).not.toContain('with');
    expect(keywords).not.toContain('and');
    expect(keywords).not.toContain('for');
  });
  
  test('suggestCategory returns appropriate category based on description', () => {
    // Development task
    const devDescription = 'Implement login functionality with form validation and API integration';
    const devCategory = aiService.suggestCategory(devDescription);
    expect(devCategory).toBe('Development');
    
    // Design task
    const designDescription = 'Create wireframes and UI mockups for the dashboard layout';
    const designCategory = aiService.suggestCategory(designDescription);
    expect(designCategory).toBe('Design');
    
    // Documentation task
    const docDescription = 'Write user guide and API documentation for developers';
    const docCategory = aiService.suggestCategory(docDescription);
    expect(docCategory).toBe('Documentation');
    
    // Meeting task
    const meetingDescription = 'Schedule team sync meeting to discuss project progress';
    const meetingCategory = aiService.suggestCategory(meetingDescription);
    expect(meetingCategory).toBe('Meeting');
  });
  
  test('estimateTaskTime returns reasonable estimate based on description', () => {
    // Short task description
    const shortDesc = 'Fix button styling';
    const shortEstimate = aiService.estimateTaskTime(shortDesc, []);
    expect(shortEstimate).toBe(1);
    
    // Medium task description
    const mediumDesc = 'Implement form validation for the login page with error messages and field highlighting';
    const mediumEstimate = aiService.estimateTaskTime(mediumDesc, []);
    expect(mediumEstimate).toBe(4);
    
    // Long task description
    const longDesc = 'Create a comprehensive dashboard with multiple widgets displaying various analytics metrics including task completion rates, resource utilization, and project progress. Implement filtering and date range selection. Ensure responsive design for all screen sizes.';
    const longEstimate = aiService.estimateTaskTime(longDesc, []);
    expect(longEstimate).toBe(8);
    
    // With similar tasks
    const desc = 'Implement login functionality';
    const similarTasks = [
      {
        id: 'similar-1',
        title: 'Implement signup form',
        status: 'done',
        actualHours: 6
      },
      {
        id: 'similar-2',
        title: 'Implement password reset',
        status: 'done',
        actualHours: 4
      }
    ];
    
    const estimateWithHistory = aiService.estimateTaskTime(desc, similarTasks);
    expect(estimateWithHistory).toBeGreaterThan(0);
  });
  
  test('detectDependencies identifies potential dependencies between tasks', () => {
    // Task with dependency in description
    const taskWithDep: Task = {
      id: 'task-new',
      title: 'Implement profile settings',
      description: 'Create profile settings page that depends on the login functionality from task-1',
      status: 'todo'
    };
    
    const dependencies = aiService.detectDependencies(taskWithDep, sampleTasks);
    
    // Should identify task-1 as a dependency
    expect(dependencies).toHaveLength(1);
    expect(dependencies[0].id).toBe('task-1');
    
    // Task without dependencies
    const taskWithoutDep: Task = {
      id: 'task-independent',
      title: 'Update logo',
      description: 'Replace the old logo with the new company logo',
      status: 'todo'
    };
    
    const noDependencies = aiService.detectDependencies(taskWithoutDep, sampleTasks);
    expect(noDependencies).toHaveLength(0);
  });
  
  test('optimizeWorkload distributes tasks based on priority and workload', () => {
    // Users with different capacities
    const users = [
      { id: 'user-1', capacity: 20 },
      { id: 'user-2', capacity: 15 },
      { id: 'user-3', capacity: 10 }
    ];
    
    // Unassigned tasks
    const unassignedTasks = sampleTasks.map(task => ({ ...task, assigneeId: undefined }));
    
    const workloadDistribution = aiService.optimizeWorkload(unassignedTasks, users);
    
    // Should return a Map with user assignments
    expect(workloadDistribution).toBeInstanceOf(Map);
    
    // All users should have tasks assigned
    expect(workloadDistribution.has('user-1')).toBe(true);
    expect(workloadDistribution.has('user-2')).toBe(true);
    expect(workloadDistribution.has('user-3')).toBe(true);
    
    // High priority tasks should be assigned first
    const user1Tasks = workloadDistribution.get('user-1') || [];
    const highPriorityAssigned = user1Tasks.some(task => task.priority === 'high');
    expect(highPriorityAssigned).toBe(true);
  });
  
  test('detectAnomalies identifies unusual task patterns', () => {
    // Create tasks with anomalies
    const tasksWithAnomalies: Task[] = [
      ...sampleTasks,
      {
        id: 'anomaly-1',
        title: 'Simple task',
        status: 'done',
        priority: 'low',
        description: 'A very simple task',
        estimatedHours: 1,
        actualHours: 10, // Significantly underestimated
        createdAt: '2023-01-10T00:00:00Z',
        completedAt: '2023-01-12T00:00:00Z'
      },
      {
        id: 'anomaly-2',
        title: 'Stalled task',
        status: 'in_progress',
        priority: 'high',
        description: 'Task with no progress',
        estimatedHours: 4,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z', // No updates for a long time
        dueDate: '2023-01-20T00:00:00Z'
      }
    ];
    
    // Mock current date
    const mockDate = new Date('2023-01-20T00:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);
    
    const anomalies = aiService.detectAnomalies(tasksWithAnomalies);
    
    // Should detect the anomalies
    expect(anomalies.length).toBeGreaterThan(0);
    
    // Should include the significantly underestimated task
    const hasUnderestimatedAnomaly = anomalies.some(
      a => a.task.id === 'anomaly-1' && a.reason.includes('underestimated')
    );
    expect(hasUnderestimatedAnomaly).toBe(true);
    
    // Should include the stalled task
    const hasStalledAnomaly = anomalies.some(
      a => a.task.id === 'anomaly-2' && a.reason.includes('No progress')
    );
    expect(hasStalledAnomaly).toBe(true);
    
    // Restore Date
    jest.restoreAllMocks();
  });
});
