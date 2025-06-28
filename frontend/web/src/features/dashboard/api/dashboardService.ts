import { api } from '../../../services/api';
import {
  DashboardSummary,
  ProjectSummary,
  TaskStatusSummary,
  TeamPerformance,
  UserPerformance,
  ProjectRisk,
  TimelineEvent,
  ActivityFeed,
  ProjectMetrics,
  TimeRange
} from '../types';

const BASE_URL = '/dashboard';

export const dashboardService = {
  // Dashboard summary
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get(`${BASE_URL}/summary`);
    return response.data;
  },

  // Project data
  getProjectSummaries: async (timeRange?: TimeRange): Promise<ProjectSummary[]> => {
    let url = `${BASE_URL}/projects`;
    if (timeRange) {
      url += `?start=${timeRange.start}&end=${timeRange.end}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  getProjectMetrics: async (projectId: string, timeRange?: TimeRange): Promise<ProjectMetrics> => {
    let url = `${BASE_URL}/projects/${projectId}/metrics`;
    if (timeRange) {
      url += `?start=${timeRange.start}&end=${timeRange.end}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Task data
  getTaskStatusSummary: async (projectId?: string, timeRange?: TimeRange): Promise<TaskStatusSummary[]> => {
    let url = `${BASE_URL}/tasks/status`;
    const params = new URLSearchParams();
    
    if (projectId) params.append('projectId', projectId);
    if (timeRange) {
      params.append('start', timeRange.start);
      params.append('end', timeRange.end);
    }
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    const response = await api.get(url);
    return response.data;
  },

  // Team performance
  getTeamPerformance: async (timeRange?: TimeRange): Promise<TeamPerformance[]> => {
    let url = `${BASE_URL}/teams/performance`;
    if (timeRange) {
      url += `?start=${timeRange.start}&end=${timeRange.end}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // User performance
  getUserPerformance: async (teamId?: string, timeRange?: TimeRange): Promise<UserPerformance[]> => {
    let url = `${BASE_URL}/users/performance`;
    const params = new URLSearchParams();
    
    if (teamId) params.append('teamId', teamId);
    if (timeRange) {
      params.append('start', timeRange.start);
      params.append('end', timeRange.end);
    }
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
    
    const response = await api.get(url);
    return response.data;
  },

  // Project risks
  getProjectRisks: async (projectId?: string): Promise<ProjectRisk[]> => {
    let url = `${BASE_URL}/risks`;
    if (projectId) {
      url += `?projectId=${projectId}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Timeline events
  getTimelineEvents: async (timeRange?: TimeRange): Promise<TimelineEvent[]> => {
    let url = `${BASE_URL}/timeline`;
    if (timeRange) {
      url += `?start=${timeRange.start}&end=${timeRange.end}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Activity feed
  getActivityFeed: async (limit: number = 10): Promise<ActivityFeed[]> => {
    const response = await api.get(`${BASE_URL}/activity?limit=${limit}`);
    return response.data;
  },

  // Export reports
  exportProjectReport: async (projectId: string, format: 'pdf' | 'csv' | 'excel'): Promise<Blob> => {
    const response = await api.get(`${BASE_URL}/export/project/${projectId}?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  exportTeamReport: async (teamId: string, format: 'pdf' | 'csv' | 'excel'): Promise<Blob> => {
    const response = await api.get(`${BASE_URL}/export/team/${teamId}?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
