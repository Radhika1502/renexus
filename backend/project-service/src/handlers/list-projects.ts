import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { listProjectsQuerySchema } from '../schemas/project';
import { projectService } from '../services/project';

type ListProjectsRequest = FastifyRequest<{
  Querystring: z.infer<typeof listProjectsQuerySchema>;
}>;

export async function listProjectsHandler(
  request: ListProjectsRequest,
  reply: FastifyReply
) {
  const tenantId = request.headers['x-tenant-id'] as string;
  if (!tenantId) {
    return reply.status(400).send({ error: 'Tenant ID is required' });
  }

  const projects = await projectService.listProjects({
    ...request.query,
    tenantId,
  });
  return reply.send(projects);
} 