/**
 * Task analytics types for the backend API
 */

/**
 * Filters for task analytics queries
 */
export interface TaskAnalyticsFilters {
  projectId?: string;
  taskId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

/**
 * Task metrics data
 */
export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksWithoutAssignee: number;
  completionRate: number;
  avgCompletionTime: number;
}

/**
 * User mention in comments
 */
export interface UserMention {
  id: string;
  text: string;
  createdAt: string;
  taskId: string;
  taskTitle: string;
  authorId: string;
  authorName: string;
  resolved: boolean;
}

/**
 * Complete task analytics response
 */
export interface TaskAnalyticsResponse {
  metrics: TaskMetrics;
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  completionTrend: Array<{ date: string; count: number }>;
  topContributors: Array<{ userId: string; userName: string; taskCount: number }>;
}
