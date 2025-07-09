import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

// Create task
router.post('/', async (req, res) => {
  const { title, description, projectId } = req.body;
  
  const task = await prisma.task.create({
    data: {
      title,
      description,
      projectId,
      status: 'Todo'
    }
  });
  
  res.status(201).json(task);
});

// Get task by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      blockedBy: true,
      blocking: true
    }
  });
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json(task);
});

// Update task
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // If trying to mark as done, check blocking tasks
  if (status === 'Done') {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        blockedBy: true
      }
    });
    
    if (task?.blockedBy.some(t => t.status !== 'Done')) {
      return res.status(400).json({
        error: 'Cannot complete task when blocking tasks are not complete'
      });
    }
  }
  
  const updatedTask = await prisma.task.update({
    where: { id },
    data: { status }
  });
  
  res.json(updatedTask);
});

// Add task dependencies
router.post('/:id/dependencies', async (req, res) => {
  const { id } = req.params;
  const { blocks } = req.body;
  
  // Check for circular dependencies
  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      blockedBy: true
    }
  });
  
  if (blocks.some((taskId: string) => task?.blockedBy.some(t => t.id === taskId))) {
    return res.status(400).json({
      error: 'Cannot create circular dependency between tasks'
    });
  }
  
  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      blocking: {
        connect: blocks.map((taskId: string) => ({ id: taskId }))
      }
    },
    include: {
      blocking: true
    }
  });
  
  res.json(updatedTask);
});

export { router as taskRouter }; 