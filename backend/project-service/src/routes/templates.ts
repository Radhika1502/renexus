import { FastifyInstance } from 'fastify';
import { createTemplateHandler } from '../handlers/create-template';
import { getTemplateHandler } from '../handlers/get-template';
import { updateTemplateHandler } from '../handlers/update-template';
import { deleteTemplateHandler } from '../handlers/delete-template';
import { listTemplatesHandler } from '../handlers/list-templates';
import { applyTemplateHandler } from '../handlers/apply-template';
import { templateSchemas } from '../schemas/template';

export async function templateRoutes(fastify: FastifyInstance) {
  // Register schemas
  for (const schema of templateSchemas) {
    fastify.addSchema(schema);
  }

  // Create template
  fastify.post('/', {
    schema: {
      tags: ['templates'],
      summary: 'Create a new project template',
      body: { $ref: 'createTemplateSchema#' },
      response: {
        201: { $ref: 'templateResponseSchema#' },
      },
    },
    handler: createTemplateHandler,
  });

  // Get template by ID
  fastify.get('/:id', {
    schema: {
      tags: ['templates'],
      summary: 'Get a template by ID',
      params: { $ref: 'templateParamsSchema#' },
      response: {
        200: { $ref: 'templateResponseSchema#' },
      },
    },
    handler: getTemplateHandler,
  });

  // Update template
  fastify.patch('/:id', {
    schema: {
      tags: ['templates'],
      summary: 'Update a template',
      params: { $ref: 'templateParamsSchema#' },
      body: { $ref: 'updateTemplateSchema#' },
      response: {
        200: { $ref: 'templateResponseSchema#' },
      },
    },
    handler: updateTemplateHandler,
  });

  // Delete template
  fastify.delete('/:id', {
    schema: {
      tags: ['templates'],
      summary: 'Delete a template',
      params: { $ref: 'templateParamsSchema#' },
      response: {
        204: {
          type: 'null',
          description: 'Template deleted successfully',
        },
      },
    },
    handler: deleteTemplateHandler,
  });

  // List templates
  fastify.get('/', {
    schema: {
      tags: ['templates'],
      summary: 'List all templates',
      querystring: { $ref: 'listTemplatesQuerySchema#' },
      response: {
        200: {
          type: 'array',
          items: { $ref: 'templateResponseSchema#' },
        },
      },
    },
    handler: listTemplatesHandler,
  });

  // Apply template to create project
  fastify.post('/:id/apply', {
    schema: {
      tags: ['templates'],
      summary: 'Apply a template to create a new project',
      params: { $ref: 'templateParamsSchema#' },
      body: { $ref: 'applyTemplateSchema#' },
      response: {
        201: {
          type: 'object',
          description: 'Created project from template',
        },
      },
    },
    handler: applyTemplateHandler,
  });
} 