import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, requireTenantAccess, requireRole } from '../auth/auth.middleware';

const router = Router();

/**
 * User Management Routes
 * All routes require authentication
 */

// Get users by tenant
router.get('/', 
  authenticate, 
  requireTenantAccess, 
  userController.getUsersByTenant.bind(userController)
);

// Create a new user
router.post('/', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner']), 
  userController.createUser.bind(userController)
);

// Get user by ID
router.get('/:userId', 
  authenticate, 
  requireTenantAccess, 
  userController.getUserById.bind(userController)
);

// Update user
router.put('/:userId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner']), 
  userController.updateUser.bind(userController)
);

// Delete user from tenant
router.delete('/:userId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner']), 
  userController.deleteUser.bind(userController)
);

// Get user's teams
router.get('/:userId/teams', 
  authenticate, 
  requireTenantAccess, 
  userController.getUserTeams.bind(userController)
);

// Add user to team
router.post('/:userId/teams/:teamId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner']), 
  userController.addUserToTeam.bind(userController)
);

// Remove user from team
router.delete('/:userId/teams/:teamId', 
  authenticate, 
  requireTenantAccess, 
  requireRole(['admin', 'owner']), 
  userController.removeUserFromTeam.bind(userController)
);

export default router;
