import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { listAssignedTasksQuerySchema } from '../schemas/assignment';
import { taskService } from '../services/task';

type ListAssignedTasksRequest = FastifyRequest<{
  Querystring: z.infer<typeof listAssignedTasksQuerySchema>;
}>;

export async function listAssignedTasksHandler(
  request: ListAssignedTasksRequest,
  reply: FastifyReply
) {
  const tasks = await taskService.listAssignedTasks(request.query);
  return reply.send(tasks);
} 