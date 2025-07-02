import { Request, Response } from 'express';
import { z } from 'zod';
import sessionService from '../../services/auth/session.service';
import { formatResponse } from "../../shared/utils/response";

/**
 * Session Controller
 * 
 * Handles HTTP requests related to session management
 */
export class SessionController {
  /**
   * Get all active sessions for the current user
   */
  async getUserSessions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(formatResponse('error', 'Unauthorized', null));
      }
      
      const sessions = await sessionService.getUserSessions(userId);
      return res.status(200).json(formatResponse('success', 'Sessions retrieved successfully', sessions));
    } catch (error) {
      console.error('Error retrieving user sessions:', error);
      return res.status(500).json(formatResponse('error', 'Failed to retrieve sessions', null));
    }
  }
  
  /**
   * Revoke a specific session
   */
  async revokeSession(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(formatResponse('error', 'Unauthorized', null));
      }
      
      const schema = z.object({
        sessionId: z.string().uuid()
      });
      
      const validation = schema.safeParse(req.params);
      if (!validation.success) {
        return res.status(400).json(formatResponse('error', 'Invalid session ID', validation.error));
      }
      
      const { sessionId } = validation.data;
      
      // Verify the session belongs to the current user
      const sessions = await sessionService.getUserSessions(userId);
      const sessionExists = sessions.some(session => session.id === sessionId);
      
      if (!sessionExists) {
        return res.status(404).json(formatResponse('error', 'Session not found or does not belong to current user', null));
      }
      
      await sessionService.revokeSession(sessionId);
      return res.status(200).json(formatResponse('success', 'Session revoked successfully', null));
    } catch (error) {
      console.error('Error revoking session:', error);
      return res.status(500).json(formatResponse('error', 'Failed to revoke session', null));
    }
  }
  
  /**
   * Revoke all sessions for the current user except the current one
   */
  async revokeAllSessions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(formatResponse('error', 'Unauthorized', null));
      }
      
      const schema = z.object({
        keepCurrentSession: z.boolean().optional().default(true)
      });
      
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json(formatResponse('error', 'Invalid request body', validation.error));
      }
      
      const { keepCurrentSession } = validation.data;
      
      // Get current session ID from request
      const currentSessionId = req.headers['session-token'] as string;
      
      await sessionService.revokeAllSessions(
        userId, 
        keepCurrentSession ? currentSessionId : undefined
      );
      
      return res.status(200).json(formatResponse('success', 'All sessions revoked successfully', null));
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      return res.status(500).json(formatResponse('error', 'Failed to revoke all sessions', null));
    }
  }
}

export default new SessionController();

