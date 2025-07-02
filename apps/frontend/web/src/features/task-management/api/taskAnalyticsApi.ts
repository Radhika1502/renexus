// Base API URL
const API_URL = '/api/analytics/tasks';

// Type for date range
export type DateRange = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

// Interface for task analytics summary
export interface TaskAnalyticsSummary {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  backlogTasks: number;
  averageCompletionTime: number; // in days
  dateRange: DateRange;
}

// Interface for tasks by status
export interface TasksByStatus {
  dateRange: DateRange;
  data: Array<{
    status: string;
    count: number;
  }>;
}

// Interface for tasks by priority
export interface TasksByPriority {
  dateRange: DateRange;
  data: Array<{
    priority: string;
    count: number;
  }>;
}

// Interface for task velocity
export interface TaskVelocity {
  dateRange: DateRange;
  data: Array<{
    date: string;
    completed: number;
  }>;
  averageVelocity: number;
}

/**
 * Get task analytics summary
 * @param dateRange Optional date range filter
 * @returns Task analytics summary
 */
export const getTaskAnalytics = async (dateRange: DateRange = 'week'): Promise<TaskAnalyticsSummary> => {
  const response = await fetch(`${API_URL}/summary?dateRange=${dateRange}`);

  if (!response.ok) {
    throw new Error(`Failed to get task analytics: ${response.status}`);
  }

  return response.json();
};

/**
 * Get tasks grouped by status
 * @param dateRange Optional date range filter
 * @returns Tasks by status data
 */
export const getTasksByStatus = async (dateRange: DateRange = 'week'): Promise<TasksByStatus> => {
  const response = await fetch(`${API_URL}/by-status?dateRange=${dateRange}`);

  if (!response.ok) {
    throw new Error(`Failed to get tasks by status: ${response.status}`);
  }

  return response.json();
};

/**
 * Get tasks grouped by priority
 * @param dateRange Optional date range filter
 * @returns Tasks by priority data
 */
export const getTasksByPriority = async (dateRange: DateRange = 'week'): Promise<TasksByPriority> => {
  const response = await fetch(`${API_URL}/by-priority?dateRange=${dateRange}`);

  if (!response.ok) {
    throw new Error(`Failed to get tasks by priority: ${response.status}`);
  }

  return response.json();
};

/**
 * Get task completion velocity over time
 * @param dateRange Optional date range filter
 * @returns Task velocity data
 */
export const getTaskVelocity = async (dateRange: DateRange = 'week'): Promise<TaskVelocity> => {
  const response = await fetch(`${API_URL}/velocity?dateRange=${dateRange}`);

  if (!response.ok) {
    throw new Error(`Failed to get task velocity: ${response.status}`);
  }

  return response.json();
};
