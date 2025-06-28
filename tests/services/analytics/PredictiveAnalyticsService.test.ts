import PredictiveAnalyticsService from '../../../services/analytics/PredictiveAnalyticsService';
import { Task } from '../../../types/task';

describe('PredictiveAnalyticsService', () => {
  let predictiveAnalyticsService: PredictiveAnalyticsService;
  
  // Sample tasks for testing
  const sampleTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Task 1',
      status: 'done',
      priority: 'high',
      createdAt: '2023-01-01T00:00:00Z',
      completedAt: '2023-01-05T00:00:00Z',
      estimatedHours: 10,
      actualHours: 8,
      description: 'Implement login functionality'
    },
    {
      id: 'task-2',
      title: 'Task 2',
      status: 'done',
      priority: 'medium',
      createdAt: '2023-01-02T00:00:00Z',
      completedAt: '2023-01-07T00:00:00Z',
      estimatedHours: 5,
      actualHours: 6,
      description: 'Create user profile page'
    },
    {
      id: 'task-3',
      title: 'Task 3',
      status: 'done',
      priority: 'low',
      createdAt: '2023-01-03T00:00:00Z',
      completedAt: '2023-01-06T00:00:00Z',
      estimatedHours: 3,
      actualHours: 2,
      description: 'Fix navigation menu bug'
    },
    {
      id: 'task-4',
      title: 'Task 4',
      status: 'in_progress',
      priority: 'high',
      createdAt: '2023-01-04T00:00:00Z',
      estimatedHours: 6,
      description: 'Implement dashboard analytics'
    },
    {
      id: 'task-5',
      title: 'Task 5',
      status: 'todo',
      priority: 'medium',
      createdAt: '2023-01-05T00:00:00Z',
      estimatedHours: 4,
      description: 'Add export functionality'
    }
  ];
  
  // Sample time series data for testing
  const sampleTimeSeries = [
    { date: '2023-01-01', value: 5 },
    { date: '2023-01-02', value: 7 },
    { date: '2023-01-03', value: 10 },
    { date: '2023-01-04', value: 12 },
    { date: '2023-01-05', value: 15 }
  ];
  
  beforeEach(() => {
    // Get a fresh instance before each test
    predictiveAnalyticsService = PredictiveAnalyticsService.getInstance();
  });
  
  test('getInstance returns a singleton instance', () => {
    const instance1 = PredictiveAnalyticsService.getInstance();
    const instance2 = PredictiveAnalyticsService.getInstance();
    expect(instance1).toBe(instance2);
  });
  
  test('forecastTaskCompletionTrend returns correct forecast', () => {
    // Mock date for consistent testing
    const mockDate = new Date('2023-01-15T00:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);
    
    const forecast = predictiveAnalyticsService.forecastTaskCompletionTrend(sampleTasks, 7);
    
    // Should return 7 data points for the forecast
    expect(forecast).toHaveLength(7);
    
    // Each forecast point should have a date and a value
    forecast.forEach(point => {
      expect(point).toHaveProperty('date');
      expect(point).toHaveProperty('value');
      expect(typeof point.date).toBe('string');
      expect(typeof point.value).toBe('number');
    });
    
    // Restore Date
    jest.restoreAllMocks();
  });
  
  test('detectAnomalies identifies outliers in time series data', () => {
    // Create time series with anomalies
    const timeSeriesWithAnomalies = [
      { date: '2023-01-01', value: 5 },
      { date: '2023-01-02', value: 7 },
      { date: '2023-01-03', value: 50 }, // Anomaly
      { date: '2023-01-04', value: 12 },
      { date: '2023-01-05', value: 15 },
      { date: '2023-01-06', value: -20 }, // Anomaly
      { date: '2023-01-07', value: 18 }
    ];
    
    const anomalies = predictiveAnalyticsService.detectAnomalies(timeSeriesWithAnomalies);
    
    // Should detect 2 anomalies
    expect(anomalies).toHaveLength(2);
    
    // Check that the correct anomalies were detected
    expect(anomalies).toContainEqual(expect.objectContaining({
      date: '2023-01-03',
      value: 50
    }));
    
    expect(anomalies).toContainEqual(expect.objectContaining({
      date: '2023-01-06',
      value: -20
    }));
  });
  
  test('predictTaskCompletionTime estimates completion time for a new task', () => {
    const newTask: Task = {
      id: 'new-task',
      title: 'New Task',
      status: 'todo',
      priority: 'medium',
      description: 'Implement login functionality with OAuth',
      estimatedHours: 8
    };
    
    const estimatedTime = predictiveAnalyticsService.predictTaskCompletionTime(newTask, sampleTasks);
    
    // Should return a number
    expect(typeof estimatedTime).toBe('number');
    
    // Estimated time should be positive
    expect(estimatedTime).toBeGreaterThan(0);
  });
  
  test('calculateLinearRegression returns correct coefficients', () => {
    // Simple dataset where y = 2x + 1
    const x = [1, 2, 3, 4, 5];
    const y = [3, 5, 7, 9, 11];
    
    const { slope, intercept } = predictiveAnalyticsService.calculateLinearRegression(x, y);
    
    // Should be close to slope = 2, intercept = 1
    expect(slope).toBeCloseTo(2, 1);
    expect(intercept).toBeCloseTo(1, 1);
  });
  
  test('calculateStandardDeviation returns correct value', () => {
    // Dataset with known standard deviation
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    // Standard deviation is 2
    
    const stdDev = predictiveAnalyticsService.calculateStandardDeviation(values);
    
    expect(stdDev).toBeCloseTo(2, 1);
  });
  
  test('calculateVariance returns correct value', () => {
    // Dataset with known variance
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    // Variance is 4
    
    const variance = predictiveAnalyticsService.calculateVariance(values);
    
    expect(variance).toBeCloseTo(4, 1);
  });
  
  test('calculateTaskSimilarity returns higher score for similar tasks', () => {
    const task1: Task = {
      id: 'task-1',
      title: 'Implement login functionality',
      description: 'Create login form with email and password fields',
      priority: 'high'
    };
    
    const task2: Task = {
      id: 'task-2',
      title: 'Implement signup functionality',
      description: 'Create signup form with email, password, and confirmation fields',
      priority: 'high'
    };
    
    const task3: Task = {
      id: 'task-3',
      title: 'Fix database connection issue',
      description: 'Investigate and resolve the database timeout errors',
      priority: 'medium'
    };
    
    const similarity12 = predictiveAnalyticsService.calculateTaskSimilarity(task1, task2);
    const similarity13 = predictiveAnalyticsService.calculateTaskSimilarity(task1, task3);
    
    // Task 1 and 2 should be more similar than Task 1 and 3
    expect(similarity12).toBeGreaterThan(similarity13);
  });
});
