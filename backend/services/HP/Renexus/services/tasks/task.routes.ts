import express from 'express';
import { TaskService } from './task.service';
import { authenticate, requireTenantAccess } from '../auth/auth.middleware';

const router = express.Router();
const taskService = new TaskService();

// Apply authentication middleware to all routes
router.use(authenticate);
router.use(requireTenantAccess);

/**
 * Get all tasks for the current tenant
 * GET /api/tasks
 */
router.get('/', async (req, res) => {
  try {
    const { tenantId } = req.user;
    const options = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      status: req.query.status as string,
      priority: req.query.priority as string,
      projectId: req.query.projectId as string,
      assigneeId: req.query.assigneeId as string,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as string
    };
    
    const result = await taskService.getTasksByTenant(tenantId, options);
    res.json(result);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * Get a single task by ID
 * GET /api/tasks/:taskId
 */
router.get('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { tenantId } = req.user;
    
    const task = await taskService.getTaskById(taskId, tenantId);
    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    if (error.message === 'Task not found') {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  }
});

/**
 * Create a new task
 * POST /api/tasks
 */
router.post('/', async (req, res) => {
  try {
    const { tenantId, id: userId } = req.user;
    const taskData = req.body;
    
    const newTask = await taskService.createTask(taskData, tenantId, userId);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    if (error.message === 'Task title is required') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
});

/**
 * Update an existing task
 * PUT /api/tasks/:taskId
 */
router.put('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { tenantId } = req.user;
    const taskData = req.body;
    
    const updatedTask = await taskService.updateTask(taskId, taskData, tenantId);
    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    if (error.message === 'Task not found') {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
});

/**
 * Delete a task
 * DELETE /api/tasks/:taskId
 */
router.delete('/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { tenantId } = req.user;
    
    await taskService.deleteTask(taskId, tenantId);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    if (error.message === 'Task not found') {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
});

/**
 * Add a dependency between tasks
 * POST /api/tasks/:taskId/dependencies/:dependsOnTaskId
 */
router.post('/:taskId/dependencies/:dependsOnTaskId', async (req, res) => {
  try {
    const { taskId, dependsOnTaskId } = req.params;
    const { tenantId } = req.user;
    
    const dependency = await taskService.addTaskDependency(taskId, dependsOnTaskId, tenantId);
    res.status(201).json(dependency);
  } catch (error) {
    console.error('Error adding task dependency:', error);
    if (error.message === 'One or both tasks not found') {
      res.status(404).json({ error: error.message });
    } else if (error.message === 'Dependency already exists' || error.message === 'Cannot create circular dependency') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to add task dependency' });
    }
  }
});

/**
 * Remove a dependency between tasks
 * DELETE /api/tasks/:taskId/dependencies/:dependsOnTaskId
 */
router.delete('/:taskId/dependencies/:dependsOnTaskId', async (req, res) => {
  try {
    const { taskId, dependsOnTaskId } = req.params;
    const { tenantId } = req.user;
    
    await taskService.removeTaskDependency(taskId, dependsOnTaskId, tenantId);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing task dependency:', error);
    if (error.message === 'One or both tasks not found' || error.message === 'Dependency not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to remove task dependency' });
    }
  }
});

/**
 * Get all dependencies for a task
 * GET /api/tasks/:taskId/dependencies
 */
router.get('/:taskId/dependencies', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { tenantId } = req.user;
    
    const dependencies = await taskService.getTaskDependencies(taskId, tenantId);
    res.json(dependencies);
  } catch (error) {
    console.error('Error fetching task dependencies:', error);
    if (error.message === 'Task not found') {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch task dependencies' });
    }
  }
});

export default router;
