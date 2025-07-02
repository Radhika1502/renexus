import { useQuery } from 'react-query';
import { Task } from '../types';
import { api } from "../../../shared/utils/api";

/**
 * Hook for fetching a single task by ID
 */
export const useTask = (taskId: string) => {
  return useQuery<Task, Error>(
    ['task', taskId],
    async () => {
      const response = await api.get(`/tasks/${taskId}`);
      return response.data;
    },
    {
      enabled: !!taskId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

