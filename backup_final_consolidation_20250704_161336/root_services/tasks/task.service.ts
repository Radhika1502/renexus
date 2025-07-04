import { db } from '../../db';
import { tasks, taskDependencies, timeEntries, taskAttachments } from '../../db/schema';
import { eq, and, or, like, desc, asc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class TaskService {
  /**
   * Get all tasks for a tenant with optional filtering and pagination
   */
  async getTasksByTenant(tenantId: string, options: any = {}) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        priority, 
        projectId, 
        assigneeId,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;
      
      const offset = (page - 1) * limit;
      
      // Build where conditions
      let whereConditions = [eq(tasks.tenantId, tenantId)];
      
      if (status) {
        whereConditions.push(eq(tasks.status, status));
      }
      
      if (priority) {
        whereConditions.push(eq(tasks.priority, priority));
      }
      
      if (projectId) {
        whereConditions.push(eq(tasks.projectId, projectId));
      }
      
      if (assigneeId) {
        whereConditions.push(eq(tasks.assigneeId, assigneeId));
      }
      
      if (search) {
        whereConditions.push(
          or(
            like(tasks.title, `%${search}%`),
            like(tasks.description, `%${search}%`)
          )
        );
      }
      
      // Build sort conditions
      const sortField = tasks[sortBy as keyof typeof tasks] || tasks.createdAt;
      const sortDirection = sortOrder === 'asc' ? asc : desc;
      
      // Execute query
      const results = await db.select().from(tasks)
        .where(and(...whereConditions))
        .orderBy(sortDirection(sortField))
        .limit(limit)
        .offset(offset);
      
      // Get total count for pagination
      const countResult = await db.select({ count: db.fn.count() }).from(tasks)
        .where(and(...whereConditions));
      
      const totalCount = Number(countResult[0].count);
      const totalPages = Math.ceil(totalCount / limit);
      
      return {
        data: results,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error getting tasks by tenant:', error);
      throw error;
    }
  }
  
  /**
   * Get a single task by ID
   */
  async getTaskById(taskId: string, tenantId: string) {
    try {
      const result = await db.select().from(tasks)
        .where(and(
          eq(tasks.id, taskId),
          eq(tasks.tenantId, tenantId)
        ))
        .limit(1);
      
      if (result.length === 0) {
        throw new Error('Task not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error getting task by ID:', error);
      throw error;
    }
  }
  
  /**
   * Create a new task
   */
  async createTask(taskData: any, tenantId: string, userId: string) {
    try {
      const { title, description, status, priority, projectId, assigneeId, dueDate } = taskData;
      
      if (!title) {
        throw new Error('Task title is required');
      }
      
      const newTask = {
        id: uuidv4(),
        tenantId,
        title,
        description: description || '',
        status: status || 'todo',
        priority: priority || 'medium',
        projectId: projectId || null,
        assigneeId: assigneeId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.insert(tasks).values(newTask).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing task
   */
  async updateTask(taskId: string, taskData: any, tenantId: string) {
    try {
      // First check if task exists and belongs to tenant
      const existingTask = await this.getTaskById(taskId, tenantId);
      
      if (!existingTask) {
        throw new Error('Task not found');
      }
      
      const updatedTask = {
        ...taskData,
        updatedAt: new Date()
      };
      
      const result = await db.update(tasks)
        .set(updatedTask)
        .where(and(
          eq(tasks.id, taskId),
          eq(tasks.tenantId, tenantId)
        ))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }
  
  /**
   * Delete a task
   */
  async deleteTask(taskId: string, tenantId: string) {
    try {
      // First check if task exists and belongs to tenant
      const existingTask = await this.getTaskById(taskId, tenantId);
      
      if (!existingTask) {
        throw new Error('Task not found');
      }
      
      // Delete all dependencies first
      await db.delete(taskDependencies)
        .where(or(
          eq(taskDependencies.taskId, taskId),
          eq(taskDependencies.dependsOnTaskId, taskId)
        ));
      
      // Delete all time entries
      await db.delete(timeEntries)
        .where(eq(timeEntries.taskId, taskId));
      
      // Delete all attachments
      await db.delete(taskAttachments)
        .where(eq(taskAttachments.taskId, taskId));
      
      // Delete the task
      const result = await db.delete(tasks)
        .where(and(
          eq(tasks.id, taskId),
          eq(tasks.tenantId, tenantId)
        ))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
  
  /**
   * Add a dependency between tasks
   */
  async addTaskDependency(taskId: string, dependsOnTaskId: string, tenantId: string) {
    try {
      // Check if both tasks exist and belong to tenant
      const task = await this.getTaskById(taskId, tenantId);
      const dependsOnTask = await this.getTaskById(dependsOnTaskId, tenantId);
      
      if (!task || !dependsOnTask) {
        throw new Error('One or both tasks not found');
      }
      
      // Check if dependency already exists
      const existingDependency = await db.select().from(taskDependencies)
        .where(and(
          eq(taskDependencies.taskId, taskId),
          eq(taskDependencies.dependsOnTaskId, dependsOnTaskId)
        ))
        .limit(1);
      
      if (existingDependency.length > 0) {
        throw new Error('Dependency already exists');
      }
      
      // Check for circular dependencies
      if (await this.wouldCreateCircularDependency(taskId, dependsOnTaskId)) {
        throw new Error('Cannot create circular dependency');
      }
      
      // Create the dependency
      const newDependency = {
        id: uuidv4(),
        taskId,
        dependsOnTaskId,
        createdAt: new Date()
      };
      
      const result = await db.insert(taskDependencies).values(newDependency).returning();
      return result[0];
    } catch (error) {
      console.error('Error adding task dependency:', error);
      throw error;
    }
  }
  
  /**
   * Remove a dependency between tasks
   */
  async removeTaskDependency(taskId: string, dependsOnTaskId: string, tenantId: string) {
    try {
      // Check if both tasks exist and belong to tenant
      const task = await this.getTaskById(taskId, tenantId);
      const dependsOnTask = await this.getTaskById(dependsOnTaskId, tenantId);
      
      if (!task || !dependsOnTask) {
        throw new Error('One or both tasks not found');
      }
      
      // Delete the dependency
      const result = await db.delete(taskDependencies)
        .where(and(
          eq(taskDependencies.taskId, taskId),
          eq(taskDependencies.dependsOnTaskId, dependsOnTaskId)
        ))
        .returning();
      
      if (result.length === 0) {
        throw new Error('Dependency not found');
      }
      
      return result[0];
    } catch (error) {
      console.error('Error removing task dependency:', error);
      throw error;
    }
  }
  
  /**
   * Check if adding a dependency would create a circular reference
   */
  async wouldCreateCircularDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    // If they're the same, it's circular
    if (taskId === dependsOnTaskId) {
      return true;
    }
    
    // Get all tasks that depend on the dependsOnTaskId
    const dependencies = await db.select().from(taskDependencies)
      .where(eq(taskDependencies.taskId, dependsOnTaskId));
    
    // Recursively check each dependency
    for (const dependency of dependencies) {
      if (dependency.dependsOnTaskId === taskId) {
        return true;
      }
      
      if (await this.wouldCreateCircularDependency(taskId, dependency.dependsOnTaskId)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Get all dependencies for a task
   */
  async getTaskDependencies(taskId: string, tenantId: string) {
    try {
      // Check if task exists and belongs to tenant
      const task = await this.getTaskById(taskId, tenantId);
      
      if (!task) {
        throw new Error('Task not found');
      }
      
      // Get all dependencies
      const dependencies = await db.select({
        id: taskDependencies.id,
        taskId: taskDependencies.taskId,
        dependsOnTaskId: taskDependencies.dependsOnTaskId,
        createdAt: taskDependencies.createdAt
      })
      .from(taskDependencies)
      .where(eq(taskDependencies.taskId, taskId));
      
      return dependencies;
    } catch (error) {
      console.error('Error getting task dependencies:', error);
      throw error;
    }
  }
}
