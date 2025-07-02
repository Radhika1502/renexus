import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { createTemplate, getTemplate, updateTemplate, deleteTemplate, listTemplates } from '../services/template.service';
import { logger } from "../../shared/utils/logger";
import { verifyToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /templates
 * @desc Create a new notification template
 * @access Private (Admin only)
 */
router.post(
  '/',
  verifyToken,
  [
    body('name').notEmpty().withMessage('Template name is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('content').notEmpty().withMessage('Content is required'),
    body('variables').isArray().withMessage('Variables must be an array'),
  ],
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Only administrators can create templates'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, subject, content, variables } = req.body;

      const template = await createTemplate({
        name,
        description,
        subject,
        content,
        variables
      });

      res.status(201).json(template);
    } catch (error) {
      logger.error('Error creating template', { error });
      res.status(500).json({
        error: 'Failed to create template'
      });
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
  async (req, res) => {
    try {
      const templates = await listTemplates();
      res.status(200).json(templates);
    } catch (error) {
      logger.error('Error getting templates', { error });
      res.status(500).json({
        error: 'Failed to get templates'
      });
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
  [
    param('id').notEmpty().withMessage('Template ID is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const template = await getTemplate(id);

      if (!template) {
        return res.status(404).json({
          error: 'Template not found'
        });
      }

      res.status(200).json(template);
    } catch (error) {
      logger.error('Error getting template', { error });
      res.status(500).json({
        error: 'Failed to get template'
      });
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
    param('id').notEmpty().withMessage('Template ID is required'),
    body('name').optional(),
    body('description').optional(),
    body('subject').optional(),
    body('content').optional(),
    body('variables').optional().isArray(),
  ],
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Only administrators can update templates'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const updates = req.body;

      const template = await updateTemplate(id, updates);

      if (!template) {
        return res.status(404).json({
          error: 'Template not found'
        });
      }

      res.status(200).json(template);
    } catch (error) {
      logger.error('Error updating template', { error });
      res.status(500).json({
        error: 'Failed to update template'
      });
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
  [
    param('id').notEmpty().withMessage('Template ID is required'),
  ],
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Only administrators can delete templates'
        });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const success = await deleteTemplate(id);

      if (!success) {
        return res.status(404).json({
          error: 'Template not found'
        });
      }

      res.status(200).json({
        message: 'Template deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting template', { error });
      res.status(500).json({
        error: 'Failed to delete template'
      });
    }
  }
);

export const templateRoutes = router;

