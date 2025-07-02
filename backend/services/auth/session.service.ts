import { v4 as uuidv4 } from 'uuid';
import { db } from '../../database/db';
import { sessions } from '../../database/schema';
import { eq, and, lt, gt } from 'drizzle-orm';

/**
 * Session Management Service
 * 
 * Handles user session creation, validation, and management
 * Supports session expiration, revocation, and tracking
 */
export class SessionService {
  /**
   * Create a new session for a user
   * @param userId User ID
   * @param ipAddress IP address of the client
   * @param userAgent User agent string from the client
   * @returns Session object with token
   */
  async createSession(userId: string, ipAddress: string, userAgent: string) {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    const session = await db.insert(sessions).values({
      id: uuidv4(),
      userId,
      token,
      ipAddress,
      userAgent,
      isActive: true,
      expiresAt,
      createdAt: new Date(),
      lastActivityAt: new Date()
    }).returning();
    
    return session[0];
  }
  
  /**
   * Validate a session token
   * @param token Session token
   * @returns Session object if valid, null otherwise
   */
  async validateSession(token: string) {
    const now = new Date();
    
    const session = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.token, token),
        eq(sessions.isActive, true),
        gt(sessions.expiresAt, now)
      )
    });
    
    if (session) {
      // Update last activity time
      await db.update(sessions)
        .set({ lastActivityAt: now })
        .where(eq(sessions.id, session.id));
    }
    
    return session;
  }
  
  /**
   * Revoke a specific session
   * @param sessionId Session ID to revoke
   */
  async revokeSession(sessionId: string) {
    await db.update(sessions)
      .set({ isActive: false })
      .where(eq(sessions.id, sessionId));
  }
  
  /**
   * Revoke all sessions for a user
   * @param userId User ID
   * @param currentSessionId Optional current session ID to keep active
   */
  async revokeAllSessions(userId: string, currentSessionId?: string) {
    if (currentSessionId) {
      await db.update(sessions)
        .set({ isActive: false })
        .where(and(
          eq(sessions.userId, userId),
          eq(sessions.id, currentSessionId, true) // Not equal to current session
        ));
    } else {
      await db.update(sessions)
        .set({ isActive: false })
        .where(eq(sessions.userId, userId));
    }
  }
  
  /**
   * Get all active sessions for a user
   * @param userId User ID
   * @returns Array of active sessions
   */
  async getUserSessions(userId: string) {
    const now = new Date();
    
    return db.query.sessions.findMany({
      where: and(
        eq(sessions.userId, userId),
        eq(sessions.isActive, true),
        gt(sessions.expiresAt, now)
      ),
      orderBy: (sessions, { desc }) => [desc(sessions.lastActivityAt)]
    });
  }
  
  /**
   * Clean up expired sessions
   * @returns Number of sessions cleaned up
   */
  async cleanupExpiredSessions() {
    const now = new Date();
    
    const result = await db.update(sessions)
      .set({ isActive: false })
      .where(lt(sessions.expiresAt, now));
    
    return result.rowCount;
  }
}

export default new SessionService();
