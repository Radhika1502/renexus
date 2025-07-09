import { FastifyInstance } from 'fastify';
import { createProjectHandler } from '../handlers/create-project';
import { getProjectHandler } from '../handlers/get-project';
import { updateProjectHandler } from '../handlers/update-project';
import { deleteProjectHandler } from '../handlers/delete-project';
import { listProjectsHandler } from '../handlers/list-projects';
import { projectSchemas } from '../schemas/project';
import { memberRoutes } from './members';
import { templateRoutes } from './templates';

export async function projectRoutes(fastify: FastifyInstance) {
  // Register schemas
  for (const schema of projectSchemas) {
    fastify.addSchema(schema);
  }

  // Create project
  fastify.post('/', {
    schema: {
      tags: ['projects'],
      summary: 'Create a new project',
      body: { $ref: 'createProjectSchema#' },
      response: {
        201: { $ref: 'projectResponseSchema#' },
      },
    },
    handler: createProjectHandler,
  });

  // Get project by ID
  fastify.get('/:id', {
    schema: {
      tags: ['projects'],
      summary: 'Get a project by ID',
      params: { $ref: 'projectParamsSchema#' },
      response: {
        200: { $ref: 'projectResponseSchema#' },
      },
    },
    handler: getProjectHandler,
  });

  // Update project
  fastify.patch('/:id', {
    schema: {
      tags: ['projects'],
      summary: 'Update a project',
      params: { $ref: 'projectParamsSchema#' },
      body: { $ref: 'updateProjectSchema#' },
      response: {
        200: { $ref: 'projectResponseSchema#' },
      },
    },
    handler: updateProjectHandler,
  });

  // Delete project
  fastify.delete('/:id', {
    schema: {
      tags: ['projects'],
      summary: 'Delete a project',
      params: { $ref: 'projectParamsSchema#' },
      response: {
        204: {
          type: 'null',
          description: 'Project deleted successfully',
        },
      },
    },
    handler: deleteProjectHandler,
  });

  // List projects
  fastify.get('/', {
    schema: {
      tags: ['projects'],
      summary: 'List all projects',
      querystring: { $ref: 'listProjectsQuerySchema#' },
      response: {
        200: {
          type: 'array',
          items: { $ref: 'projectResponseSchema#' },
        },
      },
    },
    handler: listProjectsHandler,
  });

  // Register member routes
  await fastify.register(memberRoutes);
  
  // Register template routes
  await fastify.register(templateRoutes, { prefix: '/templates' });
} 