import express, { Request, Response } from 'express';
import authRoutes from '../services/auth/auth.routes';
import userRoutes from '../services/users/user.routes';
import teamRoutes from '../services/teams/team.routes';
import projectRoutes from '../services/projects/project.routes';
import projectTemplateRoutes from '../services/projects/project-template.routes';
import taskRoutes from '../services/tasks/task.routes';
import taskTemplateRoutes from '../services/tasks/task-template.routes';

const router = express.Router();

/**
 * API Routes
 */

// API Health Check
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount authentication routes
router.use('/auth', authRoutes);

// Mount user management routes
router.use('/users', userRoutes);

// Mount team management routes
router.use('/teams', teamRoutes);

// Mount project management routes
router.use('/projects', projectRoutes);

// Mount task management routes
router.use('/tasks', taskRoutes);

// Mount project template routes
router.use('/project-templates', projectTemplateRoutes);

// Mount task template routes
router.use('/task-templates', taskTemplateRoutes);

export default router;
