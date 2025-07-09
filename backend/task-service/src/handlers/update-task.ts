import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { taskParamsSchema, updateTaskSchema } from '../schemas/task';
import { taskService } from '../services/task';

type UpdateTaskRequest = FastifyRequest<{
  Params: z.infer<typeof taskParamsSchema>;
  Body: z.infer<typeof updateTaskSchema>;
}>;

export async function updateTaskHandler(
  request: UpdateTaskRequest,
  reply: FastifyReply
) {
  const task = await taskService.updateTask(
    request.params.id,
    request.body
  );
  return reply.send(task);
} 