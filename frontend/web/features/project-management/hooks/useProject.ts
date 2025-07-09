import { useQuery } from 'react-query';
import { Project } from '../types';
import { api } from "../../../shared/utils/api";

/**
 * Hook for fetching a single project by ID
 */
export const useProject = (projectId: string) => {
  return useQuery<Project, Error>(
    ['project', projectId],
    async () => {
      const response = await api.get(`/projects/${projectId}`);
      return response.data;
    },
    {
      enabled: !!projectId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

