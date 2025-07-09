import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { listScheduledTasksQuerySchema } from '../schemas/scheduling';
import { taskService } from '../services/task';

type ListScheduledTasksRequest = FastifyRequest<{
  Querystring: z.infer<typeof listScheduledTasksQuerySchema>;
}>;

export async function listScheduledTasksHandler(
  request: ListScheduledTasksRequest,
  reply: FastifyReply
) {
  const tasks = await taskService.listScheduledTasks(request.query);
  return reply.send(tasks);
} 