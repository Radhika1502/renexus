import { FastifyInstance } from 'fastify';
import { createRelationshipHandler } from '../handlers/create-relationship';
import { deleteRelationshipHandler } from '../handlers/delete-relationship';
import { listRelationshipsHandler } from '../handlers/list-relationships';
import { relationshipSchemas } from '../schemas/relationship';

export async function relationshipRoutes(fastify: FastifyInstance) {
  // Register schemas
  for (const schema of relationshipSchemas) {
    fastify.addSchema(schema);
  }

  // Create relationship
  fastify.post('/:sourceTaskId/relationships/:targetTaskId', {
    schema: {
      tags: ['tasks', 'relationships'],
      summary: 'Create a relationship between two tasks',
      params: { $ref: 'relationshipParamsSchema#' },
      body: { $ref: 'createRelationshipSchema#' },
      response: {
        201: { $ref: 'relationshipResponseSchema#' },
      },
    },
    handler: createRelationshipHandler,
  });

  // Delete relationship
  fastify.delete('/:sourceTaskId/relationships/:targetTaskId', {
    schema: {
      tags: ['tasks', 'relationships'],
      summary: 'Delete a relationship between two tasks',
      params: { $ref: 'relationshipParamsSchema#' },
      response: {
        204: {
          type: 'null',
          description: 'Relationship deleted successfully',
        },
      },
    },
    handler: deleteRelationshipHandler,
  });

  // List relationships
  fastify.get('/:taskId/relationships', {
    schema: {
      tags: ['tasks', 'relationships'],
      summary: 'List relationships for a task',
      params: { taskId: { type: 'string', format: 'uuid' } },
      querystring: { $ref: 'listRelationshipsQuerySchema#' },
      response: {
        200: {
          type: 'array',
          items: { $ref: 'relationshipResponseSchema#' },
        },
      },
    },
    handler: listRelationshipsHandler,
  });
} 