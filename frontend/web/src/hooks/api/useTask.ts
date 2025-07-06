import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '../../api/client';
import { Task, CreateTaskInput, UpdateTaskInput, TaskFilter, TaskSort } from '../../types/task';

// Get a single task
export const useTask = (taskId: string) => {
  return useQuery<Task, Error>(
    ['task', taskId],
    async () => {
      const response = await apiClient.get(`/tasks/${taskId}`);
      return response.data;
    },
    {
      enabled: !!taskId,
      staleTime: 30000, // Consider data fresh for 30 seconds
    }
  );
};

// Get a list of tasks
export const useTasks = (
  filter?: TaskFilter,
  sort?: TaskSort,
  page: number = 1,
  pageSize: number = 20
) => {
  return useQuery<{ tasks: Task[]; total: number }, Error>(
    ['tasks', filter, sort, page, pageSize],
    async () => {
      const response = await apiClient.get('/tasks', {
        params: { filter, sort, page, pageSize },
      });
      return response.data;
    },
    {
      keepPreviousData: true,
      staleTime: 30000,
    }
  );
};

// Create a task
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, CreateTaskInput>(
    async (newTask) => {
      const response = await apiClient.post('/tasks', newTask);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
      },
    }
  );
};

// Update a task
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, { taskId: string; data: UpdateTaskInput }>(
    async ({ taskId, data }) => {
      const response = await apiClient.patch(`/tasks/${taskId}`, data);
      return response.data;
    },
    {
      onSuccess: (updatedTask) => {
        queryClient.invalidateQueries(['task', updatedTask.id]);
        queryClient.invalidateQueries('tasks');
      },
    }
  );
};

// Delete a task
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>(
    async (taskId) => {
      await apiClient.delete(`/tasks/${taskId}`);
    },
    {
      onSuccess: (_, taskId) => {
        queryClient.invalidateQueries('tasks');
        queryClient.removeQueries(['task', taskId]);
      },
    }
  );
};

// Get task dependencies
export const useTaskDependencies = (taskId: string) => {
  return useQuery({
    queryKey: ['task-dependencies', taskId],
    queryFn: () => apiClient.get(`/tasks/${taskId}/dependencies`),
    enabled: !!taskId,
  });
};

// Update task dependencies
export const useUpdateTaskDependencies = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      dependencies,
    }: {
      taskId: string;
      dependencies: {
        dependencies?: string[];
        parentId?: string | null;
        relatedTasks?: string[];
      };
    }) => apiClient.patch(`/tasks/${taskId}/dependencies`, dependencies),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['task-dependencies', taskId] });
    },
  });
};

// Get project tasks
export const useProjectTasks = (
  projectId: string,
  filter?: TaskFilter,
  sort?: TaskSort,
  page: number = 1,
  pageSize: number = 20
) => {
  return useQuery({
    queryKey: ['project-tasks', projectId, filter, sort, page, pageSize],
    queryFn: () => apiClient.get(`/projects/${projectId}/tasks`, {
      params: { filter, sort, page, pageSize },
    }),
    enabled: !!projectId,
  });
};

// Update task status
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      status,
      comment,
    }: {
      taskId: string;
      status: string;
      comment?: string;
    }) => apiClient.patch(`/tasks/${taskId}/status`, { status, comment }),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries(['task', updatedTask.id]);
      queryClient.invalidateQueries('tasks');
      if (updatedTask.projectId) {
        queryClient.invalidateQueries(['project-tasks', updatedTask.projectId]);
      }
    },
  });
};

// Get task history
export const useTaskHistory = (taskId: string) => {
  return useQuery({
    queryKey: ['task-history', taskId],
    queryFn: () => apiClient.get(`/tasks/${taskId}/history`),
    enabled: !!taskId,
  });
};

// Get task comments
export const useTaskComments = (taskId: string) => {
  return useQuery(
    ['task-comments', taskId],
    async () => {
      const response = await apiClient.get(`/tasks/${taskId}/comments`);
      return response.data;
    },
    {
      enabled: !!taskId,
    }
  );
};

// Add task comment
export const useAddTaskComment = () => {
  const queryClient = useQueryClient();

  return useMutation<
    any,
    Error,
    { taskId: string; content: string }
  >(
    async ({ taskId, content }) => {
      const response = await apiClient.post(`/tasks/${taskId}/comments`, {
        content,
      });
      return response.data;
    },
    {
      onSuccess: (_, { taskId }) => {
        queryClient.invalidateQueries(['task-comments', taskId]);
      },
    }
  );
}; 