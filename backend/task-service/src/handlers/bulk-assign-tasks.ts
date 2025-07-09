import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { bulkAssignTasksSchema } from '../schemas/assignment';
import { taskService } from '../services/task';

type BulkAssignTasksRequest = FastifyRequest<{
  Body: z.infer<typeof bulkAssignTasksSchema>;
}>;

export async function bulkAssignTasksHandler(
  request: BulkAssignTasksRequest,
  reply: FastifyReply
) {
  const tasks = await taskService.bulkAssignTasks(
    request.body.taskIds,
    request.body.assigneeId
  );
  return reply.send(tasks);
} 