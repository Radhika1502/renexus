import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

export const useTaskAnalytics = (taskId: string) => {
  return useQuery({
    queryKey: ['taskAnalytics', taskId],
    queryFn: async () => {
      const response = await axios.get(`/api/tasks/${taskId}/analytics`);
      return response.data;
    },
    enabled: !!taskId,
  });
};
