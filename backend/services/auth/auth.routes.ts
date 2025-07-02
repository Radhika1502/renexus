import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from './auth.middleware';

const router = Router();

/**
 * Authentication Routes
 */

// Public routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));

// Protected routes
router.get('/me', authenticate, authController.getProfile.bind(authController));
router.get('/tenants', authenticate, authController.getUserTenants.bind(authController));
router.post('/change-password', authenticate, authController.changePassword.bind(authController));

export default router;
