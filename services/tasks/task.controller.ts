import { Request, Response } from 'express';
import { taskService, createTaskSchema, updateTaskSchema, taskFilterSchema, TaskStatus } from './task.service';
import { z } from 'zod';

/**
 * Task Controller
 * Handles HTTP requests for task management endpoints
 */
export class TaskController {
  /**
   * Create a new task
   * @route POST /api/tasks
   */
  async createTask(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      // Validate request body
      const validatedData = createTaskSchema.parse({
        ...req.body,
        tenantId: req.user.tenantId,
        createdBy: req.user.id,
      });
      
      // Create task
      const task = await taskService.createTask(validatedData);
      
      return res.status(201).json({
        message: 'Task created successfully',
        task,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }
      
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  
  /**
   * Get task by ID
   * @route GET /api/tasks/:taskId
   */
  async getTaskById(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const taskId = req.params.taskId;
      
      // Get task
      const task = await taskService.getTaskById(taskId, req.user.tenantId);
      
      return res.status(200).json({
        task,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(404).json({
          message: error.message,
        });
      }
      
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  
  /**
   * Update task
   * @route PUT /api/tasks/:taskId
   */
  async updateTask(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const taskId = req.params.taskId;
      
      // Validate request body
      const validatedData = updateTaskSchema.parse(req.body);
      
      // Update task
      const task = await taskService.updateTask(taskId, validatedData, req.user.tenantId);
      
      return res.status(200).json({
        message: 'Task updated successfully',
        task,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      
      if (error instanceof Error) {
        return res.status(404).json({
          message: error.message,
        });
      }
      
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  
  /**
   * Delete task
   * @route DELETE /api/tasks/:taskId
   */
  async deleteTask(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const taskId = req.params.taskId;
      
      // Delete task
      await taskService.deleteTask(taskId, req.user.tenantId);
      
      return res.status(200).json({
        message: 'Task deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(404).json({
          message: error.message,
        });
      }
      
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  
  /**
   * Get tasks by project
   * @route GET /api/projects/:projectId/tasks
   */
  async getTasksByProject(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const projectId = req.params.projectId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Parse filters from query params
      const filters = taskFilterSchema.parse({
        status: req.query.status,
        priority: req.query.priority,
        assigneeId: req.query.assigneeId,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      });
      
      // Get tasks by project
      const result = await taskService.getTasksByProject(
        projectId, 
        req.user.tenantId, 
        filters, 
        page, 
        limit
      );
      
      return res.status(200).json({
        tasks: result.tasks,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      
      if (error instanceof Error) {
        return res.status(404).json({
          message: error.message,
        });
      }
      
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  
  /**
   * Get tasks assigned to user
   * @route GET /api/users/:userId/tasks
   */
  async getTasksByUser(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const userId = req.params.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      
      // Parse filters from query params
      const filters = taskFilterSchema.parse({
        status: req.query.status,
        priority: req.query.priority,
        projectId: req.query.projectId,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder,
      });
      
      // Get tasks by user
      const result = await taskService.getTasksByUser(
        userId, 
        req.user.tenantId, 
        filters, 
        page, 
        limit
      );
      
      return res.status(200).json({
        tasks: result.tasks,
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors,
        });
      }
      
      if (error instanceof Error) {
        return res.status(404).json({
          message: error.message,
        });
      }
      
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  
  /**
   * Assign task to user
   * @route POST /api/tasks/:taskId/assignees
   */
  async assignTask(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const taskId = req.params.taskId;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          message: 'User ID is required',
        });
      }
      
      // Assign task to user
      const assignment = await taskService.assignTask(
        taskId, 
        userId, 
        req.user.id, 
        req.user.tenantId
      );
      
      return res.status(201).json({
        message: 'Task assigned successfully',
        assignment,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }
      
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  
  /**
   * Unassign task from user
   * @route DELETE /api/tasks/:taskId/assignees/:userId
   */
  async unassignTask(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const taskId = req.params.taskId;
      const userId = req.params.userId;
      
      // Unassign task from user
      await taskService.unassignTask(taskId, userId, req.user.tenantId);
      
      return res.status(200).json({
        message: 'Task unassigned successfully',
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({
          message: error.message,
        });
      }
      
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
  
  /**
   * Update task status
   * @route PATCH /api/tasks/:taskId/status
   */
  async updateTaskStatus(req: Request, res: Response) {
    try {
      // Ensure user is authenticated and has tenant context
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({
          message: 'Unauthorized: Tenant context required',
        });
      }
      
      const taskId = req.params.taskId;
      const { status } = req.body;
      
      if (!status || !Object.values(TaskStatus).includes(status as TaskStatus)) {
        return res.status(400).json({
          message: 'Valid status is required',
          validStatuses: Object.values(TaskStatus),
        });
      }
      
      // Update task status
      const task = await taskService.updateTaskStatus(
        taskId, 
        status as TaskStatus, 
        req.user.tenantId
      );
      
      return res.status(200).json({
        message: 'Task status updated successfully',
        task,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(404).json({
          message: error.message,
        });
      }
      
      return res.status(500).json({
        message: 'Internal server error',
      });
    }
  }
}

// Export singleton instance
export const taskController = new TaskController();
