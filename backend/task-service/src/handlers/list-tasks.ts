import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { listTasksQuerySchema } from '../schemas/task';
import { taskService } from '../services/task';

type ListTasksRequest = FastifyRequest<{
  Querystring: z.infer<typeof listTasksQuerySchema>;
}>;

export async function listTasksHandler(
  request: ListTasksRequest,
  reply: FastifyReply
) {
  const tasks = await taskService.listTasks(request.query);
  return reply.send(tasks);
} 