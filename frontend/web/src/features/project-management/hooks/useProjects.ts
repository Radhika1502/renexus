import { useQuery } from 'react-query';
import { Project, ProjectFilters } from '../types';
import { api } from '../../../utils/api';

/**
 * Hook for fetching projects with optional filtering
 */
export const useProjects = (filters?: ProjectFilters) => {
  return useQuery<Project[], Error>(
    ['projects', filters],
    async () => {
      // Convert filters to query parameters
      const params = new URLSearchParams();
      if (filters?.status?.length) {
        filters.status.forEach(status => {
          params.append('status', status);
        });
      }
      if (filters?.teamId) {
        params.append('teamId', filters.teamId);
      }
      if (filters?.leadId) {
        params.append('leadId', filters.leadId);
      }
      if (filters?.search) {
        params.append('search', filters.search);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      const response = await api.get(`/projects${queryString}`);
      return response.data;
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};
