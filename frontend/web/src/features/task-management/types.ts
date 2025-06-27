// Task Management Types
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assignee?: User;
  reporterId: string;
  reporter?: User;
  projectId: string;
  projectKey?: string;
  epicId?: string;
  sprintId?: string;
  dueDate?: string;
  estimatedHours?: number;
  loggedHours?: number;
  labels: string[];
  attachments: Attachment[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author?: User;
  mentions?: User[];
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'backlog' | 'todo' | 'inProgress' | 'review' | 'done';

export type TaskPriority = 'lowest' | 'low' | 'medium' | 'high' | 'highest';

export interface TaskFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assigneeId?: string;
  reporterId?: string;
  projectId?: string;
  epicId?: string;
  sprintId?: string;
  search?: string;
  labels?: string[];
  dueDateStart?: string;
  dueDateEnd?: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  reporterId: string;
  projectId: string;
  epicId?: string;
  sprintId?: string;
  dueDate?: string;
  estimatedHours?: number;
  labels?: string[];
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  epicId?: string;
  sprintId?: string;
  dueDate?: string;
  estimatedHours?: number;
  labels?: string[];
}
