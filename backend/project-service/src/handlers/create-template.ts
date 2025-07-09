import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createTemplateSchema } from '../schemas/template';
import { templateService } from '../services/template';

type CreateTemplateRequest = FastifyRequest<{
  Body: z.infer<typeof createTemplateSchema>;
}>;

export async function createTemplateHandler(
  request: CreateTemplateRequest,
  reply: FastifyReply
) {
  const tenantId = request.headers['x-tenant-id'] as string;
  if (!tenantId) {
    return reply.status(400).send({ error: 'Tenant ID is required' });
  }

  const template = await templateService.createFromProject({
    ...request.body,
    tenantId,
  });
  return reply.status(201).send(template);
} 