import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { projectParamsSchema } from '../schemas/project';
import { projectService } from '../services/project';

type GetProjectRequest = FastifyRequest<{
  Params: z.infer<typeof projectParamsSchema>;
}>;

export async function getProjectHandler(
  request: GetProjectRequest,
  reply: FastifyReply
) {
  const tenantId = request.headers['x-tenant-id'] as string;
  if (!tenantId) {
    return reply.status(400).send({ error: 'Tenant ID is required' });
  }

  const project = await projectService.getProjectById(request.params.id, tenantId);
  if (!project) {
    return reply.status(404).send({ error: 'Project not found' });
  }
  return reply.send(project);
} 