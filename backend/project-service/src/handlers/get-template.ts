import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { templateParamsSchema } from '../schemas/template';
import { templateService } from '../services/template';

type GetTemplateRequest = FastifyRequest<{
  Params: z.infer<typeof templateParamsSchema>;
}>;

export async function getTemplateHandler(
  request: GetTemplateRequest,
  reply: FastifyReply
) {
  const tenantId = request.headers['x-tenant-id'] as string;
  if (!tenantId) {
    return reply.status(400).send({ error: 'Tenant ID is required' });
  }

  const template = await templateService.getTemplateById(request.params.id, tenantId);
  if (!template) {
    return reply.status(404).send({ error: 'Template not found' });
  }
  return reply.send(template);
} 