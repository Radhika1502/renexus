import { z } from 'zod';

// Base task schema
const taskSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'blocked', 'in_review', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.coerce.date().optional(),
  estimatedHours: z.number().min(0).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// Create task schema
export const createTaskSchema = taskSchema
  .omit({ id: true, createdAt: true, updatedAt: true });

// Update task schema
export const updateTaskSchema = taskSchema
  .omit({ id: true, projectId: true, createdAt: true, updatedAt: true })
  .partial();

// Task params schema
export const taskParamsSchema = z.object({
  id: z.string().uuid(),
});

// List tasks query schema
export const listTasksQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  status: taskSchema.shape.status.optional(),
  priority: taskSchema.shape.priority.optional(),
  assigneeId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Task response schema
export const taskResponseSchema = taskSchema;

// Export all schemas for Fastify
export const taskSchemas = [
  {
    $id: 'createTaskSchema',
    schema: createTaskSchema,
  },
  {
    $id: 'updateTaskSchema',
    schema: updateTaskSchema,
  },
  {
    $id: 'taskParamsSchema',
    schema: taskParamsSchema,
  },
  {
    $id: 'listTasksQuerySchema',
    schema: listTasksQuerySchema,
  },
  {
    $id: 'taskResponseSchema',
    schema: taskResponseSchema,
  },
]; 