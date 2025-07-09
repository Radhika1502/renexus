import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { projectParamsSchema, updateProjectSchema } from '../schemas/project';
import { projectService } from '../services/project';

type UpdateProjectRequest = FastifyRequest<{
  Params: z.infer<typeof projectParamsSchema>;
  Body: z.infer<typeof updateProjectSchema>;
}>;

export async function updateProjectHandler(
  request: UpdateProjectRequest,
  reply: FastifyReply
) {
  const tenantId = request.headers['x-tenant-id'] as string;
  if (!tenantId) {
    return reply.status(400).send({ error: 'Tenant ID is required' });
  }

  const project = await projectService.updateProject(
    request.params.id,
    tenantId,
    request.body
  );
  return reply.send(project);
} 