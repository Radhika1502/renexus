/**
 * Task related types for the Renexus application
 */

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'in_review' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type DependencyType = 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
  updatedAt?: string;
  mentions?: string[]; // User IDs mentioned in the comment
}

export interface TaskDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: DependencyType;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assignee?: User;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  startDate: string;
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress?: number; // 0-100
  tags?: string[];
  attachments?: Attachment[];
  comments?: Comment[];
  dependencies?: TaskDependency[];
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
  subtasks?: SubTask[];
}

export interface SubTask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  thumbnailUrl?: string;
  version: number;
  previousVersions?: {
    version: number;
    url: string;
    updatedAt: string;
    updatedBy: string;
  }[];
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number; // Every X days/weeks/months/years
  endDate?: string;
  endAfterOccurrences?: number;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  dayOfMonth?: number;
  monthOfYear?: number;
  weekOfMonth?: number; // 1 = first, 2 = second, etc.
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string[];
  tags?: string[];
  dueDateStart?: string;
  dueDateEnd?: string;
  createdDateStart?: string;
  createdDateEnd?: string;
  searchTerm?: string;
}

export interface TaskSortOptions {
  field: keyof Task | 'assigneeName';
  direction: 'asc' | 'desc';
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  upcomingTasks: number;
  statusBreakdown: Record<TaskStatus, number>;
  priorityBreakdown: Record<TaskPriority, number>;
  completionTrend: {
    date: string;
    completed: number;
    created: number;
  }[];
  averageCompletionTime: number; // in hours
}

export interface CriticalPathTask {
  task: Task;
  earliestStart: number;
  earliestFinish: number;
  latestStart: number;
  latestFinish: number;
  slack: number;
  isCritical: boolean;
}

export interface CriticalPathAnalysis {
  criticalTasks: CriticalPathTask[];
  projectDuration: number; // in days
  criticalPathDuration: number; // in days
  slackTasks: CriticalPathTask[];
}

export interface TaskDependencyGraph {
  nodes: {
    id: string;
    label: string;
    data: Task;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    label: string;
    data: TaskDependency;
  }[];
}

export interface ResourceAllocation {
  userId: string;
  user: User;
  allocatedTasks: Task[];
  totalEstimatedHours: number;
  totalActualHours: number;
  utilization: number; // 0-100%
  overallocation: boolean;
}

export interface WorkloadAnalysis {
  resources: ResourceAllocation[];
  overallocatedResources: number;
  underallocatedResources: number;
  balanceScore: number; // 0-100%
  recommendations: {
    taskId: string;
    currentAssigneeId: string;
    recommendedAssigneeId: string;
    reason: string;
  }[];
}
