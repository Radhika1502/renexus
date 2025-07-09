import { FastifyInstance } from 'fastify';
import { addMemberHandler } from '../handlers/add-member';
import { updateMemberHandler } from '../handlers/update-member';
import { removeMemberHandler } from '../handlers/remove-member';
import { listMembersHandler } from '../handlers/list-members';
import { memberSchemas } from '../schemas/member';

export async function memberRoutes(fastify: FastifyInstance) {
  // Register schemas
  for (const schema of memberSchemas) {
    fastify.addSchema(schema);
  }

  // Add member to project
  fastify.post('/:projectId/members', {
    schema: {
      tags: ['members'],
      summary: 'Add a member to a project',
      params: { projectId: { type: 'string', format: 'uuid' } },
      body: { $ref: 'addMemberSchema#' },
      response: {
        201: { $ref: 'memberResponseSchema#' },
      },
    },
    handler: addMemberHandler,
  });

  // Update member role
  fastify.patch('/:projectId/members/:userId', {
    schema: {
      tags: ['members'],
      summary: 'Update a member\'s role in a project',
      params: { $ref: 'memberParamsSchema#' },
      body: { $ref: 'updateMemberSchema#' },
      response: {
        200: { $ref: 'memberResponseSchema#' },
      },
    },
    handler: updateMemberHandler,
  });

  // Remove member from project
  fastify.delete('/:projectId/members/:userId', {
    schema: {
      tags: ['members'],
      summary: 'Remove a member from a project',
      params: { $ref: 'memberParamsSchema#' },
      response: {
        204: {
          type: 'null',
          description: 'Member removed successfully',
        },
      },
    },
    handler: removeMemberHandler,
  });

  // List project members
  fastify.get('/:projectId/members', {
    schema: {
      tags: ['members'],
      summary: 'List all members of a project',
      params: { projectId: { type: 'string', format: 'uuid' } },
      querystring: { $ref: 'listMembersQuerySchema#' },
      response: {
        200: {
          type: 'array',
          items: { $ref: 'memberResponseSchema#' },
        },
      },
    },
    handler: listMembersHandler,
  });
} 