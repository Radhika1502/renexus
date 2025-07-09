import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createTaskSchema } from '../schemas/task';
import { taskService } from '../services/task';

type CreateTaskRequest = FastifyRequest<{
  Body: z.infer<typeof createTaskSchema>;
}>;

export async function createTaskHandler(
  request: CreateTaskRequest,
  reply: FastifyReply
) {
  const task = await taskService.createTask(request.body);
  return reply.status(201).send(task);
} 