import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createRelationshipSchema, relationshipParamsSchema } from '../schemas/relationship';
import { taskService } from '../services/task';

type CreateRelationshipRequest = FastifyRequest<{
  Params: z.infer<typeof relationshipParamsSchema>;
  Body: z.infer<typeof createRelationshipSchema>;
}>;

export async function createRelationshipHandler(
  request: CreateRelationshipRequest,
  reply: FastifyReply
) {
  const relationship = await taskService.createRelationship(
    request.params.sourceTaskId,
    request.params.targetTaskId,
    request.body.type
  );
  return reply.status(201).send(relationship);
} 