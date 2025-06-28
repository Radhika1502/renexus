import { useQuery } from '@tanstack/react-query';
import { Task } from '../../task-management/types';
import { apiClient } from '../../../services/api';

/**
 * Hook to fetch all tasks for a specific project
 * @param projectId The ID of the project to fetch tasks for
 */
export const useProjectTasks = (projectId: string) => {
  return useQuery<Task[], Error>({
    queryKey: ['projectTasks', projectId],
    queryFn: async () => {
      const response = await apiClient.get(`/api/projects/${projectId}/tasks`);
      return response.data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
