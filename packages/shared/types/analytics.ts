/**
 * Analytics Types
 * 
 * This file exports analytics related types
 */

export interface ProjectMetrics {
  projectId: string;
  taskCompletion: {
    total: number;
    completed: number;
    percentage: number;
  };
  timeTracking: {
    estimated: number;
    actual: number;
    variance: number;
  };
  teamPerformance: TeamMemberPerformance[];
  timeline: {
    onTrack: boolean;
    daysRemaining: number;
    completionTrend: number;
  };
}

export interface TeamMemberPerformance {
  userId: string;
  tasksAssigned: number;
  tasksCompleted: number;
  completionRate: number;
  avgCompletionTime: number;
}

export interface TaskAnalytics {
  taskId: string;
  timeToComplete?: number;
  statusChanges: StatusChange[];
  blockers: number;
  comments: number;
  revisions: number;
}

export interface StatusChange {
  from: string;
  to: string;
  timestamp: string;
}

export interface UserProductivity {
  userId: string;
  period: 'day' | 'week' | 'month';
  tasksCompleted: number;
  hoursLogged: number;
  efficiency: number;
  focusTime: number;
  breakTime: number;
}

export interface DashboardMetrics {
  activeProjects: number;
  completedProjects: number;
  tasksCreatedToday: number;
  tasksCompletedToday: number;
  upcomingDeadlines: number;
  overdueItems: number;
  teamUtilization: number;
}
