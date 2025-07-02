import { Task, TaskDependency, CriticalPathTask, CriticalPathAnalysis, TaskDependencyGraph  } from "../../../shared/types/task";

/**
 * TaskDependencyManager
 * 
 * Service for managing task dependencies and performing critical path analysis
 */
class TaskDependencyManager {
  private static instance: TaskDependencyManager;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): TaskDependencyManager {
    if (!TaskDependencyManager.instance) {
      TaskDependencyManager.instance = new TaskDependencyManager();
    }
    return TaskDependencyManager.instance;
  }

  /**
   * Create a new task dependency
   */
  public createDependency(fromTask: Task, toTask: Task, type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish'): TaskDependency {
    return {
      id: `dep-${fromTask.id}-${toTask.id}-${Date.now()}`,
      fromTaskId: fromTask.id,
      toTaskId: toTask.id,
      type
    };
  }

  /**
   * Validate if a dependency can be created
   * Checks for circular dependencies and other constraints
   */
  public validateDependency(tasks: Task[], dependencies: TaskDependency[], fromTaskId: string, toTaskId: string): { valid: boolean; message?: string } {
    // Check if dependency already exists
    const existingDependency = dependencies.find(
      dep => dep.fromTaskId === fromTaskId && dep.toTaskId === toTaskId
    );

    if (existingDependency) {
      return { valid: false, message: 'Dependency already exists' };
    }

    // Check for circular dependency
    if (this.wouldCreateCircularDependency(dependencies, fromTaskId, toTaskId)) {
      return { valid: false, message: 'This would create a circular dependency' };
    }

    return { valid: true };
  }

  /**
   * Check if adding a dependency would create a circular reference
   */
  private wouldCreateCircularDependency(dependencies: TaskDependency[], fromTaskId: string, toTaskId: string): boolean {
    // Create a temporary dependency list with the new dependency
    const tempDependencies = [
      ...dependencies,
      { id: 'temp', fromTaskId, toTaskId, type: 'finish-to-start' as const }
    ];

    // Build dependency graph
    const graph: Record<string, string[]> = {};
    
    tempDependencies.forEach(dep => {
      if (!graph[dep.fromTaskId]) {
        graph[dep.fromTaskId] = [];
      }
      graph[dep.fromTaskId].push(dep.toTaskId);
    });

    // Check for cycles using DFS
    const visited = new Set<string>();
    const path = new Set<string>();

    const hasCycle = (node: string): boolean => {
      if (!graph[node]) return false;
      if (path.has(node)) return true;
      if (visited.has(node)) return false;

      visited.add(node);
      path.add(node);

      for (const neighbor of graph[node]) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }

      path.delete(node);
      return false;
    };

    return hasCycle(fromTaskId);
  }

  /**
   * Calculate task duration in days
   */
  private calculateTaskDuration(task: Task): number {
    if (!task.startDate || !task.dueDate) {
      return 1; // Default to 1 day if no dates are provided
    }

    const startDate = new Date(task.startDate);
    const endDate = new Date(task.dueDate);
    
    // Calculate difference in days
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(1, diffDays); // Minimum 1 day
  }

  /**
   * Perform critical path analysis on a set of tasks and dependencies
   */
  public calculateCriticalPath(tasks: Task[], dependencies: TaskDependency[]): CriticalPathAnalysis {
    // Initialize critical path tasks
    const criticalPathTasks: CriticalPathTask[] = tasks.map(task => ({
      task,
      earliestStart: 0,
      earliestFinish: 0,
      latestStart: 0,
      latestFinish: 0,
      slack: 0,
      isCritical: false
    }));

    // Build dependency graph
    const graph: Record<string, string[]> = {};
    const reverseGraph: Record<string, string[]> = {};
    
    dependencies.forEach(dep => {
      if (dep.type === 'finish-to-start' || dep.type === 'start-to-start') {
        if (!graph[dep.fromTaskId]) {
          graph[dep.fromTaskId] = [];
        }
        graph[dep.fromTaskId].push(dep.toTaskId);

        if (!reverseGraph[dep.toTaskId]) {
          reverseGraph[dep.toTaskId] = [];
        }
        reverseGraph[dep.toTaskId].push(dep.fromTaskId);
      }
    });

    // Topological sort to find execution order
    const visited = new Set<string>();
    const order: string[] = [];

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      if (graph[taskId]) {
        for (const dependentTaskId of graph[taskId]) {
          visit(dependentTaskId);
        }
      }

      order.unshift(taskId);
    };

    tasks.forEach(task => visit(task.id));

    // Forward pass - calculate earliest start and finish times
    const taskMap: Record<string, CriticalPathTask> = {};
    criticalPathTasks.forEach(task => {
      taskMap[task.task.id] = task;
    });

    order.forEach(taskId => {
      const task = taskMap[taskId];
      const duration = this.calculateTaskDuration(task.task);

      // If task has dependencies, find the maximum earliest finish time of all dependencies
      if (reverseGraph[taskId]) {
        let maxEarliestFinish = 0;
        
        for (const depTaskId of reverseGraph[taskId]) {
          const depTask = taskMap[depTaskId];
          maxEarliestFinish = Math.max(maxEarliestFinish, depTask.earliestFinish);
        }
        
        task.earliestStart = maxEarliestFinish;
      }

      task.earliestFinish = task.earliestStart + duration;
    });

    // Find project duration
    let projectDuration = 0;
    criticalPathTasks.forEach(task => {
      projectDuration = Math.max(projectDuration, task.earliestFinish);
    });

    // Backward pass - calculate latest start and finish times
    criticalPathTasks.forEach(task => {
      task.latestFinish = projectDuration;
      task.latestStart = task.latestFinish - this.calculateTaskDuration(task.task);
    });

    for (let i = order.length - 1; i >= 0; i--) {
      const taskId = order[i];
      const task = taskMap[taskId];

      if (graph[taskId]) {
        let minLatestStart = Infinity;
        
        for (const depTaskId of graph[taskId]) {
          const depTask = taskMap[depTaskId];
          minLatestStart = Math.min(minLatestStart, depTask.latestStart);
        }
        
        if (minLatestStart !== Infinity) {
          task.latestFinish = minLatestStart;
          task.latestStart = task.latestFinish - this.calculateTaskDuration(task.task);
        }
      }
    }

    // Calculate slack and identify critical path
    criticalPathTasks.forEach(task => {
      task.slack = task.latestStart - task.earliestStart;
      task.isCritical = task.slack === 0;
    });

    // Prepare result
    const criticalTasks = criticalPathTasks.filter(task => task.isCritical);
    const slackTasks = criticalPathTasks.filter(task => !task.isCritical);
    const criticalPathDuration = projectDuration;

    return {
      criticalTasks,
      projectDuration,
      criticalPathDuration,
      slackTasks
    };
  }

  /**
   * Generate a dependency graph for visualization
   */
  public generateDependencyGraph(tasks: Task[], dependencies: TaskDependency[]): TaskDependencyGraph {
    const nodes = tasks.map(task => ({
      id: task.id,
      label: task.title,
      data: task
    }));

    const edges = dependencies.map(dep => {
      const fromTask = tasks.find(t => t.id === dep.fromTaskId);
      const toTask = tasks.find(t => t.id === dep.toTaskId);
      
      return {
        id: dep.id,
        source: dep.fromTaskId,
        target: dep.toTaskId,
        label: dep.type,
        data: dep
      };
    });

    return { nodes, edges };
  }

  /**
   * Suggest task sequence optimization based on dependencies
   */
  public suggestOptimizedSequence(tasks: Task[], dependencies: TaskDependency[]): Task[] {
    const criticalPathAnalysis = this.calculateCriticalPath(tasks, dependencies);
    
    // Sort tasks by critical path priority
    const sortedTasks = [...tasks].sort((a, b) => {
      const aIsCritical = criticalPathAnalysis.criticalTasks.some(t => t.task.id === a.id);
      const bIsCritical = criticalPathAnalysis.criticalTasks.some(t => t.task.id === b.id);
      
      if (aIsCritical && !bIsCritical) return -1;
      if (!aIsCritical && bIsCritical) return 1;
      
      if (aIsCritical && bIsCritical) {
        const aTask = criticalPathAnalysis.criticalTasks.find(t => t.task.id === a.id);
        const bTask = criticalPathAnalysis.criticalTasks.find(t => t.task.id === b.id);
        
        if (aTask && bTask) {
          return aTask.earliestStart - bTask.earliestStart;
        }
      }
      
      return 0;
    });
    
    return sortedTasks;
  }
}

export default TaskDependencyManager;

