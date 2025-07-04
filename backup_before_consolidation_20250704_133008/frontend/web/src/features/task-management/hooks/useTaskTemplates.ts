import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../lib/api';
import { TaskTemplate, 
  CreateTaskTemplateInput, 
  UpdateTaskTemplateInput 
 } from "../../../shared/types/templates";

/**
 * Hook for fetching task templates
 */
export const useTaskTemplates = (projectId?: string) => {
  const queryKey = projectId ? ['taskTemplates', projectId] : ['taskTemplates'];
  
  return useQuery<TaskTemplate[], Error>({
    queryKey,
    queryFn: async () => {
      const url = projectId 
        ? `/task-templates?projectId=${projectId}` 
        : '/task-templates';
      const response = await api.get(url);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for fetching a single task template
 */
export const useTaskTemplate = (templateId: string) => {
  return useQuery<TaskTemplate, Error>({
    queryKey: ['taskTemplate', templateId],
    queryFn: async () => {
      const response = await api.get(`/task-templates/${templateId}`);
      return response.data;
    },
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook for creating a task template
 */
export const useCreateTaskTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation<TaskTemplate, Error, CreateTaskTemplateInput>({
    mutationFn: async (data) => {
      const response = await api.post('/task-templates', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update cache for the specific template
      queryClient.setQueryData(['taskTemplate', data.id], data);
      
      // Invalidate templates lists
      queryClient.invalidateQueries({
        queryKey: ['taskTemplates'],
        exact: false,
      });
      
      // If template is project-specific, invalidate that project's templates
      if (data.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['taskTemplates', data.projectId],
        });
      }
    },
  });
};

/**
 * Hook for updating a task template
 */
export const useUpdateTaskTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation<TaskTemplate, Error, UpdateTaskTemplateInput>({
    mutationFn: async (data) => {
      const { id, ...updateData } = data;
      const response = await api.patch(`/task-templates/${id}`, updateData);
      return response.data;
    },
    onSuccess: (data) => {
      // Update cache for the specific template
      queryClient.setQueryData(['taskTemplate', data.id], data);
      
      // Invalidate templates lists
      queryClient.invalidateQueries({
        queryKey: ['taskTemplates'],
        exact: false,
      });
      
      // If template is project-specific, invalidate that project's templates
      if (data.projectId) {
        queryClient.invalidateQueries({
          queryKey: ['taskTemplates', data.projectId],
        });
      }
    },
  });
};

/**
 * Hook for deleting a task template
 */
export const useDeleteTaskTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, string>({
    mutationFn: async (templateId) => {
      await api.delete(`/task-templates/${templateId}`);
    },
    onSuccess: (_, templateId) => {
      // Remove template from cache
      queryClient.removeQueries({
        queryKey: ['taskTemplate', templateId],
      });
      
      // Invalidate templates lists
      queryClient.invalidateQueries({
        queryKey: ['taskTemplates'],
        exact: false,
      });
    },
  });
};

/**
 * Hook for creating a task from a template
 */
export const useCreateTaskFromTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation<any, Error, { templateId: string; projectId: string; customFields?: Record<string, any> }>({
    mutationFn: async ({ templateId, projectId, customFields }) => {
      const response = await api.post(`/task-templates/${templateId}/create-task`, {
        projectId,
        customFields,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Add new task to cache
      queryClient.setQueryData(['task', data.id], data);
      
      // Invalidate tasks list
      queryClient.invalidateQueries({
        queryKey: ['tasks'],
        exact: false,
      });
    },
  });
};

