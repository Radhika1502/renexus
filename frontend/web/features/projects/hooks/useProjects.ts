import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'completed';
  startDate?: string;
  endDate?: string;
  teamId?: string;
}

export const useProjects = () => {
  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    projects,
    isLoading,
    error
  };
};
