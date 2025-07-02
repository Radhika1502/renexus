import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  Task, 
  TaskStatus, 
  TaskFilter,
  CreateTaskDto, 
  UpdateTaskDto, 
  BulkUpdateTasksDto
} from '../types';
import { api as apiClient } from "../../../shared/utils/api";

/**
 * Hook for managing tasks with full CRUD operations
 */
export const useTasks = (projectId?: string, filter?: TaskFilter) => {
  const queryClient = useQueryClient();
  
  // Build query key based on filters
  const getQueryKey = () => {
    const key = ['tasks'];
    if (projectId) key.push(projectId);
    if (filter) key.push(filter);
    return key;
  };

  // Convert filters to query parameters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (projectId) {
      params.append('projectId', projectId);
    }
    
    if (filter?.status?.length) {
      filter.status.forEach(status => {
        params.append('status', status);
      });
    }
    
    if (filter?.priority?.length) {
      filter.priority.forEach(priority => {
        params.append('priority', priority);
      });
    }
    
    if (filter?.assigneeIds?.length) {
      filter.assigneeIds.forEach(assigneeId => {
        params.append('assigneeId', assigneeId);
      });
    }
    
    if (filter?.labelIds?.length) {
      filter.labelIds.forEach(labelId => {
        params.append('labelId', labelId);
      });
    }
    
    if (filter?.search) {
      params.append('search', filter.search);
    }
    
    if (filter?.dueDate?.from) {
      params.append('dueDateFrom', filter.dueDate.from);
    }
    
    if (filter?.dueDate?.to) {
      params.append('dueDateTo', filter.dueDate.to);
    }
    
    if (filter?.parentTaskId !== undefined) {
      params.append('parentTaskId', filter.parentTaskId || 'null');
    }
    
    if (filter?.hasSubtasks !== undefined) {
      params.append('hasSubtasks', String(filter.hasSubtasks));
    }

    return params;
  };

  // Fetch tasks query
  const tasksQuery = useQuery<Task[]>({
    queryKey: getQueryKey(),
    queryFn: async () => {
      const params = buildQueryParams();
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await apiClient.get<{ tasks: Task[] }>(`/api/tasks${queryString}`);
      return response.data.tasks;
    },
    enabled: !!projectId,
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (newTask: CreateTaskDto) => {
      const response = await apiClient.post<{ task: Task }>('/api/tasks', newTask);
      return response.data.task;
    },
    onSuccess: (newTask) => {
      // Update tasks cache
      queryClient.setQueryData<Task[]>(
        ['tasks', newTask.projectId],
        (oldTasks = []) => [...oldTasks, newTask]
      );
      
      // If this is a subtask, update parent task's subtasks
      if (newTask.parentTaskId) {
        queryClient.setQueryData<Task | undefined>(
          ['task', newTask.parentTaskId],
          (oldTask) => {
            if (!oldTask) return undefined;
            return {
              ...oldTask,
              subtasks: [...(oldTask.subtasks || []), newTask]
            };
          }
        );
      }
    }
  });
  
  // Get single task query
  const useTaskQuery = (taskId: string) => {
    return useQuery<Task>({
      queryKey: ['task', taskId],
      queryFn: async () => {
        const response = await apiClient.get<{ task: Task }>(`/api/tasks/${taskId}`);
        return response.data.task;
      },
      enabled: !!taskId
    });
  };
  
  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: UpdateTaskDto }) => {
      const response = await apiClient.patch<{ task: Task }>(`/api/tasks/${taskId}`, updates);
      return response.data.task;
    },
    onSuccess: (updatedTask) => {
      // Update single task cache
      queryClient.setQueryData(['task', updatedTask.id], updatedTask);
      
      // Update tasks list cache
      queryClient.setQueryData<Task[]>(
        ['tasks', updatedTask.projectId],
        (oldTasks = []) => oldTasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        )
      );
      
      // If parent task changed, update both old and new parent's subtasks
      if ('parentTaskId' in updatedTask) {
        // Get the old task data to find the previous parent
        const oldTask = queryClient.getQueryData<Task>(['task', updatedTask.id]);
        
        // Update old parent if it exists
        if (oldTask?.parentTaskId && oldTask.parentTaskId !== updatedTask.parentTaskId) {
          queryClient.setQueryData<Task | undefined>(
            ['task', oldTask.parentTaskId],
            (oldParent) => {
              if (!oldParent) return undefined;
              return {
                ...oldParent,
                subtasks: (oldParent.subtasks || []).filter(
                  subtask => subtask.id !== updatedTask.id
                )
              };
            }
          );
        }
        
        // Update new parent if it exists
        if (updatedTask.parentTaskId) {
          queryClient.setQueryData<Task | undefined>(
            ['task', updatedTask.parentTaskId],
            (newParent) => {
              if (!newParent) return undefined;
              return {
                ...newParent,
                subtasks: [...(newParent.subtasks || []), updatedTask]
              };
            }
          );
        }
      }
    }
  });
  
  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await apiClient.delete(`/api/tasks/${taskId}`);
      return taskId;
    },
    onSuccess: (taskId) => {
      // Get the task data before removal
      const oldTask = queryClient.getQueryData<Task>(['task', taskId]);
      
      // Remove from single task cache
      queryClient.removeQueries(['task', taskId]);
      
      // Remove from tasks list cache
      if (oldTask?.projectId) {
        queryClient.setQueryData<Task[]>(
          ['tasks', oldTask.projectId],
          (oldTasks = []) => oldTasks.filter(task => task.id !== taskId)
        );
      }
      
      // Update parent task's subtasks if applicable
      if (oldTask?.parentTaskId) {
        queryClient.setQueryData<Task | undefined>(
          ['task', oldTask.parentTaskId],
          (parentTask) => {
            if (!parentTask) return undefined;
            return {
              ...parentTask,
              subtasks: (parentTask.subtasks || []).filter(
                subtask => subtask.id !== taskId
              )
            };
          }
        );
      }
    }
  });
  
  // Bulk update tasks mutation
  const bulkUpdateTasksMutation = useMutation({
    mutationFn: async (bulkUpdate: BulkUpdateTasksDto) => {
      const response = await apiClient.patch<{ tasks: Task[] }>('/api/tasks/bulk', bulkUpdate);
      return response.data.tasks;
    },
    onSuccess: (updatedTasks) => {
      // Group tasks by project for efficient cache updates
      const tasksByProject = updatedTasks.reduce((acc, task) => {
        if (!acc[task.projectId]) {
          acc[task.projectId] = [];
        }
        acc[task.projectId].push(task);
        return acc;
      }, {} as Record<string, Task[]>);
      
      // Update each project's task list
      Object.entries(tasksByProject).forEach(([projectId, tasks]) => {
        queryClient.setQueryData<Task[]>(
          ['tasks', projectId],
          (oldTasks = []) => {
            const taskMap = new Map(tasks.map(task => [task.id, task]));
            return oldTasks.map(task => taskMap.get(task.id) || task);
          }
        );
      });
      
      // Update individual task caches
      updatedTasks.forEach(task => {
        queryClient.setQueryData(['task', task.id], task);
      });
    }
  });
  
  // Update task status mutation (common operation)
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      const response = await apiClient.patch<{ task: Task }>(
        `/api/tasks/${taskId}/status`,
        { status }
      );
      return response.data.task;
    },
    onSuccess: (updatedTask) => {
      // Update single task cache
      queryClient.setQueryData(['task', updatedTask.id], updatedTask);
      
      // Update tasks list cache
      queryClient.setQueryData<Task[]>(
        ['tasks', updatedTask.projectId],
        (oldTasks = []) => oldTasks.map(task => 
          task.id === updatedTask.id ? updatedTask : task
        )
      );
    }
  });

  return {
    // Queries
    tasks: tasksQuery.data || [],
    isLoading: tasksQuery.isLoading,
    isError: tasksQuery.isError,
    error: tasksQuery.error,
    
    // Single task query
    useTaskQuery,
    
    // Mutations
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    bulkUpdateTasks: bulkUpdateTasksMutation.mutateAsync,
    updateTaskStatus: updateTaskStatusMutation.mutateAsync,
    
    // Mutation states
    isCreating: createTaskMutation.isLoading,
    isUpdating: updateTaskMutation.isLoading,
    isDeleting: deleteTaskMutation.isLoading,
    isBulkUpdating: bulkUpdateTasksMutation.isLoading,
    
    // Refetch
    refetch: tasksQuery.refetch
  };
};

