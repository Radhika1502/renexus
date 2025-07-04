export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  projectId: string;
  assigneeId?: string;
  estimatedHours?: number;
  dueDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  createdFromTemplate?: boolean;
}

export interface TimeLog {
  id: string;
  taskId: string;
  duration?: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  tasks?: Task[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  createdAt: Date;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedAt: Date;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  priority: string;
  estimatedHours?: number;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  fields: string;
} 