import { Router } from 'express';
import { teamController } from './team.controller';
import { authenticate, requireTenantAccess, requireRole } from '../auth/auth.middleware';

const router = Router();

/**
 * Team Management Routes
 * All routes require authentication
 */

// Get teams by tenant
router.get('/', 
  authenticate, 
  requireTenantAccess, 
  teamController.getTeamsByTenant.bind(teamController)
);

// Create a new team
router.post('/', 
  authenticate, 
  requireTenantAccess, 
  teamController.createTeam.bind(teamController)
);

// Get team by ID
router.get('/:teamId', 
  authenticate, 
  requireTenantAccess, 
  teamController.getTeamById.bind(teamController)
);

// Update team
router.put('/:teamId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner']), 
  teamController.updateTeam.bind(teamController)
);

// Delete team
router.delete('/:teamId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner']), 
  teamController.deleteTeam.bind(teamController)
);

// Get team members
router.get('/:teamId/members', 
  authenticate, 
  requireTenantAccess, 
  teamController.getTeamMembers.bind(teamController)
);

// Add member to team
router.post('/:teamId/members', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner']), 
  teamController.addTeamMember.bind(teamController)
);

// Update team member role
router.put('/:teamId/members/:userId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner']), 
  teamController.updateTeamMemberRole.bind(teamController)
);

// Remove member from team
router.delete('/:teamId/members/:userId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner']), 
  teamController.removeTeamMember.bind(teamController)
);

export default router;
