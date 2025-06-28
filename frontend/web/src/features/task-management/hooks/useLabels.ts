import { useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api';

export interface Label {
  id: string;
  name: string;
  color: string;
  projectId?: string;
}

export const useLabels = (projectId?: string) => {
  const { data: labels = [], isLoading, error } = useQuery<Label[]>({
    queryKey: ['labels', { projectId }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) {
        params.append('projectId', projectId);
      }
      const response = await api.get(`/labels?${params.toString()}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    labels,
    isLoading,
    error
  };
};
