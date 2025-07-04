import express from 'express';
import { authenticate } from '../../middleware/auth';
import { projectService } from './project.service';

const router = express.Router();

// Get all projects for the current tenant
router.get('/', authenticate, async (req, res, next) => {
  try {
    const projects = await projectService.getProjectsByTenant(req.user.tenantId);
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

// Get a project by ID
router.get('/:projectId', authenticate, async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.params.projectId, req.user.tenantId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Create a new project
router.post('/', authenticate, async (req, res, next) => {
  try {
    const project = await projectService.createProject({
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user.id
    });
    res.status(201).json(project);
  } catch (error) {
    next(error);
  }
});

// Update a project
router.put('/:projectId', authenticate, async (req, res, next) => {
  try {
    const project = await projectService.updateProject(
      req.params.projectId,
      req.body,
      req.user.tenantId
    );
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Delete a project
router.delete('/:projectId', authenticate, async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.params.projectId, req.user.tenantId);
    if (!result) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
