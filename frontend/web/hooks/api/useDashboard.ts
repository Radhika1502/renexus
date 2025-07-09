import { useQuery } from 'react-query';
import { apiClient } from '../../api/client';
import { TaskAnalytics, WorkloadAnalysis } from '../../types/task';

export const useDashboardAnalytics = (projectId?: string) => {
  return useQuery<TaskAnalytics>(
    ['dashboard-analytics', projectId],
    async () => {
      const response = await apiClient.get('/analytics/tasks', {
        params: { projectId },
      });
      return response.data;
    },
    {
      staleTime: 60000, // Consider data fresh for 1 minute
      refetchInterval: 300000, // Refetch every 5 minutes
    }
  );
};

export const useWorkloadAnalytics = () => {
  return useQuery<WorkloadAnalysis>(
    'workload-analytics',
    async () => {
      const response = await apiClient.get('/analytics/workload');
      return response.data;
    },
    {
      staleTime: 60000,
      refetchInterval: 300000,
    }
  );
};

export const useTaskTrends = (days: number = 30) => {
  return useQuery(
    ['task-trends', days],
    async () => {
      const response = await apiClient.get('/analytics/trends', {
        params: { days },
      });
      return response.data;
    },
    {
      staleTime: 3600000, // Consider data fresh for 1 hour
    }
  );
};

export const useResourceUtilization = () => {
  return useQuery(
    'resource-utilization',
    async () => {
      const response = await apiClient.get('/analytics/resources');
      return response.data;
    },
    {
      staleTime: 300000, // Consider data fresh for 5 minutes
    }
  );
}; 