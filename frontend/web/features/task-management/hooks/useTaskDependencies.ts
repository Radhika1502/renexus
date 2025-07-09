import { useQuery, useMutation, useQueryClient } from './queryHooks';
import { apiClient } from '../../../lib/api-client';
import { Task } from '../types';

// Define TaskDependency interface locally to avoid import issues
interface TaskDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
}

/**
 * Hook to fetch task dependencies for a specific task
 */
export const useTaskDependencies = (taskId: string) => {
  return useQuery<TaskDependency[], Error>({
    queryKey: ['taskDependencies', taskId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/tasks/${taskId}/dependencies`);
      return response.data as TaskDependency[];
    },
    enabled: !!taskId
  });
};

/**
 * Hook to fetch all task dependencies
 */
export const useAllTaskDependencies = (projectId?: string) => {
  return useQuery<TaskDependency[], Error>({
    queryKey: ['allTaskDependencies', projectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) {
        params.append('projectId', projectId);
      }
      
      const url = `/api/task-dependencies${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await apiClient.get(url);
      return response.data as TaskDependency[];
    }
  });
};

/**
 * Hook to create a new task dependency
 */
export const useCreateTaskDependency = () => {
  const queryClient = useQueryClient();
  
  return useMutation<
    TaskDependency, 
    Error, 
    { fromTaskId: string; toTaskId: string; type: string }
  >({
    mutationFn: async (dependency) => {
      const response = await apiClient.post('/api/task-dependencies', dependency);
      return response.data as TaskDependency;
    },
    onSuccess: (data: TaskDependency) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(['taskDependencies', data.fromTaskId]);
      queryClient.invalidateQueries(['taskDependencies', data.toTaskId]);
      queryClient.invalidateQueries(['allTaskDependencies']);
    }
  });
};

/**
 * Hook to delete a task dependency
 */
export const useDeleteTaskDependency = () => {
  const queryClient = useQueryClient();
  
  type DeleteDependencyParams = { 
    dependencyId: string; 
    fromTaskId: string; 
    toTaskId: string 
  };
  
  return useMutation<
    DeleteDependencyParams, 
    Error, 
    DeleteDependencyParams
  >({
    mutationFn: async ({ dependencyId, fromTaskId, toTaskId }) => {
      await apiClient.delete(`/api/task-dependencies/${dependencyId}`);
      return { dependencyId, fromTaskId, toTaskId };
    },
    onSuccess: (data: DeleteDependencyParams) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(['taskDependencies', data.fromTaskId]);
      queryClient.invalidateQueries(['taskDependencies', data.toTaskId]);
      queryClient.invalidateQueries(['allTaskDependencies']);
    }
  });
};

/**
 * Hook to validate if a dependency can be created
 */
export const useValidateTaskDependency = () => {
  type ValidationParams = { 
    fromTaskId: string; 
    toTaskId: string 
  };
  
  type ValidationResult = { 
    valid: boolean; 
    message?: string 
  };
  
  return useMutation<
    ValidationResult, 
    Error, 
    ValidationParams
  >({
    mutationFn: async ({ fromTaskId, toTaskId }) => {
      const response = await apiClient.post('/api/task-dependencies/validate', { fromTaskId, toTaskId });
      return response.data as ValidationResult;
    }
  });
};

/**
 * Hook to get critical path analysis for a project
 */
export const useCriticalPathAnalysis = (projectId: string) => {
  return useQuery<any, Error>({
    queryKey: ['criticalPath', projectId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/projects/${projectId}/critical-path`);
      return response.data;
    },
    enabled: !!projectId
  });
};
