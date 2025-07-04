import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../api/dashboardService';
import { TimeRange } from '../types';

// Query keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
  projects: () => [...dashboardKeys.all, 'projects'] as const,
  projectList: (filters: { timeRange?: TimeRange }) => 
    [...dashboardKeys.projects(), 'list', filters] as const,
  projectMetrics: (projectId: string, filters: { timeRange?: TimeRange }) => 
    [...dashboardKeys.projects(), projectId, 'metrics', filters] as const,
  tasks: () => [...dashboardKeys.all, 'tasks'] as const,
  taskStatus: (filters: { projectId?: string, timeRange?: TimeRange }) => 
    [...dashboardKeys.tasks(), 'status', filters] as const,
  teams: () => [...dashboardKeys.all, 'teams'] as const,
  teamPerformance: (filters: { timeRange?: TimeRange }) => 
    [...dashboardKeys.teams(), 'performance', filters] as const,
  users: () => [...dashboardKeys.all, 'users'] as const,
  userPerformance: (filters: { teamId?: string, timeRange?: TimeRange }) => 
    [...dashboardKeys.users(), 'performance', filters] as const,
  risks: (filters: { projectId?: string }) => 
    [...dashboardKeys.all, 'risks', filters] as const,
  timeline: (filters: { timeRange?: TimeRange }) => 
    [...dashboardKeys.all, 'timeline', filters] as const,
  activity: (limit: number) => 
    [...dashboardKeys.all, 'activity', { limit }] as const,
};

// Hooks for fetching dashboard data
export const useDashboardSummary = () => {
  return useQuery(
    dashboardKeys.summary(),
    () => dashboardService.getDashboardSummary(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
    }
  );
};

export const useProjectSummaries = (timeRange?: TimeRange) => {
  return useQuery(
    dashboardKeys.projectList({ timeRange }),
    () => dashboardService.getProjectSummaries(timeRange),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

export const useProjectMetrics = (projectId: string, timeRange?: TimeRange) => {
  return useQuery(
    dashboardKeys.projectMetrics(projectId, { timeRange }),
    () => dashboardService.getProjectMetrics(projectId, timeRange),
    {
      enabled: Boolean(projectId),
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

export const useTaskStatusSummary = (projectId?: string, timeRange?: TimeRange) => {
  return useQuery(
    dashboardKeys.taskStatus({ projectId, timeRange }),
    () => dashboardService.getTaskStatusSummary(projectId, timeRange),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
};

export const useTeamPerformance = (timeRange?: TimeRange) => {
  return useQuery(
    dashboardKeys.teamPerformance({ timeRange }),
    () => dashboardService.getTeamPerformance(timeRange),
    {
      staleTime: 15 * 60 * 1000, // 15 minutes
    }
  );
};

export const useUserPerformance = (teamId?: string, timeRange?: TimeRange) => {
  return useQuery(
    dashboardKeys.userPerformance({ teamId, timeRange }),
    () => dashboardService.getUserPerformance(teamId, timeRange),
    {
      staleTime: 15 * 60 * 1000, // 15 minutes
    }
  );
};

export const useProjectRisks = (projectId?: string) => {
  return useQuery(
    dashboardKeys.risks({ projectId }),
    () => dashboardService.getProjectRisks(projectId),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useTimelineEvents = (timeRange?: TimeRange) => {
  return useQuery(
    dashboardKeys.timeline({ timeRange }),
    () => dashboardService.getTimelineEvents(timeRange),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useActivityFeed = (limit: number = 10) => {
  return useQuery(
    dashboardKeys.activity(limit),
    () => dashboardService.getActivityFeed(limit),
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );
};
