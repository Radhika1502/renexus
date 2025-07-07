import { db } from '../../packages/database/db';
import { sessions } from '../../packages/database/schema/sessions';
import { eq } from 'drizzle-orm';

export class SessionService {
  constructor(private readonly db = db) {}

  async createSession(userId: string) {
    const token = crypto.randomUUID();
    const session = await this.db.insert(sessions)
      .values({
        userId,
        token,
        createdAt: new Date(),
        lastActivityAt: new Date()
      })
      .returning();

    return session[0];
  }

  async validateSession(token: string) {
    const result = await this.db.select()
      .from(sessions)
      .where(eq(sessions.token, token));

    const session = result[0];
    if (!session) {
      return false;
    }

    // Check if session is expired (24 hours)
    const expirationTime = new Date(session.lastActivityAt);
    expirationTime.setHours(expirationTime.getHours() + 24);

    if (new Date() > expirationTime) {
      await this.deleteSession(token);
      return false;
    }

    return true;
  }

  async deleteSession(token: string) {
    await this.db.delete(sessions)
      .where(eq(sessions.token, token));
  }

  async updateLastActivity(token: string) {
    await this.db.update(sessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(sessions.token, token));
  }
} 