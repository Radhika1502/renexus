import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { listRelationshipsQuerySchema } from '../schemas/relationship';
import { taskService } from '../services/task';

type ListRelationshipsRequest = FastifyRequest<{
  Params: { taskId: string };
  Querystring: z.infer<typeof listRelationshipsQuerySchema>;
}>;

export async function listRelationshipsHandler(
  request: ListRelationshipsRequest,
  reply: FastifyReply
) {
  const relationships = await taskService.listRelationships(
    request.params.taskId,
    request.query
  );
  return reply.send(relationships);
} 