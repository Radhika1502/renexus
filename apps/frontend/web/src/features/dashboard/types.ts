export interface ProjectSummary {
  id: string;
  name: string;
  status: string;
  progress: number;
  tasksTotal: number;
  tasksCompleted: number;
  teamSize: number;
  dueDate?: string;
}

export interface TaskStatusSummary {
  status: string;
  count: number;
  percentage: number;
}

export interface TeamPerformance {
  teamId: string;
  teamName: string;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  averageTaskCompletionTime: number; // in hours
  onTimeDeliveryRate: number;
}

export interface UserPerformance {
  userId: string;
  userName: string;
  avatar?: string;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  averageTaskCompletionTime: number; // in hours
}

export interface ProjectRisk {
  id: string;
  projectId: string;
  projectName: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'IDENTIFIED' | 'MITIGATING' | 'RESOLVED';
  identifiedAt: string;
  resolvedAt?: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  type: 'MILESTONE' | 'DEADLINE' | 'SPRINT_START' | 'SPRINT_END' | 'OTHER';
  projectId: string;
  projectName: string;
  completed: boolean;
}

export interface ActivityFeed {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  entityType: 'TASK' | 'PROJECT' | 'SPRINT' | 'TEAM' | 'COMMENT';
  entityId: string;
  entityName: string;
  timestamp: string;
}

export interface DashboardSummary {
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  upcomingDeadlines: number;
  teamMembers: number;
  recentActivities: ActivityFeed[];
}

export interface ProjectMetrics {
  projectId: string;
  projectName: string;
  burndownData: {
    date: string;
    remainingTasks: number;
    idealLine: number;
  }[];
  tasksByStatus: TaskStatusSummary[];
  tasksByAssignee: {
    userId: string;
    userName: string;
    taskCount: number;
  }[];
  taskCompletionTrend: {
    date: string;
    completed: number;
  }[];
}

export interface TimeRange {
  start: string;
  end: string;
}
