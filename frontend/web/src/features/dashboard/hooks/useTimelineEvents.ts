import { useQuery } from '@tanstack/react-query';
import { TimelineEvent } from '../types';
import { apiClient } from '../../../lib/api-client';

interface TimelineEventsParams {
  projectId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export function useTimelineEvents(params?: TimelineEventsParams) {
  return useQuery({
    queryKey: ['timelineEvents', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      
      if (params?.projectId) {
        queryParams.append('projectId', params.projectId);
      }
      
      if (params?.startDate) {
        queryParams.append('startDate', params.startDate);
      }
      
      if (params?.endDate) {
        queryParams.append('endDate', params.endDate);
      }
      
      if (params?.limit) {
        queryParams.append('limit', params.limit.toString());
      }

      const response = await apiClient.get<{ data: TimelineEvent[] }>(
        `/api/timeline-events?${queryParams.toString()}`
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
