import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { scheduleTaskSchema } from '../schemas/scheduling';
import { taskService } from '../services/task';

type ScheduleTaskRequest = FastifyRequest<{
  Params: { id: string };
  Body: z.infer<typeof scheduleTaskSchema>;
}>;

export async function scheduleTaskHandler(
  request: ScheduleTaskRequest,
  reply: FastifyReply
) {
  const task = await taskService.scheduleTask(
    request.params.id,
    request.body
  );
  return reply.send(task);
} 