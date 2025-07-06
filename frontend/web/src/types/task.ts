/**
 * Task related types for the Renexus application
 */

import { TaskStatus } from '@shared/types/task-status';

export { TaskStatus };

export type TaskPriority = 'low' | 'medium' | 'high';

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
}

export interface TaskDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: DependencyType;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId?: string;
  assigneeId?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority?: TaskPriority;
  projectId?: string;
  assigneeId?: string;
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: string;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string[];
  projectId?: string;
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface TaskSort {
  field: 'title' | 'status' | 'priority' | 'dueDate' | 'createdAt' | 'updatedAt';
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

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  type: 'created' | 'updated' | 'commented' | 'status_changed' | 'assigned';
  data: Record<string, any>;
  createdAt: string;
}

/**
 * Task related types for the Renexus application
 */

import { TaskStatus } from '@shared/types/task-status';

export { TaskStatus };

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
}

export interface TaskDependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: DependencyType;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedTo: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  comments: Comment[];
}

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  assignedTo: string;
  projectId: string;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: 'todo' | 'in-progress' | 'completed' | 'blocked';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignedTo?: string;
  tags?: string[];
}

export interface TaskFilter {
  status?: 'todo' | 'in-progress' | 'completed' | 'blocked';
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  projectId?: string;
  dueDate?: string;
  tags?: string[];
}

export interface TaskSort {
  field: 'title' | 'dueDate' | 'priority' | 'status' | 'createdAt';
  order: 'asc' | 'desc';
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
