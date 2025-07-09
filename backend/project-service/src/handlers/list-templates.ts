import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { listTemplatesQuerySchema } from '../schemas/template';
import { templateService } from '../services/template';

type ListTemplatesRequest = FastifyRequest<{
  Querystring: z.infer<typeof listTemplatesQuerySchema>;
}>;

export async function listTemplatesHandler(
  request: ListTemplatesRequest,
  reply: FastifyReply
) {
  const tenantId = request.headers['x-tenant-id'] as string;
  if (!tenantId) {
    return reply.status(400).send({ error: 'Tenant ID is required' });
  }

  const templates = await templateService.listTemplates({
    ...request.query,
    tenantId,
  });
  return reply.send(templates);
} 