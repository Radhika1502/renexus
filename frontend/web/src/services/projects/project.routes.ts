import { Router } from 'express';
import { projectController } from './project.controller';
import { authenticate, requireTenantAccess, requireRole } from '../auth/auth.middleware';

const router = Router();

/**
 * Project Management Routes
 * All routes require authentication
 */

// Get projects by tenant
router.get('/', 
  authenticate, 
  requireTenantAccess, 
  projectController.getProjectsByTenant.bind(projectController)
);

// Create a new project
router.post('/', 
  authenticate, 
  requireTenantAccess, 
  projectController.createProject.bind(projectController)
);

// Get project by ID
router.get('/:projectId', 
  authenticate, 
  requireTenantAccess, 
  projectController.getProjectById.bind(projectController)
);

// Update project
router.put('/:projectId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner', 'manager']), 
  projectController.updateProject.bind(projectController)
);

// Delete project
router.delete('/:projectId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner']), 
  projectController.deleteProject.bind(projectController)
);

// Get project members
router.get('/:projectId/members', 
  authenticate, 
  requireTenantAccess, 
  projectController.getProjectMembers.bind(projectController)
);

// Add member to project
router.post('/:projectId/members', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner', 'manager']), 
  projectController.addProjectMember.bind(projectController)
);

// Update project member role
router.put('/:projectId/members/:userId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner', 'manager']), 
  projectController.updateProjectMemberRole.bind(projectController)
);

// Remove member from project
router.delete('/:projectId/members/:userId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner', 'manager']), 
  projectController.removeProjectMember.bind(projectController)
);

export default router;
