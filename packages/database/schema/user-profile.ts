import { sql } from '../client';

export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone: string;
  language: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  customization?: Record<string, any>;
  lastUpdated: Date;
  createdAt: Date;
}

export interface UserProfileUpdate {
  displayName?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  language?: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  theme?: 'light' | 'dark' | 'system';
  customization?: Record<string, any>;
}

export const userProfileSchema = sql`
  CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    avatar TEXT,
    bio TEXT,
    location VARCHAR(100),
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    push_notifications BOOLEAN NOT NULL DEFAULT true,
    theme VARCHAR(10) NOT NULL DEFAULT 'system',
    customization JSONB,
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles(display_name);
  CREATE INDEX IF NOT EXISTS idx_user_profiles_last_updated ON user_profiles(last_updated);
`; 