import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createProjectSchema } from '../schemas/project';
import { projectService } from '../services/project';

type CreateProjectRequest = FastifyRequest<{
  Body: z.infer<typeof createProjectSchema>;
}>;

export async function createProjectHandler(
  request: CreateProjectRequest,
  reply: FastifyReply
) {
  const project = await projectService.createProject(request.body);
  return reply.status(201).send(project);
} 