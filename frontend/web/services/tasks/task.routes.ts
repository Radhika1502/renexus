import express from 'express';
import { taskController } from './task.controller';
import { authenticate, requireTenantAccess, requireRole } from '../auth/auth.middleware';

const router = express.Router();

/**
 * Task Management Routes
 * All routes require authentication
 */

// Get tasks (filtered by query params)
router.get('/', 
  authenticate, 
  requireTenantAccess, 
  taskController.getTasksByProject.bind(taskController)
);

// Create a new task
router.post('/', 
  authenticate, 
  requireTenantAccess, 
  taskController.createTask.bind(taskController)
);

// Get task by ID
router.get('/:taskId', 
  authenticate, 
  requireTenantAccess, 
  taskController.getTaskById.bind(taskController)
);

// Update task
router.put('/:taskId', 
  authenticate, 
  requireTenantAccess, 
  taskController.updateTask.bind(taskController)
);

// Delete task
router.delete('/:taskId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner', 'manager']), 
  taskController.deleteTask.bind(taskController)
);

// Update task status
router.patch('/:taskId/status', 
  authenticate, 
  requireTenantAccess, 
  taskController.updateTaskStatus.bind(taskController)
);

// Assign task to user
router.post('/:taskId/assignees', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner', 'manager']), 
  taskController.assignTask.bind(taskController)
);

// Unassign task from user
router.delete('/:taskId/assignees/:userId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner', 'manager']), 
  taskController.unassignTask.bind(taskController)
);

// Get tasks by project
router.get('/projects/:projectId', 
  authenticate, 
  requireTenantAccess, 
  taskController.getTasksByProject.bind(taskController)
);

// Get tasks by user
router.get('/users/:userId', 
  authenticate, 
  requireTenantAccess, 
  taskController.getTasksByUser.bind(taskController)
);

export default router;
