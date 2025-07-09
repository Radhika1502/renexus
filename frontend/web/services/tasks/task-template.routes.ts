import express from 'express';
import { taskTemplateController } from './task-template.controller';
import { authenticate, requireTenantAccess, requireRole } from '../auth/auth.middleware';

const router = express.Router();

/**
 * Task Template Routes
 * All routes require authentication
 */

// Get all templates for tenant
router.get('/', 
  authenticate, 
  requireTenantAccess, 
  taskTemplateController.getTemplatesByTenant.bind(taskTemplateController)
);

// Create a new template
router.post('/', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner', 'manager']),
  taskTemplateController.createTemplate.bind(taskTemplateController)
);

// Get template by ID
router.get('/:templateId', 
  authenticate, 
  requireTenantAccess, 
  taskTemplateController.getTemplateById.bind(taskTemplateController)
);

// Update template
router.put('/:templateId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner', 'manager']),
  taskTemplateController.updateTemplate.bind(taskTemplateController)
);

// Delete template
router.delete('/:templateId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner']),
  taskTemplateController.deleteTemplate.bind(taskTemplateController)
);

// Apply template to create a task
router.post('/apply', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner', 'manager', 'member']),
  taskTemplateController.applyTemplate.bind(taskTemplateController)
);

export default router;
