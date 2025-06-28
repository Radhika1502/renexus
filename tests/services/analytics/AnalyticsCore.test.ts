import AnalyticsCore from '../../../services/analytics/AnalyticsCore';
import { Task } from '../../../types/task';
import { AnalyticsFilter } from '../../../types/analytics';

describe('AnalyticsCore', () => {
  // Sample tasks for testing
  const sampleTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Task 1',
      status: 'done',
      priority: 'high',
      createdAt: '2023-01-01T00:00:00Z',
      completedAt: '2023-01-05T00:00:00Z',
      dueDate: '2023-01-10T00:00:00Z',
      estimatedHours: 10,
      actualHours: 8
    },
    {
      id: 'task-2',
      title: 'Task 2',
      status: 'in_progress',
      priority: 'medium',
      createdAt: '2023-01-02T00:00:00Z',
      dueDate: '2023-01-15T00:00:00Z',
      estimatedHours: 5,
      actualHours: 3
    },
    {
      id: 'task-3',
      title: 'Task 3',
      status: 'todo',
      priority: 'low',
      createdAt: '2023-01-03T00:00:00Z',
      dueDate: '2023-01-20T00:00:00Z',
      estimatedHours: 3
    },
    {
      id: 'task-4',
      title: 'Task 4',
      status: 'done',
      priority: 'high',
      createdAt: '2023-01-04T00:00:00Z',
      completedAt: '2023-01-08T00:00:00Z',
      dueDate: '2023-01-07T00:00:00Z',
      estimatedHours: 6,
      actualHours: 7
    },
    {
      id: 'task-5',
      title: 'Task 5',
      status: 'blocked',
      priority: 'medium',
      createdAt: '2023-01-05T00:00:00Z',
      dueDate: '2023-01-12T00:00:00Z',
      estimatedHours: 4
    }
  ];

  test('filterTasks returns tasks matching filter criteria', () => {
    // Filter for high priority tasks
    const filter: AnalyticsFilter = {
      priority: ['high']
    };
    
    const filteredTasks = AnalyticsCore.filterTasks(sampleTasks, filter);
    
    expect(filteredTasks).toHaveLength(2);
    expect(filteredTasks.every(task => task.priority === 'high')).toBe(true);
    
    // Filter for done tasks
    const statusFilter: AnalyticsFilter = {
      status: ['done']
    };
    
    const statusFilteredTasks = AnalyticsCore.filterTasks(sampleTasks, statusFilter);
    
    expect(statusFilteredTasks).toHaveLength(2);
    expect(statusFilteredTasks.every(task => task.status === 'done')).toBe(true);
    
    // Filter with multiple criteria
    const complexFilter: AnalyticsFilter = {
      status: ['done'],
      priority: ['high']
    };
    
    const complexFilteredTasks = AnalyticsCore.filterTasks(sampleTasks, complexFilter);
    
    expect(complexFilteredTasks).toHaveLength(2);
    expect(complexFilteredTasks.every(task => 
      task.status === 'done' && task.priority === 'high'
    )).toBe(true);
  });

  test('calculateStatusBreakdown returns correct distribution', () => {
    const breakdown = AnalyticsCore.calculateStatusBreakdown(sampleTasks);
    
    expect(breakdown).toHaveLength(4); // done, in_progress, todo, blocked
    
    // Check specific categories
    const doneCategory = breakdown.find(item => item.category === 'done');
    expect(doneCategory).toBeDefined();
    expect(doneCategory?.count).toBe(2);
    expect(doneCategory?.percentage).toBe(40); // 2/5 * 100
    
    const inProgressCategory = breakdown.find(item => item.category === 'in_progress');
    expect(inProgressCategory).toBeDefined();
    expect(inProgressCategory?.count).toBe(1);
    expect(inProgressCategory?.percentage).toBe(20); // 1/5 * 100
  });

  test('calculatePriorityBreakdown returns correct distribution', () => {
    const breakdown = AnalyticsCore.calculatePriorityBreakdown(sampleTasks);
    
    expect(breakdown).toHaveLength(3); // high, medium, low
    
    // Check specific categories
    const highCategory = breakdown.find(item => item.category === 'high');
    expect(highCategory).toBeDefined();
    expect(highCategory?.count).toBe(2);
    expect(highCategory?.percentage).toBe(40); // 2/5 * 100
    
    const mediumCategory = breakdown.find(item => item.category === 'medium');
    expect(mediumCategory).toBeDefined();
    expect(mediumCategory?.count).toBe(2);
    expect(mediumCategory?.percentage).toBe(40); // 2/5 * 100
    
    const lowCategory = breakdown.find(item => item.category === 'low');
    expect(lowCategory).toBeDefined();
    expect(lowCategory?.count).toBe(1);
    expect(lowCategory?.percentage).toBe(20); // 1/5 * 100
  });

  test('calculateTaskCompletionTrend returns correct trend data', () => {
    // Mock date for consistent testing
    const mockDate = new Date('2023-01-15T00:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);
    
    const startDate = '2023-01-01';
    const endDate = '2023-01-10';
    
    const trend = AnalyticsCore.calculateTaskCompletionTrend(sampleTasks, startDate, endDate);
    
    // Should have 10 data points (one for each day)
    expect(trend).toHaveLength(10);
    
    // Check specific data points
    // Jan 5: Task 1 completed
    const jan5Data = trend.find(point => point.date === '2023-01-05');
    expect(jan5Data).toBeDefined();
    expect(jan5Data?.completed).toBe(1);
    
    // Jan 8: Task 4 completed
    const jan8Data = trend.find(point => point.date === '2023-01-08');
    expect(jan8Data).toBeDefined();
    expect(jan8Data?.completed).toBe(1);
    
    // Restore Date
    jest.restoreAllMocks();
  });

  test('calculateAverageCompletionTime returns correct average', () => {
    const avgTime = AnalyticsCore.calculateAverageCompletionTime(sampleTasks);
    
    // Task 1: 4 days (Jan 1 to Jan 5)
    // Task 4: 4 days (Jan 4 to Jan 8)
    // Average: 4 days
    expect(avgTime).toBe(4);
  });

  test('calculateOverduePercentage returns correct percentage', () => {
    // Mock current date to be after all due dates
    const mockDate = new Date('2023-01-21T00:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);
    
    const overduePercentage = AnalyticsCore.calculateOverduePercentage(sampleTasks);
    
    // Task 4 was completed after its due date (Jan 8 vs Jan 7)
    // Tasks 2, 3, 5 are not done and past due date
    // Total overdue: 4 out of 5 tasks = 80%
    expect(overduePercentage).toBe(80);
    
    // Restore Date
    jest.restoreAllMocks();
  });

  test('calculateCompletionRate returns correct rate', () => {
    const completionRate = AnalyticsCore.calculateCompletionRate(sampleTasks);
    
    // 2 completed tasks out of 5 = 40%
    expect(completionRate).toBe(40);
  });

  test('predictProjectCompletionDate returns estimated completion date', () => {
    // Mock current date
    const mockDate = new Date('2023-01-15T00:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);
    
    // Add more sample tasks with completion dates
    const tasksWithHistory: Task[] = [
      ...sampleTasks,
      {
        id: 'task-6',
        title: 'Task 6',
        status: 'done',
        createdAt: '2022-12-20T00:00:00Z',
        completedAt: '2022-12-25T00:00:00Z'
      },
      {
        id: 'task-7',
        title: 'Task 7',
        status: 'done',
        createdAt: '2022-12-22T00:00:00Z',
        completedAt: '2022-12-28T00:00:00Z'
      }
    ];
    
    const completionDate = AnalyticsCore.predictProjectCompletionDate(tasksWithHistory);
    
    // Ensure we get a date
    expect(completionDate).toBeInstanceOf(Date);
    
    // Restore Date
    jest.restoreAllMocks();
  });
});
