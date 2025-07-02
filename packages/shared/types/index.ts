/**
 * Shared Types
 * 
 * This file exports common TypeScript types used across the monorepo
 */

// User related types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'admin' | 'manager' | 'member' | 'guest';

// Project related types
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  ownerId: string;
  teamIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

// Task related types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  parentTaskId?: string;
  dependencyIds?: string[];
  attachmentIds?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  timestamp: string;
}

// Offline sync types
export interface OfflineChange {
  id: string;
  entityType: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
}

export interface SyncResult {
  success: boolean;
  totalChanges: number;
  successfulChanges: number;
  failedChanges: number;
  errors?: any[];
  timestamp: string;
}

// Export all types
export * from './auth';
export * from './notifications';
export * from './analytics';

// These are placeholder exports that would be defined in separate files
export * as auth from './auth';
export * as notifications from './notifications';
export * as analytics from './analytics';
