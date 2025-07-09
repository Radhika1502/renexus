import express, { Router, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { createTemplate, getTemplate, updateTemplate, deleteTemplate, listTemplates } from '../services/template.service';
import { logger } from '../../../shared/utils/logger';
import { verifyToken } from '../middleware/auth';

const router: Router = express.Router();

/**
 * @route POST /templates
 * @desc Create a new notification template
 * @access Private (Admin only)
 */
router.post(
  '/',
  verifyToken,
  [
    body('name').isString().notEmpty(),
    body('subject').isString().notEmpty(),
    body('body').isString().notEmpty(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const template = await createTemplate(req.body);
      return res.status(201).json(template);
    } catch (error) {
      logger.error('Error creating template', { error });
      return res.status(500).json({ error: 'Failed to create template' });
    }
  }
);

/**
 * @route GET /templates
 * @desc Get all notification templates
 * @access Private
 */
router.get(
  '/',
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const templates = await listTemplates();
      res.status(200).json(templates);
    } catch (error) {
      logger.error('Error listing templates', { error });
      res.status(500).json({ error: 'Failed to list templates' });
    }
  }
);

/**
 * @route GET /templates/:id
 * @desc Get a notification template by ID
 * @access Private
 */
router.get(
  '/:id',
  verifyToken,
  [param('id').isString()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const template = await getTemplate(req.params.id);
        if (template) {
            return res.json(template);
        } else {
            return res.status(404).json({ error: 'Template not found' });
        }
    } catch (error) {
        logger.error('Error getting template', { error });
        return res.status(500).json({ error: 'Failed to get template' });
    }
  }
);

/**
 * @route PUT /templates/:id
 * @desc Update a notification template
 * @access Private (Admin only)
 */
router.put(
  '/:id',
  verifyToken,
  [
    param('id').isString(),
    body('name').optional().isString(),
    body('subject').optional().isString(),
    body('body').optional().isString(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const template = await updateTemplate(req.params.id, req.body);
        if (template) {
            return res.json(template);
        } else {
            return res.status(404).json({ error: 'Template not found' });
        }
    } catch (error) {
        logger.error('Error updating template', { error });
        return res.status(500).json({ error: 'Failed to update template' });
    }
  }
);

/**
 * @route DELETE /templates/:id
 * @desc Delete a notification template
 * @access Private (Admin only)
 */
router.delete(
  '/:id',
  verifyToken,
  [param('id').isString()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        await deleteTemplate(req.params.id);
        return res.status(204).send();
    } catch (error) {
        logger.error('Error deleting template', { error });
        return res.status(500).json({ error: 'Failed to delete template' });
    }
  }
);

export const templateRoutes: Router = router;

