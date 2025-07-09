import { db } from '../../db';
import { tasks, taskAssignees, users, projects } from '../../db/schema';
import { eq, and, or, desc, asc } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

/**
 * Task status enum
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  ARCHIVED = 'archived',
}

/**
 * Task priority enum
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Create task schema
 */
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.date().optional(),
  projectId: z.string().uuid('Invalid project ID'),
  assigneeIds: z.array(z.string().uuid('Invalid assignee ID')).optional(),
  tenantId: z.string().uuid('Invalid tenant ID'),
  createdBy: z.string().uuid('Invalid user ID'),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Update task schema
 */
export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  dueDate: z.date().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Task filter schema
 */
export const taskFilterSchema = z.object({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z.string().uuid('Invalid assignee ID').optional(),
  projectId: z.string().uuid('Invalid project ID').optional(),
  search: z.string().optional(),
  sortBy: z.enum(['dueDate', 'priority', 'status', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Task Service
 * Handles task management operations
 */
export class TaskService {
  /**
   * Create a new task
   * @param taskData Task data
   * @returns Created task
   */
  async createTask(taskData: z.infer<typeof createTaskSchema>) {
    // Verify project exists and belongs to tenant
    const project = await db.query.projects.findFirst({
      where: and(
        eq(projects.id, taskData.projectId),
        eq(projects.tenantId, taskData.tenantId)
      ),
    });
    
    if (!project) {
      throw new Error('Project not found');
    }
    
    // Create task
    const taskId = uuidv4();
    const [task] = await db.insert(tasks).values({
      id: taskId,
      title: taskData.title,
      description: taskData.description || '',
      status: taskData.status,
      priority: taskData.priority,
      dueDate: taskData.dueDate,
      projectId: taskData.projectId,
      tenantId: taskData.tenantId,
      createdBy: taskData.createdBy,
      metadata: taskData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    // Assign task to users if assigneeIds provided
    if (taskData.assigneeIds && taskData.assigneeIds.length > 0) {
      const assignees = await Promise.all(
        taskData.assigneeIds.map(async (assigneeId) => {
          const [assignee] = await db.insert(taskAssignees).values({
            id: uuidv4(),
            taskId,
            userId: assigneeId,
            assignedBy: taskData.createdBy,
            createdAt: new Date(),
          }).returning();
          
          return assignee;
        })
      );
      
      return { ...task, assignees };
    }
    
    return task;
  }
  
  /**
   * Get task by ID
   * @param taskId Task ID
   * @param tenantId Tenant ID
   * @returns Task with assignees
   */
  async getTaskById(taskId: string, tenantId: string) {
    // Get task
    const task = await db.query.tasks.findFirst({
      where: and(
        eq(tasks.id, taskId),
        eq(tasks.tenantId, tenantId)
      ),
    });
    
    if (!task) {
      throw new Error('Task not found');
    }
    
    // Get task assignees
    const assignees = await db
      .select({
        id: taskAssignees.id,
        userId: taskAssignees.userId,
        assignedBy: taskAssignees.assignedBy,
        createdAt: taskAssignees.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(taskAssignees)
      .innerJoin(users, eq(taskAssignees.userId, users.id))
      .where(eq(taskAssignees.taskId, taskId));
    
    return { ...task, assignees };
  }
  
  /**
   * Update task
   * @param taskId Task ID
   * @param taskData Task data
   * @param tenantId Tenant ID
   * @returns Updated task
   */
  async updateTask(taskId: string, taskData: z.infer<typeof updateTaskSchema>, tenantId: string) {
    // Verify task exists and belongs to tenant
    await this.getTaskById(taskId, tenantId);
    
    // Update task
    const [updatedTask] = await db.update(tasks)
      .set({
        ...taskData,
        updatedAt: new Date(),
      })
      .where(and(
        eq(tasks.id, taskId),
        eq(tasks.tenantId, tenantId)
      ))
      .returning();
    
    // Get task assignees
    const assignees = await db
      .select({
        id: taskAssignees.id,
        userId: taskAssignees.userId,
        assignedBy: taskAssignees.assignedBy,
        createdAt: taskAssignees.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(taskAssignees)
      .innerJoin(users, eq(taskAssignees.userId, users.id))
      .where(eq(taskAssignees.taskId, taskId));
    
    return { ...updatedTask, assignees };
  }
  
  /**
   * Delete task
   * @param taskId Task ID
   * @param tenantId Tenant ID
   */
  async deleteTask(taskId: string, tenantId: string) {
    // Verify task exists and belongs to tenant
    await this.getTaskById(taskId, tenantId);
    
    // Delete task assignees first (cascade not handled by ORM)
    await db.delete(taskAssignees)
      .where(eq(taskAssignees.taskId, taskId));
    
    // Delete task
    await db.delete(tasks)
      .where(and(
        eq(tasks.id, taskId),
        eq(tasks.tenantId, tenantId)
      ));
  }
  
  /**
   * Get tasks by project
   * @param projectId Project ID
   * @param tenantId Tenant ID
   * @param filters Optional filters
   * @param page Page number
   * @param limit Items per page
   * @returns Tasks and total count
   */
  async getTasksByProject(
    projectId: string, 
    tenantId: string, 
    filters: z.infer<typeof taskFilterSchema> = {}, 
    page: number = 1, 
    limit: number = 20
  ) {
    const offset = (page - 1) * limit;
    
    // Build where conditions
    let whereConditions = and(
      eq(tasks.projectId, projectId),
      eq(tasks.tenantId, tenantId)
    );
    
    // Apply filters
    if (filters.status) {
      whereConditions = and(whereConditions, eq(tasks.status, filters.status));
    }
    
    if (filters.priority) {
      whereConditions = and(whereConditions, eq(tasks.priority, filters.priority));
    }
    
    // Get tasks
    const tasksResult = await db.query.tasks.findMany({
      where: whereConditions,
      limit,
      offset,
      orderBy: filters.sortBy && filters.sortOrder 
        ? filters.sortOrder === 'desc' 
          ? desc(tasks[filters.sortBy as keyof typeof tasks]) 
          : asc(tasks[filters.sortBy as keyof typeof tasks])
        : desc(tasks.createdAt),
    });
    
    // Get total count
    const totalCount = await db.select({ count: tasks.id })
      .from(tasks)
      .where(whereConditions)
      .then(result => result.length);
    
    // Get assignees for each task
    const tasksWithAssignees = await Promise.all(
      tasksResult.map(async (task) => {
        const assignees = await db
          .select({
            id: taskAssignees.id,
            userId: taskAssignees.userId,
            user: {
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
              avatarUrl: users.avatarUrl,
            },
          })
          .from(taskAssignees)
          .innerJoin(users, eq(taskAssignees.userId, users.id))
          .where(eq(taskAssignees.taskId, task.id));
        
        return { ...task, assignees };
      })
    );
    
    // Filter by assignee if specified
    const filteredTasks = filters.assigneeId 
      ? tasksWithAssignees.filter(task => 
          task.assignees.some(assignee => assignee.userId === filters.assigneeId)
        )
      : tasksWithAssignees;
    
    return {
      tasks: filteredTasks,
      total: totalCount,
    };
  }
  
  /**
   * Get tasks by user
   * @param userId User ID
   * @param tenantId Tenant ID
   * @param filters Optional filters
   * @param page Page number
   * @param limit Items per page
   * @returns Tasks and total count
   */
  async getTasksByUser(
    userId: string, 
    tenantId: string, 
    filters: z.infer<typeof taskFilterSchema> = {}, 
    page: number = 1, 
    limit: number = 20
  ) {
    const offset = (page - 1) * limit;
    
    // Get task IDs assigned to user
    const userTaskIds = await db
      .select({ taskId: taskAssignees.taskId })
      .from(taskAssignees)
      .where(eq(taskAssignees.userId, userId));
    
    if (userTaskIds.length === 0) {
      return {
        tasks: [],
        total: 0,
      };
    }
    
    // Build where conditions
    let whereConditions = and(
      eq(tasks.tenantId, tenantId),
      or(...userTaskIds.map(({ taskId }) => eq(tasks.id, taskId)))
    );
    
    // Apply filters
    if (filters.status) {
      whereConditions = and(whereConditions, eq(tasks.status, filters.status));
    }
    
    if (filters.priority) {
      whereConditions = and(whereConditions, eq(tasks.priority, filters.priority));
    }
    
    if (filters.projectId) {
      whereConditions = and(whereConditions, eq(tasks.projectId, filters.projectId));
    }
    
    // Get tasks
    const tasksResult = await db.query.tasks.findMany({
      where: whereConditions,
      limit,
      offset,
      orderBy: filters.sortBy && filters.sortOrder 
        ? filters.sortOrder === 'desc' 
          ? desc(tasks[filters.sortBy as keyof typeof tasks]) 
          : asc(tasks[filters.sortBy as keyof typeof tasks])
        : desc(tasks.createdAt),
    });
    
    // Get total count
    const totalCount = await db.select({ count: tasks.id })
      .from(tasks)
      .where(whereConditions)
      .then(result => result.length);
    
    // Get assignees for each task
    const tasksWithAssignees = await Promise.all(
      tasksResult.map(async (task) => {
        const assignees = await db
          .select({
            id: taskAssignees.id,
            userId: taskAssignees.userId,
            user: {
              id: users.id,
              email: users.email,
              firstName: users.firstName,
              lastName: users.lastName,
              avatarUrl: users.avatarUrl,
            },
          })
          .from(taskAssignees)
          .innerJoin(users, eq(taskAssignees.userId, users.id))
          .where(eq(taskAssignees.taskId, task.id));
        
        return { ...task, assignees };
      })
    );
    
    return {
      tasks: tasksWithAssignees,
      total: totalCount,
    };
  }
  
  /**
   * Assign task to user
   * @param taskId Task ID
   * @param userId User ID
   * @param assignedBy User ID of assigner
   * @param tenantId Tenant ID
   * @returns Task assignee
   */
  async assignTask(taskId: string, userId: string, assignedBy: string, tenantId: string) {
    // Verify task exists and belongs to tenant
    await this.getTaskById(taskId, tenantId);
    
    // Verify user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user is already assigned
    const existingAssignment = await db.query.taskAssignees.findFirst({
      where: and(
        eq(taskAssignees.taskId, taskId),
        eq(taskAssignees.userId, userId)
      ),
    });
    
    if (existingAssignment) {
      throw new Error('User is already assigned to this task');
    }
    
    // Assign task to user
    const [assignment] = await db.insert(taskAssignees).values({
      id: uuidv4(),
      taskId,
      userId,
      assignedBy,
      createdAt: new Date(),
    }).returning();
    
    return assignment;
  }
  
  /**
   * Unassign task from user
   * @param taskId Task ID
   * @param userId User ID
   * @param tenantId Tenant ID
   */
  async unassignTask(taskId: string, userId: string, tenantId: string) {
    // Verify task exists and belongs to tenant
    await this.getTaskById(taskId, tenantId);
    
    // Unassign task from user
    const result = await db.delete(taskAssignees)
      .where(and(
        eq(taskAssignees.taskId, taskId),
        eq(taskAssignees.userId, userId)
      ));
    
    if (result.rowCount === 0) {
      throw new Error('User is not assigned to this task');
    }
  }
  
  /**
   * Update task status
   * @param taskId Task ID
   * @param status New status
   * @param tenantId Tenant ID
   * @returns Updated task
   */
  async updateTaskStatus(taskId: string, status: TaskStatus, tenantId: string) {
    return this.updateTask(taskId, { status }, tenantId);
  }
}

// Export singleton instance
export const taskService = new TaskService();
