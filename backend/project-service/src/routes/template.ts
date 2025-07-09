import { Router } from 'express';
import { prisma } from '../db';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { 
  createTemplateSchema, 
  updateTemplateSchema, 
  templateParamsSchema, 
  listTemplatesQuerySchema,
  applyTemplateSchema 
} from '../schemas/template';
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

// Create project template
router.post('/', validateRequest(createTemplateSchema), async (req, res) => {
  try {
    const { name, description, tenantId, createdById } = req.body;
    
    const template = await prisma.project.create({
      data: {
        name,
        description,
        status: 'template',
        tenantId,
        createdById
      }
    });
    
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// List project templates
router.get('/', validateRequest(listTemplatesQuerySchema), async (req, res) => {
  try {
    const { search, page = 1, limit = 20, status } = req.query as any;
    const offset = (Number(page) - 1) * Number(limit);

    const templates = await prisma.project.findMany({
      where: {
        ...(status ? { status } : { status: 'template' }),
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { description: { contains: search as string, mode: 'insensitive' } }
          ]
        })
      },
      take: Number(limit),
      skip: offset
    });
    
    res.json(templates);
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

// Get template by ID
router.get('/:id', validateRequest(templateParamsSchema), async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await prisma.project.findUnique({
      where: { id }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
});

// Update template
router.patch('/:id', validateRequest(updateTemplateSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const template = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description })
      }
    });
    
    res.json(template);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Template not found' });
    }
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', validateRequest(templateParamsSchema), async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.project.delete({
      where: { id }
    });
    
    res.status(204).send();
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'Template not found' });
    }
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Apply template to create new project
router.post('/:id/apply', validateRequest(applyTemplateSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, tenantId, createdById, teamId, startDate, endDate } = req.body;
    
    const template = await prisma.project.findUnique({
      where: { id }
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: 'active',
        tenantId,
        createdById,
        teamId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        templateId: template.id
      }
    });
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(500).json({ error: 'Failed to apply template' });
  }
});

export { router as templateRouter }; 