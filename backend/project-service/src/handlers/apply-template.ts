import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { applyTemplateSchema } from '../schemas/template';
import { templateService } from '../services/template';

type ApplyTemplateRequest = FastifyRequest<{
  Body: z.infer<typeof applyTemplateSchema>;
}>;

export async function applyTemplateHandler(
  request: ApplyTemplateRequest,
  reply: FastifyReply
) {
  const tenantId = request.headers['x-tenant-id'] as string;
  if (!tenantId) {
    return reply.status(400).send({ error: 'Tenant ID is required' });
  }

  const project = await templateService.applyTemplate({
    ...request.body,
    tenantId,
  });
  return reply.status(201).send(project);
} 