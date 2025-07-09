import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { projectParamsSchema } from '../schemas/project';
import { projectService } from '../services/project';

type DeleteProjectRequest = FastifyRequest<{
  Params: z.infer<typeof projectParamsSchema>;
}>;

export async function deleteProjectHandler(
  request: DeleteProjectRequest,
  reply: FastifyReply
) {
  const tenantId = request.headers['x-tenant-id'] as string;
  if (!tenantId) {
    return reply.status(400).send({ error: 'Tenant ID is required' });
  }

  await projectService.deleteProject(request.params.id, tenantId);
  return reply.status(204).send();
} 