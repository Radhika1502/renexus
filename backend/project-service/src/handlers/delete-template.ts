import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { templateParamsSchema } from '../schemas/template';
import { templateService } from '../services/template';

type DeleteTemplateRequest = FastifyRequest<{
  Params: z.infer<typeof templateParamsSchema>;
}>;

export async function deleteTemplateHandler(
  request: DeleteTemplateRequest,
  reply: FastifyReply
) {
  const tenantId = request.headers['x-tenant-id'] as string;
  if (!tenantId) {
    return reply.status(400).send({ error: 'Tenant ID is required' });
  }

  await templateService.deleteTemplate(request.params.id, tenantId);
  return reply.status(204).send();
} 