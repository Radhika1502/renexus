import { getDatabaseClient } from '../client';
import { withTransaction, TransactionContext } from '../transaction-manager';
import { logger } from '../logger';
import { UserProfile, UserProfileUpdate } from '../schema/user-profile';

export class UserProfileService {
  private client = getDatabaseClient();

  async createProfile(userId: string, profile: UserProfileUpdate): Promise<UserProfile> {
    logger.info(`Creating profile for user ${userId}`);

    return withTransaction(async (context: TransactionContext) => {
      // Check if profile exists
      const existing = await context.client.sql`
        SELECT id FROM user_profiles WHERE user_id = ${userId}
      `;

      if (existing.length > 0) {
        throw new Error(`Profile already exists for user ${userId}`);
      }

      // Create new profile with default values for optional fields
      const result = await context.client.sql`
        INSERT INTO user_profiles (
          user_id,
          display_name,
          avatar,
          bio,
          location,
          timezone,
          language,
          email_notifications,
          push_notifications,
          theme,
          customization
        ) VALUES (
          ${userId},
          ${profile.displayName || userId},
          ${profile.avatar ?? null},
          ${profile.bio ?? null},
          ${profile.location ?? null},
          ${profile.timezone ?? 'UTC'},
          ${profile.language ?? 'en'},
          ${profile.emailNotifications ?? true},
          ${profile.pushNotifications ?? true},
          ${profile.theme ?? 'system'},
          ${profile.customization ? JSON.stringify(profile.customization) : null}
        )
        RETURNING *
      `;

      return this.mapToUserProfile(result[0]);
    });
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    logger.info(`Fetching profile for user ${userId}`);

    const result = await this.client.sql`
      SELECT * FROM user_profiles WHERE user_id = ${userId}
    `;

    return result.length > 0 ? this.mapToUserProfile(result[0]) : null;
  }

  async updateProfile(userId: string, updates: UserProfileUpdate): Promise<UserProfile> {
    logger.info(`Updating profile for user ${userId}`);

    return withTransaction(async (context: TransactionContext) => {
      // Check if profile exists
      const existing = await context.client.sql`
        SELECT * FROM user_profiles WHERE user_id = ${userId}
      `;

      if (existing.length === 0) {
        throw new Error(`Profile not found for user ${userId}`);
      }

      const current = this.mapToUserProfile(existing[0]);

      // Update profile with merged values
      const result = await context.client.sql`
        UPDATE user_profiles 
        SET 
          display_name = ${updates.displayName ?? current.displayName},
          avatar = ${updates.avatar ?? current.avatar},
          bio = ${updates.bio ?? current.bio},
          location = ${updates.location ?? current.location},
          timezone = ${updates.timezone ?? current.timezone},
          language = ${updates.language ?? current.language},
          email_notifications = ${updates.emailNotifications ?? current.emailNotifications},
          push_notifications = ${updates.pushNotifications ?? current.pushNotifications},
          theme = ${updates.theme ?? current.theme},
          customization = ${updates.customization !== undefined ? JSON.stringify(updates.customization) : current.customization},
          last_updated = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
        RETURNING *
      `;

      return this.mapToUserProfile(result[0]);
    });
  }

  async deleteProfile(userId: string): Promise<void> {
    logger.info(`Deleting profile for user ${userId}`);

    await this.client.sql`
      DELETE FROM user_profiles WHERE user_id = ${userId}
    `;
  }

  async searchProfiles(query: string, limit: number = 10): Promise<UserProfile[]> {
    logger.info(`Searching profiles with query: ${query}`);

    const result = await this.client.sql`
      SELECT * FROM user_profiles 
      WHERE 
        display_name ILIKE ${'%' + query + '%'} OR
        bio ILIKE ${'%' + query + '%'} OR
        location ILIKE ${'%' + query + '%'}
      ORDER BY last_updated DESC
      LIMIT ${limit}
    `;

    return result.map(this.mapToUserProfile);
  }

  private mapToUserProfile(row: any): UserProfile {
    return {
      id: row.id,
      userId: row.user_id,
      displayName: row.display_name,
      avatar: row.avatar,
      bio: row.bio,
      location: row.location,
      timezone: row.timezone,
      language: row.language,
      emailNotifications: row.email_notifications,
      pushNotifications: row.push_notifications,
      theme: row.theme,
      customization: row.customization,
      lastUpdated: row.last_updated,
      createdAt: row.created_at,
    };
  }
}

let globalService: UserProfileService | undefined;

export const getUserProfileService = (): UserProfileService => {
  if (!globalService) {
    globalService = new UserProfileService();
  }
  return globalService;
}; 