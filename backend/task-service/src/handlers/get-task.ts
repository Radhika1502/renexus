import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { taskParamsSchema } from '../schemas/task';
import { taskService } from '../services/task';

type GetTaskRequest = FastifyRequest<{
  Params: z.infer<typeof taskParamsSchema>;
}>;

export async function getTaskHandler(
  request: GetTaskRequest,
  reply: FastifyReply
) {
  const task = await taskService.getTask(request.params.id);
  return reply.send(task);
} 