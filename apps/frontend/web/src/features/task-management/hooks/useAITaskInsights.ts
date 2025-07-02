import { useQuery } from '@tanstack/react-query';
import { getAITaskInsights } from '@/services/ai-service';
import { AITaskInsights } from '@/services/ai-service/types';

export const useAITaskInsights = (taskId: string, description: string) => {
  return useQuery<AITaskInsights>({
    queryKey: ['aiTaskInsights', taskId],
    queryFn: () => getAITaskInsights(taskId, description),
    enabled: !!taskId && !!description,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};
