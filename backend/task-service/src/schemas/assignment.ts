import { z } from 'zod';

// Assign task schema
export const assignTaskSchema = z.object({
  assigneeId: z.string().uuid(),
});

// Bulk assign tasks schema
export const bulkAssignTasksSchema = z.object({
  taskIds: z.array(z.string().uuid()),
  assigneeId: z.string().uuid(),
});

// List assigned tasks query schema
export const listAssignedTasksQuerySchema = z.object({
  assigneeId: z.string().uuid(),
  status: z.enum(['todo', 'in_progress', 'blocked', 'in_review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Export all schemas for Fastify
export const assignmentSchemas = [
  {
    $id: 'assignTaskSchema',
    schema: assignTaskSchema,
  },
  {
    $id: 'bulkAssignTasksSchema',
    schema: bulkAssignTasksSchema,
  },
  {
    $id: 'listAssignedTasksQuerySchema',
    schema: listAssignedTasksQuerySchema,
  },
]; 