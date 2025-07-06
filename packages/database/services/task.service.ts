import { getDatabaseClient } from '../client';
import { withTransaction, TransactionContext } from '../transaction-manager';
import { logger } from '../logger';
import { getDatabaseUtils } from '../db-utils';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  projectId: string;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
  parentTaskId?: string;
  subtasks?: Task[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskCreate {
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  projectId: string;
  dueDate?: Date;
  estimatedHours?: number;
  tags?: string[];
  parentTaskId?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'review' | 'done';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
}

export interface TaskFilter {
  projectId?: string;
  assigneeId?: string;
  status?: string[];
  priority?: string[];
  dueDate?: { from?: Date; to?: Date };
  tags?: string[];
  search?: string;
}

export interface TaskSort {
  field: 'dueDate' | 'priority' | 'status' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface TaskPagination {
  page: number;
  pageSize: number;
}

export interface TaskListResult {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class TaskService {
  private client = getDatabaseClient();
  private utils = getDatabaseUtils();

  async createTask(task: TaskCreate, userId: string): Promise<Task> {
    logger.info(`Creating task: ${task.title}`);

    return withTransaction(async (context: TransactionContext) => {
      // Validate project exists and user has access
      await this.validateProjectAccess(context, task.projectId, userId);

      // Validate parent task if specified
      if (task.parentTaskId) {
        await this.validateParentTask(context, task.parentTaskId, task.projectId);
      }

      // Create task
      const result = await context.client.sql`
        INSERT INTO tasks (
          title,
          description,
          status,
          priority,
          assignee_id,
          project_id,
          due_date,
          estimated_hours,
          tags,
          parent_task_id,
          created_by,
          created_at,
          updated_at
        ) VALUES (
          ${task.title},
          ${task.description || null},
          ${task.status || 'todo'},
          ${task.priority || 'medium'},
          ${task.assigneeId || null},
          ${task.projectId},
          ${task.dueDate || null},
          ${task.estimatedHours || null},
          ${task.tags ? JSON.stringify(task.tags) : null},
          ${task.parentTaskId || null},
          ${userId},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `;

      const newTask = this.mapToTask(result[0]);

      // Create task history entry
      await this.createTaskHistory(context, newTask.id, userId, 'created', null, newTask);

      return newTask;
    });
  }

  async updateTask(taskId: string, updates: TaskUpdate, userId: string): Promise<Task> {
    logger.info(`Updating task: ${taskId}`);

    return withTransaction(async (context: TransactionContext) => {
      // Get current task state
      const currentTask = await this.getTaskById(taskId);
      if (!currentTask) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Validate user has access to the task's project
      await this.validateProjectAccess(context, currentTask.projectId, userId);

      // Validate status transition
      if (updates.status) {
        this.validateStatusTransition(currentTask.status, updates.status);
      }

      // Update task
      const result = await context.client.sql`
        UPDATE tasks
        SET
          title = ${updates.title || currentTask.title},
          description = ${updates.description !== undefined ? updates.description : currentTask.description},
          status = ${updates.status || currentTask.status},
          priority = ${updates.priority || currentTask.priority},
          assignee_id = ${updates.assigneeId !== undefined ? updates.assigneeId : currentTask.assigneeId},
          due_date = ${updates.dueDate || currentTask.dueDate},
          estimated_hours = ${updates.estimatedHours !== undefined ? updates.estimatedHours : currentTask.estimatedHours},
          actual_hours = ${updates.actualHours !== undefined ? updates.actualHours : currentTask.actualHours},
          tags = ${updates.tags ? JSON.stringify(updates.tags) : currentTask.tags},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${taskId}
        RETURNING *
      `;

      const updatedTask = this.mapToTask(result[0]);

      // Create task history entry
      await this.createTaskHistory(context, taskId, userId, 'updated', currentTask, updatedTask);

      return updatedTask;
    });
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    logger.info(`Deleting task: ${taskId}`);

    return withTransaction(async (context: TransactionContext) => {
      // Get task to validate access and create history
      const task = await this.getTaskById(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Validate user has access to the task's project
      await this.validateProjectAccess(context, task.projectId, userId);

      // Check for subtasks
      const subtasks = await this.getSubtasks(taskId);
      if (subtasks.length > 0) {
        throw new Error(`Cannot delete task ${taskId} with existing subtasks`);
      }

      // Create task history entry before deletion
      await this.createTaskHistory(context, taskId, userId, 'deleted', task, null);

      // Delete task
      await context.client.sql`
        DELETE FROM tasks WHERE id = ${taskId}
      `;
    });
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    const result = await this.client.sql`
      SELECT * FROM tasks WHERE id = ${taskId}
    `;

    return result.length > 0 ? this.mapToTask(result[0]) : null;
  }

  async listTasks(
    filter: TaskFilter,
    sort: TaskSort = { field: 'createdAt', direction: 'desc' },
    pagination: TaskPagination = { page: 1, pageSize: 20 }
  ): Promise<TaskListResult> {
    // Build base query
    let query = this.client.sql`
      SELECT * FROM tasks WHERE 1=1
    `;

    // Add filters
    if (filter.projectId) {
      query = query.append(this.client.sql` AND project_id = ${filter.projectId}`);
    }
    if (filter.assigneeId) {
      query = query.append(this.client.sql` AND assignee_id = ${filter.assigneeId}`);
    }
    if (filter.status && filter.status.length > 0) {
      query = query.append(this.client.sql` AND status = ANY(${filter.status})`);
    }
    if (filter.priority && filter.priority.length > 0) {
      query = query.append(this.client.sql` AND priority = ANY(${filter.priority})`);
    }
    if (filter.dueDate) {
      if (filter.dueDate.from) {
        query = query.append(this.client.sql` AND due_date >= ${filter.dueDate.from}`);
      }
      if (filter.dueDate.to) {
        query = query.append(this.client.sql` AND due_date <= ${filter.dueDate.to}`);
      }
    }
    if (filter.tags && filter.tags.length > 0) {
      query = query.append(this.client.sql` AND tags && ${filter.tags}`);
    }
    if (filter.search) {
      query = query.append(this.client.sql`
        AND (
          title ILIKE ${'%' + filter.search + '%'} OR
          description ILIKE ${'%' + filter.search + '%'}
        )
      `);
    }

    // Add sorting
    query = query.append(this.client.sql` ORDER BY ${this.client.sql(sort.field)} ${this.client.sql(sort.direction)}`);

    // Add pagination
    const offset = (pagination.page - 1) * pagination.pageSize;
    query = query.append(this.client.sql` LIMIT ${pagination.pageSize} OFFSET ${offset}`);

    // Execute query
    const result = await query;
    const tasks = result.map(this.mapToTask);

    // Get total count
    const countResult = await this.client.sql`
      SELECT COUNT(*) as total FROM tasks WHERE 1=1
    `;
    const total = parseInt(countResult[0].total);

    return {
      tasks,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  }

  async getSubtasks(taskId: string): Promise<Task[]> {
    const result = await this.client.sql`
      SELECT * FROM tasks WHERE parent_task_id = ${taskId}
    `;

    return result.map(this.mapToTask);
  }

  private async validateProjectAccess(context: TransactionContext, projectId: string, userId: string): Promise<void> {
    const result = await context.client.sql`
      SELECT 1 FROM project_members
      WHERE project_id = ${projectId}
        AND user_id = ${userId}
        AND (role = 'admin' OR role = 'member')
    `;

    if (result.length === 0) {
      throw new Error(`User ${userId} does not have access to project ${projectId}`);
    }
  }

  private async validateParentTask(context: TransactionContext, parentTaskId: string, projectId: string): Promise<void> {
    const result = await context.client.sql`
      SELECT project_id FROM tasks WHERE id = ${parentTaskId}
    `;

    if (result.length === 0) {
      throw new Error(`Parent task ${parentTaskId} not found`);
    }

    if (result[0].project_id !== projectId) {
      throw new Error(`Parent task ${parentTaskId} belongs to a different project`);
    }
  }

  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      todo: ['in_progress'],
      in_progress: ['review', 'todo'],
      review: ['done', 'in_progress'],
      done: ['review'],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private async createTaskHistory(
    context: TransactionContext,
    taskId: string,
    userId: string,
    action: 'created' | 'updated' | 'deleted',
    oldData: Task | null,
    newData: Task | null
  ): Promise<void> {
    await context.client.sql`
      INSERT INTO task_history (
        task_id,
        user_id,
        action,
        old_data,
        new_data,
        created_at
      ) VALUES (
        ${taskId},
        ${userId},
        ${action},
        ${oldData ? JSON.stringify(oldData) : null},
        ${newData ? JSON.stringify(newData) : null},
        CURRENT_TIMESTAMP
      )
    `;
  }

  private mapToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      assigneeId: row.assignee_id,
      projectId: row.project_id,
      dueDate: row.due_date,
      estimatedHours: row.estimated_hours,
      actualHours: row.actual_hours,
      tags: row.tags,
      parentTaskId: row.parent_task_id,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

let globalService: TaskService | undefined;

export const getTaskService = (): TaskService => {
  if (!globalService) {
    globalService = new TaskService();
  }
  return globalService;
}; 