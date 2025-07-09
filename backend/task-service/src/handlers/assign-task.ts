import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { assignTaskSchema } from '../schemas/assignment';
import { taskService } from '../services/task';

type AssignTaskRequest = FastifyRequest<{
  Params: { id: string };
  Body: z.infer<typeof assignTaskSchema>;
}>;

export async function assignTaskHandler(
  request: AssignTaskRequest,
  reply: FastifyReply
) {
  const task = await taskService.assignTask(
    request.params.id,
    request.body.assigneeId
  );
  return reply.send(task);
} 