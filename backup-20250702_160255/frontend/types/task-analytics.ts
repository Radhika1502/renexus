/**
 * Task Analytics Type Definitions
 */

export interface TaskMetrics {
  id: string;
  taskId: string;
  taskName: string;
  status: TaskStatus;
  assignee: string;
  assigneeId: string;
  createdDate: string;
  dueDate: string | null;
  completedDate: string | null;
  priority: TaskPriority;
  completionTime: number | null; // in hours
  tags: string[];
  category: string;
  mentions: string[];
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskAnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
  tasksByAssignee: Record<string, number>;
  tasksByCategory: Record<string, number>;
}

export interface TaskTrend {
  date: string;
  created: number;
  completed: number;
  active: number;
}

export interface TaskAnalyticsFilters {
  startDate?: string;
  endDate?: string;
  assignees?: string[];
  statuses?: TaskStatus[];
  priorities?: TaskPriority[];
  categories?: string[];
  tags?: string[];
}

export interface TaskAnalyticsResponse {
  summary: TaskAnalyticsSummary;
  tasks: TaskMetrics[];
  trends: TaskTrend[];
}

export interface UserMention {
  userId: string;
  username: string;
  taskId: string;
  taskName: string;
  mentionedBy: string;
  mentionedById: string;
  mentionedAt: string;
  resolved: boolean;
  resolvedAt?: string;
}
