import { useQuery } from '@tanstack/react-query';
import { api } from '../../../utils/api';

interface ActivityUser {
  id: string;
  name: string;
  avatar?: string;
}

interface ActivityDetails {
  field?: string;
  oldValue?: string;
  newValue?: string;
  comment?: string;
  attachment?: {
    id: string;
    name: string;
    type: string;
  };
  linkedTask?: {
    id: string;
    title: string;
  };
}

export interface ActivityItem {
  id: string;
  type: 'create' | 'update' | 'comment' | 'attachment' | 'status' | 'assignee' | 'priority' | 'label' | 'dueDate' | 'link';
  user: ActivityUser;
  timestamp: string;
  details: ActivityDetails;
}

/**
 * Hook for fetching task activity history
 */
export const useTaskActivity = (taskId: string) => {
  return useQuery<ActivityItem[]>({
    queryKey: ['taskActivity', taskId],
    queryFn: async () => {
      const response = await api.get(`/tasks/${taskId}/activity`);
      return response.data;
    },
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export default useTaskActivity;
