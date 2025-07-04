import { useState, useEffect, useCallback } from 'react';
import TaskDependencyManager from '../services/tasks/TaskDependencyManager';
import { Task, TaskDependency, CriticalPathAnalysis, TaskDependencyGraph  } from "../../../shared/types/task";

interface UseTaskDependenciesProps {
  projectId: string;
  tasks: Task[];
  initialDependencies?: TaskDependency[];
}

interface UseTaskDependenciesResult {
  dependencies: TaskDependency[];
  loading: boolean;
  error: Error | null;
  addDependency: (fromTaskId: string, toTaskId: string, type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish') => Promise<TaskDependency | null>;
  removeDependency: (dependencyId: string) => Promise<boolean>;
  validateDependency: (fromTaskId: string, toTaskId: string) => { valid: boolean; message?: string };
  criticalPath: CriticalPathAnalysis | null;
  dependencyGraph: TaskDependencyGraph | null;
  optimizedSequence: Task[] | null;
  refreshDependencies: () => Promise<void>;
}

/**
 * Hook for managing task dependencies
 */
export function useTaskDependencies({
  projectId,
  tasks,
  initialDependencies = []
}: UseTaskDependenciesProps): UseTaskDependenciesResult {
  const [dependencies, setDependencies] = useState<TaskDependency[]>(initialDependencies);
  const [loading, setLoading] = useState<boolean>(initialDependencies.length === 0);
  const [error, setError] = useState<Error | null>(null);
  const [criticalPath, setCriticalPath] = useState<CriticalPathAnalysis | null>(null);
  const [dependencyGraph, setDependencyGraph] = useState<TaskDependencyGraph | null>(null);
  const [optimizedSequence, setOptimizedSequence] = useState<Task[] | null>(null);

  const dependencyManager = TaskDependencyManager.getInstance();

  // Fetch dependencies
  const fetchDependencies = useCallback(async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      // In a real implementation, this would call an API
      // For now, we'll use mock data if initialDependencies is empty
      if (initialDependencies.length === 0) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate some mock dependencies if none provided
        const mockDependencies: TaskDependency[] = [];
        if (tasks.length >= 2) {
          for (let i = 0; i < tasks.length - 1; i++) {
            mockDependencies.push({
              id: `dep-${tasks[i].id}-${tasks[i+1].id}`,
              fromTaskId: tasks[i].id,
              toTaskId: tasks[i+1].id,
              type: 'finish-to-start'
            });
          }
        }
        
        setDependencies(mockDependencies);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dependencies'));
    } finally {
      setLoading(false);
    }
  }, [projectId, tasks, initialDependencies]);

  // Add dependency
  const addDependency = useCallback(async (
    fromTaskId: string,
    toTaskId: string,
    type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish'
  ): Promise<TaskDependency | null> => {
    try {
      // Validate first
      const validation = dependencyManager.validateDependency(tasks, dependencies, fromTaskId, toTaskId);
      if (!validation.valid) {
        throw new Error(validation.message || 'Invalid dependency');
      }

      // In a real implementation, this would call an API
      // For now, we'll create a local dependency
      const fromTask = tasks.find(t => t.id === fromTaskId);
      const toTask = tasks.find(t => t.id === toTaskId);
      
      if (!fromTask || !toTask) {
        throw new Error('Task not found');
      }
      
      const newDependency = dependencyManager.createDependency(fromTask, toTask, type);
      
      // Update state
      setDependencies(prev => [...prev, newDependency]);
      
      // Update analyses
      updateAnalyses([...dependencies, newDependency]);
      
      return newDependency;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add dependency'));
      return null;
    }
  }, [dependencies, tasks, dependencyManager]);

  // Remove dependency
  const removeDependency = useCallback(async (dependencyId: string): Promise<boolean> => {
    try {
      // In a real implementation, this would call an API
      // For now, we'll just remove from local state
      setDependencies(prev => prev.filter(dep => dep.id !== dependencyId));
      
      // Update analyses
      const updatedDependencies = dependencies.filter(dep => dep.id !== dependencyId);
      updateAnalyses(updatedDependencies);
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to remove dependency'));
      return false;
    }
  }, [dependencies]);

  // Validate dependency
  const validateDependency = useCallback((fromTaskId: string, toTaskId: string) => {
    return dependencyManager.validateDependency(tasks, dependencies, fromTaskId, toTaskId);
  }, [tasks, dependencies, dependencyManager]);

  // Update all analyses
  const updateAnalyses = useCallback((deps: TaskDependency[]) => {
    if (tasks.length === 0) return;
    
    // Calculate critical path
    const criticalPathResult = dependencyManager.calculateCriticalPath(tasks, deps);
    setCriticalPath(criticalPathResult);
    
    // Generate dependency graph
    const graphResult = dependencyManager.generateDependencyGraph(tasks, deps);
    setDependencyGraph(graphResult);
    
    // Calculate optimized sequence
    const sequenceResult = dependencyManager.suggestOptimizedSequence(tasks, deps);
    setOptimizedSequence(sequenceResult);
  }, [tasks, dependencyManager]);

  // Refresh dependencies
  const refreshDependencies = useCallback(async () => {
    await fetchDependencies();
  }, [fetchDependencies]);

  // Initial fetch and analyses
  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  // Update analyses when dependencies or tasks change
  useEffect(() => {
    updateAnalyses(dependencies);
  }, [dependencies, tasks, updateAnalyses]);

  return {
    dependencies,
    loading,
    error,
    addDependency,
    removeDependency,
    validateDependency,
    criticalPath,
    dependencyGraph,
    optimizedSequence,
    refreshDependencies
  };
}

export default useTaskDependencies;

