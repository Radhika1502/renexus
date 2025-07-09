import { FastifyInstance } from 'fastify';
import { assignTaskHandler } from '../handlers/assign-task';
import { bulkAssignTasksHandler } from '../handlers/bulk-assign-tasks';
import { listAssignedTasksHandler } from '../handlers/list-assigned-tasks';
import { assignmentSchemas } from '../schemas/assignment';
import { taskResponseSchema } from '../schemas/task';

export async function assignmentRoutes(fastify: FastifyInstance) {
  // Register schemas
  for (const schema of assignmentSchemas) {
    fastify.addSchema(schema);
  }

  // Assign task
  fastify.patch('/:id/assign', {
    schema: {
      tags: ['tasks', 'assignment'],
      summary: 'Assign a task to a user',
      params: { id: { type: 'string', format: 'uuid' } },
      body: { $ref: 'assignTaskSchema#' },
      response: {
        200: { $ref: 'taskResponseSchema#' },
      },
    },
    handler: assignTaskHandler,
  });

  // Bulk assign tasks
  fastify.patch('/bulk-assign', {
    schema: {
      tags: ['tasks', 'assignment'],
      summary: 'Assign multiple tasks to a user',
      body: { $ref: 'bulkAssignTasksSchema#' },
      response: {
        200: {
          type: 'array',
          items: { $ref: 'taskResponseSchema#' },
        },
      },
    },
    handler: bulkAssignTasksHandler,
  });

  // List assigned tasks
  fastify.get('/assigned', {
    schema: {
      tags: ['tasks', 'assignment'],
      summary: 'List tasks assigned to a user',
      querystring: { $ref: 'listAssignedTasksQuerySchema#' },
      response: {
        200: {
          type: 'array',
          items: { $ref: 'taskResponseSchema#' },
        },
      },
    },
    handler: listAssignedTasksHandler,
  });
} 