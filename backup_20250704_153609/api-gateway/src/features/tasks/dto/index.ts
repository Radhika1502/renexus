import { Prisma } from '@prisma/client';

export type TaskDto = {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: Date;
  assigneeId?: string;
  projectId?: string;
  estimatedHours?: number;
  createdFromTemplate?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskDependencyDto = {
  id: string;
  taskId: string;
  dependsOnTaskId: string;
  createdAt: Date;
};

export type TaskAttachmentDto = {
  id: string;
  taskId: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  createdAt: Date;
};

export type TimeLogDto = {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  startTime: Date;
  endTime?: Date | null;
  duration?: number | null;
  notes?: string | null;
  createdAt: Date;
};

export type TaskTemplateDto = {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  priority?: string;
  estimatedHours?: number;
  category?: string;
  fields: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateTimeEntryDto = {
  userId: string;
  userName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  notes?: string;
};
