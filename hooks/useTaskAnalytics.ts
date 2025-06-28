import { useState, useEffect, useCallback } from 'react';
import { 
  TaskAnalyticsFilters, 
  TaskAnalyticsResponse, 
  UserMention 
} from '../types/task-analytics';
import TaskAnalyticsService from '../services/analytics/task-analytics.service';

/**
 * Hook for accessing task analytics data
 */
export const useTaskAnalytics = (initialFilters?: TaskAnalyticsFilters) => {
  const [filters, setFilters] = useState<TaskAnalyticsFilters>(initialFilters || {});
  const [data, setData] = useState<TaskAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const taskAnalyticsService = TaskAnalyticsService.getInstance();
  
  /**
   * Fetch task analytics data
   */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await taskAnalyticsService.getTaskAnalytics(filters);
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch task analytics'));
      console.error('Error fetching task analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, taskAnalyticsService]);
  
  /**
   * Update filters and refetch data
   */
  const updateFilters = useCallback((newFilters: Partial<TaskAnalyticsFilters>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);
  
  /**
   * Reset filters to initial state
   */
  const resetFilters = useCallback(() => {
    setFilters(initialFilters || {});
  }, [initialFilters]);
  
  /**
   * Refresh data without changing filters
   */
  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);
  
  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refreshData
  };
};

/**
 * Hook for accessing user mentions
 */
export const useUserMentions = (userId: string) => {
  const [mentions, setMentions] = useState<UserMention[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const taskAnalyticsService = TaskAnalyticsService.getInstance();
  
  /**
   * Fetch user mentions
   */
  const fetchMentions = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await taskAnalyticsService.getUserMentions(userId);
      setMentions(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch user mentions'));
      console.error('Error fetching user mentions:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, taskAnalyticsService]);
  
  /**
   * Mark a mention as resolved
   */
  const resolveMention = useCallback(async (mentionId: string) => {
    try {
      const success = await taskAnalyticsService.resolveUserMention(mentionId);
      
      if (success) {
        // Update local state to mark the mention as resolved
        setMentions(prevMentions => 
          prevMentions.map(mention => 
            mention.id === mentionId
              ? { ...mention, resolved: true, resolvedAt: new Date().toISOString() }
              : mention
          )
        );
      }
      
      return success;
    } catch (err) {
      console.error('Error resolving mention:', err);
      return false;
    }
  }, [taskAnalyticsService]);
  
  /**
   * Refresh mentions data
   */
  const refreshMentions = useCallback(() => {
    fetchMentions();
  }, [fetchMentions]);
  
  // Fetch mentions on mount and when userId changes
  useEffect(() => {
    fetchMentions();
  }, [fetchMentions]);
  
  return {
    mentions,
    loading,
    error,
    resolveMention,
    refreshMentions
  };
};

export default useTaskAnalytics;
