import { useQuery } from 'react-query';
import { Task, TaskFilters } from '../types';
import { api } from '../../../utils/api';

/**
 * Hook for fetching tasks with optional filtering
 */
export const useTasks = (filters?: TaskFilters) => {
  return useQuery<Task[], Error>(
    ['tasks', filters],
    async () => {
      // Convert filters to query parameters
      const params = new URLSearchParams();
      
      if (filters?.status?.length) {
        filters.status.forEach(status => {
          params.append('status', status);
        });
      }
      
      if (filters?.priority?.length) {
        filters.priority.forEach(priority => {
          params.append('priority', priority);
        });
      }
      
      if (filters?.assigneeId) {
        params.append('assigneeId', filters.assigneeId);
      }
      
      if (filters?.reporterId) {
        params.append('reporterId', filters.reporterId);
      }
      
      if (filters?.projectId) {
        params.append('projectId', filters.projectId);
      }
      
      if (filters?.epicId) {
        params.append('epicId', filters.epicId);
      }
      
      if (filters?.sprintId) {
        params.append('sprintId', filters.sprintId);
      }
      
      if (filters?.search) {
        params.append('search', filters.search);
      }
      
      if (filters?.labels?.length) {
        filters.labels.forEach(label => {
          params.append('label', label);
        });
      }
      
      if (filters?.dueDateStart) {
        params.append('dueDateStart', filters.dueDateStart);
      }
      
      if (filters?.dueDateEnd) {
        params.append('dueDateEnd', filters.dueDateEnd);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/tasks${queryString}`);
      return response.data;
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};
