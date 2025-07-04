import { useQuery } from '@tanstack/react-query';
import { useTaskApi } from './useTaskApi';
import { useOfflineSync } from './useOfflineSync';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface WorkflowStep {
  id: string;
  type: 'status_change' | 'assign' | 'add_label' | 'remove_label' | 'notify' | 'custom';
  config: Record<string, any>;
  order: number;
}

export const useWorkflows = (projectId?: string) => {
  const { getWorkflows } = useTaskApi();
  const { isOnline, getCachedData } = useOfflineSync();
  
  return useQuery({
    queryKey: ['workflows', projectId],
    queryFn: async () => {
      if (isOnline) {
        const workflows = await getWorkflows(projectId);
        return workflows;
      } else {
        // Return cached workflows when offline
        return getCachedData('workflows') || [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
