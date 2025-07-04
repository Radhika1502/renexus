import express from 'express';
import sessionController from '../../../controllers/auth/session.controller';
import { authenticate } from '../../../middleware/auth';

const router = express.Router();

/**
 * Session management routes
 * All routes require authentication
 */

// Get all active sessions for the current user
router.get('/', authenticate, sessionController.getUserSessions);

// Revoke a specific session
router.delete('/:sessionId', authenticate, sessionController.revokeSession);

// Revoke all sessions for the current user
router.post('/revoke-all', authenticate, sessionController.revokeAllSessions);

export default router;
