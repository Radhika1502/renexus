import { eq, and, like, desc, between, or } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { tasks, taskRelationships } from '@renexus/database/schema';
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from '../schemas/task';
import { listAssignedTasksQuerySchema } from '../schemas/assignment';
import { listScheduledTasksQuerySchema, scheduleTaskSchema } from '../schemas/scheduling';
import { listRelationshipsQuerySchema } from '../schemas/relationship';
import { logger } from '../utils/logger';

export class TaskService {
  async createTask(data: z.infer<typeof createTaskSchema>) {
    logger.debug('Creating task:', data);

    const [task] = await db.insert(tasks)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return task;
  }

  async getTask(id: string) {
    logger.debug('Getting task:', { id });

    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, id),
    });

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  async updateTask(id: string, data: z.infer<typeof updateTaskSchema>) {
    logger.debug('Updating task:', { id, data });

    const [task] = await db.update(tasks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  async deleteTask(id: string) {
    logger.debug('Deleting task:', { id });

    const [task] = await db.delete(tasks)
      .where(eq(tasks.id, id))
      .returning();

    if (!task) {
      throw new Error('Task not found');
    }
  }

  async listTasks(query: z.infer<typeof listTasksQuerySchema>) {
    logger.debug('Listing tasks:', query);

    const { projectId, status, priority, assigneeId, search, page, limit } = query;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (projectId) {
      conditions.push(eq(tasks.projectId, projectId));
    }

    if (status) {
      conditions.push(eq(tasks.status, status));
    }

    if (priority) {
      conditions.push(eq(tasks.priority, priority));
    }

    if (assigneeId) {
      conditions.push(eq(tasks.assigneeId, assigneeId));
    }

    if (search) {
      conditions.push(
        like(tasks.title, `%${search}%`)
      );
    }

    return db.query.tasks.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(tasks.createdAt)],
      limit,
      offset,
    });
  }

  async assignTask(id: string, assigneeId: string) {
    logger.debug('Assigning task:', { id, assigneeId });

    const [task] = await db.update(tasks)
      .set({
        assigneeId,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  async bulkAssignTasks(taskIds: string[], assigneeId: string) {
    logger.debug('Bulk assigning tasks:', { taskIds, assigneeId });

    const updatedTasks = await db.update(tasks)
      .set({
        assigneeId,
        updatedAt: new Date(),
      })
      .where(tasks.id.in(taskIds))
      .returning();

    if (updatedTasks.length === 0) {
      throw new Error('No tasks found');
    }

    return updatedTasks;
  }

  async listAssignedTasks(query: z.infer<typeof listAssignedTasksQuerySchema>) {
    logger.debug('Listing assigned tasks:', query);

    const { assigneeId, status, priority, dueDate, page, limit } = query;
    const offset = (page - 1) * limit;

    const conditions = [eq(tasks.assigneeId, assigneeId)];

    if (status) {
      conditions.push(eq(tasks.status, status));
    }

    if (priority) {
      conditions.push(eq(tasks.priority, priority));
    }

    if (dueDate) {
      conditions.push(eq(tasks.dueDate, dueDate));
    }

    return db.query.tasks.findMany({
      where: and(...conditions),
      orderBy: [desc(tasks.createdAt)],
      limit,
      offset,
    });
  }

  async scheduleTask(id: string, data: z.infer<typeof scheduleTaskSchema>) {
    logger.debug('Scheduling task:', { id, data });

    const [task] = await db.update(tasks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  async bulkScheduleTasks(taskIds: string[], data: z.infer<typeof scheduleTaskSchema>) {
    logger.debug('Bulk scheduling tasks:', { taskIds, data });

    const updatedTasks = await db.update(tasks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(tasks.id.in(taskIds))
      .returning();

    if (updatedTasks.length === 0) {
      throw new Error('No tasks found');
    }

    return updatedTasks;
  }

  async listScheduledTasks(query: z.infer<typeof listScheduledTasksQuerySchema>) {
    logger.debug('Listing scheduled tasks:', query);

    const { startDate, endDate, assigneeId, status, priority, page, limit } = query;
    const offset = (page - 1) * limit;

    const conditions = [
      between(tasks.dueDate, startDate, endDate),
    ];

    if (assigneeId) {
      conditions.push(eq(tasks.assigneeId, assigneeId));
    }

    if (status) {
      conditions.push(eq(tasks.status, status));
    }

    if (priority) {
      conditions.push(eq(tasks.priority, priority));
    }

    return db.query.tasks.findMany({
      where: and(...conditions),
      orderBy: [desc(tasks.createdAt)],
      limit,
      offset,
    });
  }

  async createRelationship(
    sourceTaskId: string,
    targetTaskId: string,
    type: 'blocks' | 'subtask'
  ) {
    logger.debug('Creating relationship:', { sourceTaskId, targetTaskId, type });

    // Check for circular dependencies
    if (type === 'blocks') {
      const hasCircular = await this.checkCircularDependency(sourceTaskId, targetTaskId);
      if (hasCircular) {
        throw new Error('Circular dependency detected');
      }
    }

    // Check for existing relationship
    const existingRelationship = await db.query.taskRelationships.findFirst({
      where: and(
        eq(taskRelationships.sourceTaskId, sourceTaskId),
        eq(taskRelationships.targetTaskId, targetTaskId)
      ),
    });

    if (existingRelationship) {
      throw new Error('Relationship already exists');
    }

    // Create relationship
    const [relationship] = await db.insert(taskRelationships)
      .values({
        sourceTaskId,
        targetTaskId,
        type,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return relationship;
  }

  async deleteRelationship(sourceTaskId: string, targetTaskId: string) {
    logger.debug('Deleting relationship:', { sourceTaskId, targetTaskId });

    const [relationship] = await db.delete(taskRelationships)
      .where(and(
        eq(taskRelationships.sourceTaskId, sourceTaskId),
        eq(taskRelationships.targetTaskId, targetTaskId)
      ))
      .returning();

    if (!relationship) {
      throw new Error('Relationship not found');
    }
  }

  async listRelationships(
    taskId: string,
    query: z.infer<typeof listRelationshipsQuerySchema>
  ) {
    logger.debug('Listing relationships:', { taskId, query });

    const { type, direction, page, limit } = query;
    const offset = (page - 1) * limit;

    const conditions = [];

    if (direction === 'incoming') {
      conditions.push(eq(taskRelationships.targetTaskId, taskId));
    } else if (direction === 'outgoing') {
      conditions.push(eq(taskRelationships.sourceTaskId, taskId));
    } else {
      conditions.push(or(
        eq(taskRelationships.sourceTaskId, taskId),
        eq(taskRelationships.targetTaskId, taskId)
      ));
    }

    if (type) {
      conditions.push(eq(taskRelationships.type, type));
    }

    return db.query.taskRelationships.findMany({
      where: and(...conditions),
      orderBy: [desc(taskRelationships.createdAt)],
      limit,
      offset,
    });
  }

  private async checkCircularDependency(
    sourceTaskId: string,
    targetTaskId: string,
    visited = new Set<string>()
  ): Promise<boolean> {
    if (visited.has(targetTaskId)) {
      return targetTaskId === sourceTaskId;
    }

    visited.add(targetTaskId);

    const relationships = await db.query.taskRelationships.findMany({
      where: and(
        eq(taskRelationships.sourceTaskId, targetTaskId),
        eq(taskRelationships.type, 'blocks')
      ),
    });

    for (const relationship of relationships) {
      if (await this.checkCircularDependency(sourceTaskId, relationship.targetTaskId, visited)) {
        return true;
      }
    }

    return false;
  }

  async updateTaskStatus(id: string, status: string) {
    logger.debug('Updating task status:', { id, status });

    // If marking as done, check blocking tasks
    if (status === 'done') {
      const blockingTasks = await db.query.taskRelationships.findMany({
        where: and(
          eq(taskRelationships.targetTaskId, id),
          eq(taskRelationships.type, 'blocks')
        ),
        with: {
          sourceTask: true,
        },
      });

      const incompleteBlockingTasks = blockingTasks.filter(
        (rel) => rel.sourceTask.status !== 'done'
      );

      if (incompleteBlockingTasks.length > 0) {
        throw new Error('Cannot mark task as done: blocked by incomplete tasks');
      }
    }

    const [task] = await db.update(tasks)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }
}

// Export singleton instance
export const taskService = new TaskService(); 