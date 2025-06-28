import TaskDependencyManager from '../../../services/tasks/TaskDependencyManager';
import { Task, TaskDependency, TaskStatus, TaskPriority, DependencyType } from '../../../types/task';

describe('TaskDependencyManager', () => {
  let taskDependencyManager: TaskDependencyManager;
  
  // Sample tasks for testing
  const sampleTasks: Task[] = [
    { 
      id: 'task-1', 
      title: 'Task 1', 
      status: 'todo' as TaskStatus, 
      priority: 'medium' as TaskPriority, 
      projectId: 'project-1', 
      createdBy: 'user-1', 
      createdAt: '2023-01-01', 
      startDate: '2023-01-05', 
      dueDate: '2023-01-10',
      estimatedHours: 4 
    },
    { 
      id: 'task-2', 
      title: 'Task 2', 
      status: 'todo' as TaskStatus, 
      priority: 'medium' as TaskPriority, 
      projectId: 'project-1', 
      createdBy: 'user-1', 
      createdAt: '2023-01-01', 
      startDate: '2023-01-06', 
      dueDate: '2023-01-12',
      estimatedHours: 2 
    },
    { 
      id: 'task-3', 
      title: 'Task 3', 
      status: 'todo' as TaskStatus, 
      priority: 'medium' as TaskPriority, 
      projectId: 'project-1', 
      createdBy: 'user-1', 
      createdAt: '2023-01-01', 
      startDate: '2023-01-07', 
      dueDate: '2023-01-15',
      estimatedHours: 3 
    },
    { 
      id: 'task-4', 
      title: 'Task 4', 
      status: 'todo' as TaskStatus, 
      priority: 'medium' as TaskPriority, 
      projectId: 'project-1', 
      createdBy: 'user-1', 
      createdAt: '2023-01-01', 
      startDate: '2023-01-08', 
      dueDate: '2023-01-09',
      estimatedHours: 1 
    },
    { 
      id: 'task-5', 
      title: 'Task 5', 
      status: 'todo' as TaskStatus, 
      priority: 'medium' as TaskPriority, 
      projectId: 'project-1', 
      createdBy: 'user-1', 
      createdAt: '2023-01-01', 
      startDate: '2023-01-09', 
      dueDate: '2023-01-20',
      estimatedHours: 5 
    }
  ];
  
  // Sample dependencies for testing
  const sampleDependencies: TaskDependency[] = [
    { id: 'dep-1', fromTaskId: 'task-1', toTaskId: 'task-2', type: 'finish-to-start' as DependencyType },
    { id: 'dep-2', fromTaskId: 'task-2', toTaskId: 'task-3', type: 'finish-to-start' as DependencyType },
    { id: 'dep-3', fromTaskId: 'task-3', toTaskId: 'task-5', type: 'finish-to-start' as DependencyType },
    { id: 'dep-4', fromTaskId: 'task-1', toTaskId: 'task-4', type: 'finish-to-start' as DependencyType }
  ];
  
  beforeEach(() => {
    // Get a fresh instance before each test
    taskDependencyManager = TaskDependencyManager.getInstance();
  });

  test('getInstance returns a singleton instance', () => {
    const instance1 = TaskDependencyManager.getInstance();
    const instance2 = TaskDependencyManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  test('createDependency creates valid dependency objects', () => {
    const fromTask = sampleTasks[0];
    const toTask = sampleTasks[1];
    const dependency = taskDependencyManager.createDependency(fromTask, toTask, 'finish-to-start');
    
    expect(dependency).toBeDefined();
    expect(dependency.id).toContain('dep-');
    expect(dependency.fromTaskId).toBe(fromTask.id);
    expect(dependency.toTaskId).toBe(toTask.id);
    expect(dependency.type).toBe('finish-to-start');
  });

  test('validateDependency validates dependency correctly', () => {
    // Testing a valid dependency
    const result1 = taskDependencyManager.validateDependency(
      sampleTasks, 
      [], // No existing dependencies
      'task-1', 
      'task-2'
    );
    
    expect(result1.valid).toBe(true);
    
    // Testing duplicate dependency
    const result2 = taskDependencyManager.validateDependency(
      sampleTasks, 
      sampleDependencies, // With existing dependencies
      'task-1', 
      'task-2'
    );
    
    expect(result2.valid).toBe(false);
    expect(result2.message).toBe('Dependency already exists');
  });

  test('validateDependency detects circular dependencies', () => {
    // This would create a circular dependency: task-5 -> task-1 would form a circle
    const result = taskDependencyManager.validateDependency(
      sampleTasks, 
      sampleDependencies,
      'task-5', 
      'task-1'
    );
    
    expect(result.valid).toBe(false);
    expect(result.message).toBe('This would create a circular dependency');
  });

  test('calculateCriticalPath identifies critical path correctly', () => {
    const result = taskDependencyManager.calculateCriticalPath(sampleTasks, sampleDependencies);
    
    expect(result).toBeDefined();
    expect(result.criticalPathDuration).toBeGreaterThan(0);
    expect(result.criticalTasks.length).toBeGreaterThan(0);
  });

  test('generateDependencyGraph creates visualization data', () => {
    const graph = taskDependencyManager.generateDependencyGraph(sampleTasks, sampleDependencies);
    
    expect(graph).toBeDefined();
    expect(graph.nodes.length).toBe(sampleTasks.length);
    expect(graph.edges.length).toBe(sampleDependencies.length);
  });

  test('suggestOptimizedSequence returns sorted tasks', () => {
    const optimizedSequence = taskDependencyManager.suggestOptimizedSequence(sampleTasks, sampleDependencies);
    
    expect(optimizedSequence).toBeDefined();
    expect(optimizedSequence.length).toBe(sampleTasks.length);
    // First task should be a critical task
    const criticalPathResult = taskDependencyManager.calculateCriticalPath(sampleTasks, sampleDependencies);
    const firstTaskIsCritical = criticalPathResult.criticalTasks.some(
      criticalTask => criticalTask.task.id === optimizedSequence[0].id
    );
    expect(firstTaskIsCritical).toBe(true);
  });
});
