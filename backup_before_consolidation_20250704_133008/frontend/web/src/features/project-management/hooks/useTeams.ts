import { useQuery } from 'react-query';
import { api } from "../../../shared/utils/api";

interface Team {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
}

/**
 * Hook for fetching teams data
 */
export const useTeams = () => {
  return useQuery<Team[], Error>(
    'teams',
    async () => {
      const response = await api.get('/teams');
      return response.data;
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

