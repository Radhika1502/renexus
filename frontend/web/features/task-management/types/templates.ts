import { TaskPriority, TaskStatus } from './index';

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  icon?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours?: number;
  labels?: string[];
  customFields?: TaskTemplateCustomField[];
  subtasks?: TaskTemplateSubtask[];
  createdBy: string;
  projectId?: string;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskTemplateCustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox';
  options?: string[];
  defaultValue?: any;
  required?: boolean;
}

export interface TaskTemplateSubtask {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number;
}

export interface CreateTaskTemplateInput {
  name: string;
  description: string;
  icon?: string;
  status: TaskStatus;
  priority: TaskPriority;
  estimatedHours?: number;
  labels?: string[];
  customFields?: Omit<TaskTemplateCustomField, 'id'>[];
  subtasks?: TaskTemplateSubtask[];
  projectId?: string;
  isGlobal: boolean;
}

export interface UpdateTaskTemplateInput {
  id: string;
  name?: string;
  description?: string;
  icon?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  estimatedHours?: number;
  labels?: string[];
  customFields?: Omit<TaskTemplateCustomField, 'id'>[];
  subtasks?: TaskTemplateSubtask[];
  isGlobal?: boolean;
}
