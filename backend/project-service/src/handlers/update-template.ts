import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { templateParamsSchema, updateTemplateSchema } from '../schemas/template';
import { templateService } from '../services/template';

type UpdateTemplateRequest = FastifyRequest<{
  Params: z.infer<typeof templateParamsSchema>;
  Body: z.infer<typeof updateTemplateSchema>;
}>;

export async function updateTemplateHandler(
  request: UpdateTemplateRequest,
  reply: FastifyReply
) {
  const tenantId = request.headers['x-tenant-id'] as string;
  if (!tenantId) {
    return reply.status(400).send({ error: 'Tenant ID is required' });
  }

  const template = await templateService.updateTemplate(
    request.params.id,
    tenantId,
    request.body
  );
  return reply.send(template);
} 