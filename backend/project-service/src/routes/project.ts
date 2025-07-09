import { Router } from 'express';
import { prisma } from '../db';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { 
  createProjectSchema, 
  updateProjectSchema, 
  projectParamsSchema, 
  listProjectsQuerySchema,
  addMemberSchema
} from '../schemas/project';
import { ZodError } from 'zod';

const router = Router();

// Validation middleware
const validateRequest = (schema: any) => async (req: any, res: any, next: any) => {
  try {
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params
    });
    return next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        status: 'error',
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    return next(error);
  }
};

// Create project
router.post('/', validateRequest(createProjectSchema), async (req, res) => {
  try {
    const { name, description, status, tenantId, createdById, teamId, startDate, endDate, templateId } = req.body;
    
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status,
        tenantId,
        createdById,
        teamId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        templateId
      }
    });
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get project by ID
router.get('/:id', validateRequest(projectParamsSchema), async (req, res) => {
  try {
    const { id } = req.params;
    
    const project = await prisma.project.findUnique({
      where: { id }
    });
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Error getting project:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Update project
router.patch('/:id', validateRequest(updateProjectSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, teamId, startDate, endDate } = req.body;
    
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(status && { status }),
        ...(teamId && { teamId }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) })
      }
    });
    
    res.json(project);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' });
    }
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', validateRequest(projectParamsSchema), async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.project.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Project not found' });
    }
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Add member to project
router.post('/:id/members', validateRequest(addMemberSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        members: {
          push: userId
        }
      }
    });
    
    res.json(updatedProject);
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

export { router as projectRouter }; 