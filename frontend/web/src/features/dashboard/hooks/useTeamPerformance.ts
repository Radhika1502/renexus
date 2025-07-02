import { useQuery } from '@tanstack/react-query';
import { TeamPerformance } from '../types';
import { apiClient } from '../../../lib/api-client';

export function useTeamPerformance(dateRange?: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ['teamPerformance', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange?.startDate) {
        params.append('startDate', dateRange.startDate);
      }
      if (dateRange?.endDate) {
        params.append('endDate', dateRange.endDate);
      }

      const response = await apiClient.get<{ data: TeamPerformance[] }>(
        `/api/analytics/team-performance?${params.toString()}`
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
