import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { bulkScheduleTasksSchema } from '../schemas/scheduling';
import { taskService } from '../services/task';

type BulkScheduleTasksRequest = FastifyRequest<{
  Body: z.infer<typeof bulkScheduleTasksSchema>;
}>;

export async function bulkScheduleTasksHandler(
  request: BulkScheduleTasksRequest,
  reply: FastifyReply
) {
  const tasks = await taskService.bulkScheduleTasks(
    request.body.taskIds,
    {
      dueDate: request.body.dueDate,
      estimatedHours: request.body.estimatedHours,
    }
  );
  return reply.send(tasks);
} 