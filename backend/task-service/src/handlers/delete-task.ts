import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { taskParamsSchema } from '../schemas/task';
import { taskService } from '../services/task';

type DeleteTaskRequest = FastifyRequest<{
  Params: z.infer<typeof taskParamsSchema>;
}>;

export async function deleteTaskHandler(
  request: DeleteTaskRequest,
  reply: FastifyReply
) {
  await taskService.deleteTask(request.params.id);
  return reply.status(204).send();
} 