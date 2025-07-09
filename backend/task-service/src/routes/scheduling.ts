import { FastifyInstance } from 'fastify';
import { scheduleTaskHandler } from '../handlers/schedule-task';
import { bulkScheduleTasksHandler } from '../handlers/bulk-schedule-tasks';
import { listScheduledTasksHandler } from '../handlers/list-scheduled-tasks';
import { schedulingSchemas } from '../schemas/scheduling';
import { taskResponseSchema } from '../schemas/task';

export async function schedulingRoutes(fastify: FastifyInstance) {
  // Register schemas
  for (const schema of schedulingSchemas) {
    fastify.addSchema(schema);
  }

  // Schedule task
  fastify.patch('/:id/schedule', {
    schema: {
      tags: ['tasks', 'scheduling'],
      summary: 'Schedule a task',
      params: { id: { type: 'string', format: 'uuid' } },
      body: { $ref: 'scheduleTaskSchema#' },
      response: {
        200: { $ref: 'taskResponseSchema#' },
      },
    },
    handler: scheduleTaskHandler,
  });

  // Bulk schedule tasks
  fastify.patch('/bulk-schedule', {
    schema: {
      tags: ['tasks', 'scheduling'],
      summary: 'Schedule multiple tasks',
      body: { $ref: 'bulkScheduleTasksSchema#' },
      response: {
        200: {
          type: 'array',
          items: { $ref: 'taskResponseSchema#' },
        },
      },
    },
    handler: bulkScheduleTasksHandler,
  });

  // List scheduled tasks
  fastify.get('/scheduled', {
    schema: {
      tags: ['tasks', 'scheduling'],
      summary: 'List scheduled tasks',
      querystring: { $ref: 'listScheduledTasksQuerySchema#' },
      response: {
        200: {
          type: 'array',
          items: { $ref: 'taskResponseSchema#' },
        },
      },
    },
    handler: listScheduledTasksHandler,
  });
} 