import { createClient } from 'redis';
import { logger } from "../utils/logger";
import jwt from 'jsonwebtoken';

interface RefreshToken {
  userId: string;
  token: string;
  createdAt: number;
}

interface PasswordResetToken {
  userId: string;
  token: string;
  createdAt: number;
  expiresAt: number;
}

export class TokenService {
  private redisClient;
  private refreshTokenExpiry: number; // in seconds
  private resetTokenExpiry: number; // in seconds

  constructor() {
    // Initialize Redis client
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.redisClient.on('error', (err) => {
      logger.error('Redis Client Error', err);
    });

    // Connect to Redis
    this.connect();

    // Set token expiry times
    this.refreshTokenExpiry = parseInt(process.env.REFRESH_TOKEN_EXPIRY || '604800'); // 7 days
    this.resetTokenExpiry = parseInt(process.env.RESET_TOKEN_EXPIRY || '3600'); // 1 hour
  }

  /**
   * Connect to Redis
   */
  private async connect(): Promise<void> {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
    }
  }

  /**
   * Store refresh token
   */
  public async storeRefreshToken(userId: string, token: string): Promise<void> {
    await this.connect();

    const refreshToken: RefreshToken = {
      userId,
      token,
      createdAt: Date.now(),
    };

    // Store token with expiry
    await this.redisClient.set(
      `refresh_token:${token}`,
      JSON.stringify(refreshToken),
      {
        EX: this.refreshTokenExpiry,
      }
    );

    // Add to user's token set
    await this.redisClient.sAdd(`user_tokens:${userId}`, token);
  }

  /**
   * Find refresh token
   */
  public async findRefreshToken(token: string): Promise<RefreshToken | null> {
    await this.connect();

    const tokenData = await this.redisClient.get(`refresh_token:${token}`);
    if (!tokenData) {
      return null;
    }

    return JSON.parse(tokenData);
  }

  /**
   * Rotate refresh token
   */
  public async rotateRefreshToken(
    userId: string,
    oldToken: string,
    newToken: string
  ): Promise<void> {
    await this.connect();

    // Start transaction
    const multi = this.redisClient.multi();

    // Remove old token
    multi.del(`refresh_token:${oldToken}`);
    multi.sRem(`user_tokens:${userId}`, oldToken);

    // Store new token
    const refreshToken: RefreshToken = {
      userId,
      token: newToken,
      createdAt: Date.now(),
    };

    multi.set(
      `refresh_token:${newToken}`,
      JSON.stringify(refreshToken),
      {
        EX: this.refreshTokenExpiry,
      }
    );
    multi.sAdd(`user_tokens:${userId}`, newToken);

    // Execute transaction
    await multi.exec();
  }

  /**
   * Revoke refresh token
   */
  public async revokeRefreshToken(userId: string, token: string): Promise<void> {
    await this.connect();

    // Start transaction
    const multi = this.redisClient.multi();

    // Remove token
    multi.del(`refresh_token:${token}`);
    multi.sRem(`user_tokens:${userId}`, token);

    // Execute transaction
    await multi.exec();
  }

  /**
   * Revoke all refresh tokens for user
   */
  public async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.connect();

    // Get all user tokens
    const tokens = await this.redisClient.sMembers(`user_tokens:${userId}`);

    if (tokens.length === 0) {
      return;
    }

    // Start transaction
    const multi = this.redisClient.multi();

    // Remove all tokens
    for (const token of tokens) {
      multi.del(`refresh_token:${token}`);
    }

    // Remove user token set
    multi.del(`user_tokens:${userId}`);

    // Execute transaction
    await multi.exec();
  }

  /**
   * Store password reset token
   */
  public async storePasswordResetToken(userId: string, token: string): Promise<void> {
    await this.connect();

    const now = Date.now();
    const resetToken: PasswordResetToken = {
      userId,
      token,
      createdAt: now,
      expiresAt: now + this.resetTokenExpiry * 1000,
    };

    // Store token with expiry
    await this.redisClient.set(
      `reset_token:${token}`,
      JSON.stringify(resetToken),
      {
        EX: this.resetTokenExpiry,
      }
    );
  }

  /**
   * Find password reset token
   */
  public async findPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    await this.connect();

    const tokenData = await this.redisClient.get(`reset_token:${token}`);
    if (!tokenData) {
      return null;
    }

    const resetToken = JSON.parse(tokenData) as PasswordResetToken;

    // Check if token is expired
    if (Date.now() > resetToken.expiresAt) {
      await this.redisClient.del(`reset_token:${token}`);
      return null;
    }

    return resetToken;
  }

  /**
   * Revoke password reset token
   */
  public async revokePasswordResetToken(token: string): Promise<void> {
    await this.connect();
    await this.redisClient.del(`reset_token:${token}`);
  }
}

