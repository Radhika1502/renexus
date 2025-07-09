import { FastifyInstance } from 'fastify';
import { createTaskHandler } from '../handlers/create-task';
import { getTaskHandler } from '../handlers/get-task';
import { updateTaskHandler } from '../handlers/update-task';
import { deleteTaskHandler } from '../handlers/delete-task';
import { listTasksHandler } from '../handlers/list-tasks';
import { taskSchemas } from '../schemas/task';
import { assignmentRoutes } from './assignment';
import { schedulingRoutes } from './scheduling';
import { relationshipRoutes } from './relationship';

export async function taskRoutes(fastify: FastifyInstance) {
  // Register schemas
  for (const schema of taskSchemas) {
    fastify.addSchema(schema);
  }

  // Create task
  fastify.post('/', {
    schema: {
      tags: ['tasks'],
      summary: 'Create a new task',
      body: { $ref: 'createTaskSchema#' },
      response: {
        201: { $ref: 'taskResponseSchema#' },
      },
    },
    handler: createTaskHandler,
  });

  // Get task by ID
  fastify.get('/:id', {
    schema: {
      tags: ['tasks'],
      summary: 'Get a task by ID',
      params: { $ref: 'taskParamsSchema#' },
      response: {
        200: { $ref: 'taskResponseSchema#' },
      },
    },
    handler: getTaskHandler,
  });

  // Update task
  fastify.patch('/:id', {
    schema: {
      tags: ['tasks'],
      summary: 'Update a task',
      params: { $ref: 'taskParamsSchema#' },
      body: { $ref: 'updateTaskSchema#' },
      response: {
        200: { $ref: 'taskResponseSchema#' },
      },
    },
    handler: updateTaskHandler,
  });

  // Delete task
  fastify.delete('/:id', {
    schema: {
      tags: ['tasks'],
      summary: 'Delete a task',
      params: { $ref: 'taskParamsSchema#' },
      response: {
        204: {
          type: 'null',
          description: 'Task deleted successfully',
        },
      },
    },
    handler: deleteTaskHandler,
  });

  // List tasks
  fastify.get('/', {
    schema: {
      tags: ['tasks'],
      summary: 'List all tasks',
      querystring: { $ref: 'listTasksQuerySchema#' },
      response: {
        200: {
          type: 'array',
          items: { $ref: 'taskResponseSchema#' },
        },
      },
    },
    handler: listTasksHandler,
  });

  // Register assignment, scheduling, and relationship routes
  await fastify.register(assignmentRoutes);
  await fastify.register(schedulingRoutes);
  await fastify.register(relationshipRoutes);
} 