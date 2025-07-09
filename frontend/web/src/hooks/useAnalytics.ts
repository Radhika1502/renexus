import { useState, useEffect, useCallback } from 'react';

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  trend: number;
  unit: string;
}

interface AnalyticsInsight {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  metric?: string;
  recommendations?: string[];
}

interface TimeSeriesData {
  label: string;
  value: number;
  date: string;
}

interface AnalyticsData {
  metrics: AnalyticsMetric[];
  insights: AnalyticsInsight[];
  taskCompletionTrend: TimeSeriesData[];
  teamVelocityTrend: TimeSeriesData[];
  taskDistribution: {
    label: string;
    value: number;
  }[];
}

export function useAnalytics(projectId?: string, startDate?: string, endDate?: string) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      let endpoint = '/api/analytics';
      
      if (projectId) {
        endpoint = `/api/projects/${projectId}/analytics`;
      }
      
      // Add date range if provided
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const queryString = params.toString();
      if (queryString) endpoint += `?${queryString}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch analytics data');
      
      const analyticsData = await response.json();
      
      // Transform and validate the data
      const transformedData: AnalyticsData = {
        metrics: analyticsData.metrics.map((metric: any) => ({
          id: metric.id,
          name: metric.name,
          value: metric.value,
          trend: metric.trend,
          unit: metric.unit
        })),
        insights: analyticsData.insights.map((insight: any) => ({
          id: insight.id,
          title: insight.title,
          description: insight.description,
          severity: insight.severity,
          metric: insight.metric,
          recommendations: insight.recommendations
        })),
        taskCompletionTrend: analyticsData.taskCompletionTrend.map((point: any) => ({
          label: point.label,
          value: point.value,
          date: point.date
        })),
        teamVelocityTrend: analyticsData.teamVelocityTrend.map((point: any) => ({
          label: point.label,
          value: point.value,
          date: point.date
        })),
        taskDistribution: analyticsData.taskDistribution.map((item: any) => ({
          label: item.label,
          value: item.value
        }))
      };
      
      setData(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, startDate, endDate]);

  // Fetch analytics on mount and when dependencies change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    isLoading,
    error,
    refreshAnalytics: fetchAnalytics
  };
} 