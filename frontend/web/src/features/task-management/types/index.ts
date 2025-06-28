import { User } from '../../team-management/types';
import { Project } from '../../project-management/types';

export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  ARCHIVED = 'ARCHIVED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface TaskLabel {
  id: string;
  name: string;
  color: string;
}

export interface TaskCustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox';
  value: any;
  options?: string[];
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  type: 'blocks' | 'blocked_by' | 'related';
}

export interface TaskTimeTracking {
  id: string;
  taskId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  description?: string;
}

export interface TaskEstimate {
  originalEstimate: number; // in minutes
  remainingEstimate: number; // in minutes
  timeSpent: number; // in minutes
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  assignees: User[];
  reporter: User;
  projectId: string;
  project?: Project;
  parentTaskId?: string;
  parentTask?: Task;
  subtasks?: Task[];
  labels?: TaskLabel[];
  attachments?: number;
  comments?: number;
  customFields?: TaskCustomField[];
  dependencies?: TaskDependency[];
  timeTracking?: TaskEstimate;
  timeEntries?: TaskTimeTracking[];
  watchers?: User[];
  position?: number; // For ordering within a status column
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  startDate?: string;
  assigneeIds?: string[];
  projectId: string;
  parentTaskId?: string;
  labelIds?: string[];
  customFields?: Record<string, any>;
  position?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  startDate?: string;
  assigneeIds?: string[];
  projectId?: string;
  parentTaskId?: string | null;
  labelIds?: string[];
  customFields?: Record<string, any>;
  position?: number;
}

export interface BulkUpdateTasksDto {
  taskIds: string[];
  updates: {
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string | null;
    assigneeIds?: string[];
    labelIds?: string[];
  };
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeIds?: string[];
  labelIds?: string[];
  dueDate?: {
    from?: string;
    to?: string;
  };
  search?: string;
  parentTaskId?: string | null;
  hasSubtasks?: boolean;
}

export interface SavedFilter {
  id: string;
  name: string;
  filter: TaskFilter;
  isDefault?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  tasks: CreateTaskDto[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskView {
  id: string;
  name: string;
  type: 'board' | 'list' | 'calendar' | 'gantt';
  filter: TaskFilter;
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  groupBy?: 'status' | 'assignee' | 'priority' | 'label' | null;
  isDefault?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
