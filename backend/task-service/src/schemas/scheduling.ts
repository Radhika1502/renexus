import { z } from 'zod';

// Schedule task schema
export const scheduleTaskSchema = z.object({
  dueDate: z.coerce.date(),
  estimatedHours: z.number().min(0).optional(),
});

// Bulk schedule tasks schema
export const bulkScheduleTasksSchema = z.object({
  taskIds: z.array(z.string().uuid()),
  dueDate: z.coerce.date(),
  estimatedHours: z.number().min(0).optional(),
});

// List scheduled tasks query schema
export const listScheduledTasksQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  assigneeId: z.string().uuid().optional(),
  status: z.enum(['todo', 'in_progress', 'blocked', 'in_review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Export all schemas for Fastify
export const schedulingSchemas = [
  {
    $id: 'scheduleTaskSchema',
    schema: scheduleTaskSchema,
  },
  {
    $id: 'bulkScheduleTasksSchema',
    schema: bulkScheduleTasksSchema,
  },
  {
    $id: 'listScheduledTasksQuerySchema',
    schema: listScheduledTasksQuerySchema,
  },
]; 