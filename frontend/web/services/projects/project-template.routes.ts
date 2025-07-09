import express from 'express';
import { projectTemplateController } from './project-template.controller';
import { authenticate, requireTenantAccess, requireRole } from '../auth/auth.middleware';

const router = express.Router();

/**
 * Project Template Routes
 * All routes require authentication
 */

// Get all templates for tenant
router.get('/', 
  authenticate, 
  requireTenantAccess, 
  projectTemplateController.getTemplatesByTenant.bind(projectTemplateController)
);

// Create a new template
router.post('/', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner', 'manager']),
  projectTemplateController.createTemplate.bind(projectTemplateController)
);

// Get template by ID
router.get('/:templateId', 
  authenticate, 
  requireTenantAccess, 
  projectTemplateController.getTemplateById.bind(projectTemplateController)
);

// Update template
router.put('/:templateId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner', 'manager']),
  projectTemplateController.updateTemplate.bind(projectTemplateController)
);

// Delete template
router.delete('/:templateId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner']),
  projectTemplateController.deleteTemplate.bind(projectTemplateController)
);

// Apply template to project
router.post('/apply', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner', 'manager']),
  projectTemplateController.applyTemplate.bind(projectTemplateController)
);

export default router;
