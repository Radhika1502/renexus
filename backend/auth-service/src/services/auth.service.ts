import jwt from 'jsonwebtoken';

4import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabaseClient } from '../../../../packages/database/client';
import { withTransaction, TransactionContext } from '../../../../packages/database/transaction-manager';
import { logger } from '../utils/logger';

interface RegisterParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  role?: string;
}

interface LoginParams {
  email: string;
  password: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  expiresIn: number;
}

interface TokenPayload {
  sub: string; // user ID
  email: string;
  role: string;
  tenantId: string;
  iat: number;
  exp: number;
}

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  mfaEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export class AuthService {
  private client = getDatabaseClient();
  private jwtSecret: string;
  private jwtExpiresIn: number; // in seconds
  private refreshTokenExpiresIn: number; // in seconds
  private saltRounds: number;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    this.jwtExpiresIn = parseInt(process.env.JWT_EXPIRES_IN || '3600'); // 1 hour
    this.refreshTokenExpiresIn = parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN || '604800'); // 7 days
    this.saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    
    if (process.env.NODE_ENV === 'production' && this.jwtSecret === 'your-secret-key-change-in-production') {
      throw new Error('JWT_SECRET must be set in production environment');
    }
  }

  /**
   * Register a new user
   */
  public async register(params: RegisterParams): Promise<UserData> {
    const { email, password, firstName, lastName, tenantId, role = 'user' } = params;

    logger.info('Registering new user', { email, tenantId, role });

    return withTransaction(async (context: TransactionContext) => {
      // Check if user already exists
      const existingUser = await context.client.sql`
        SELECT id FROM users WHERE email = ${email}
      `;

      if (existingUser.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Validate tenant exists
      const tenant = await context.client.sql`
        SELECT id FROM tenants WHERE id = ${tenantId}
      `;

      if (tenant.length === 0) {
        throw new Error('Invalid tenant ID');
      }

      // Validate password strength
      this.validatePassword(password);

      // Hash password
      const passwordHash = await bcrypt.hash(password, this.saltRounds);

      // Create user
      const userId = uuidv4();
      const now = new Date();

      await context.client.sql`
        INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at, updated_at)
        VALUES (${userId}, ${email}, ${passwordHash}, ${firstName}, ${lastName}, ${role}, ${now}, ${now})
      `;

      // Create tenant-user relationship
      await context.client.sql`
        INSERT INTO tenant_users (tenant_id, user_id, role, created_at, updated_at)
        VALUES (${tenantId}, ${userId}, ${role}, ${now}, ${now})
      `;

      logger.info('User registered successfully', { userId, email, tenantId });

      return {
        id: userId,
        email,
        firstName,
        lastName,
        role,
        tenantId,
        mfaEnabled: false,
        createdAt: now,
        updatedAt: now,
      };
    });
  }

  /**
   * Login user with email and password
   */
  public async login(params: LoginParams): Promise<{ user: UserData; tokens: TokenPair }> {
    const { email, password } = params;

    logger.info('User login attempt', { email });

    return withTransaction(async (context: TransactionContext) => {
      // Find user with tenant information
      const userResult = await context.client.sql`
        SELECT 
          u.id, u.email, u.password_hash, u.first_name, u.last_name, u.role, u.mfa_enabled,
          u.created_at, u.updated_at, u.last_login,
          tu.tenant_id, tu.role as tenant_role
        FROM users u
        JOIN tenant_users tu ON u.id = tu.user_id
        WHERE u.email = ${email}
        LIMIT 1
      `;

      if (userResult.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = userResult[0];

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Update last login
      await context.client.sql`
        UPDATE users 
        SET last_login = NOW(), updated_at = NOW()
        WHERE id = ${user.id}
      `;

      // Generate tokens
      const userData: UserData = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.tenant_role || user.role,
        tenantId: user.tenant_id,
        mfaEnabled: user.mfa_enabled,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: new Date(),
      };

      const tokens = await this.generateTokenPair(userData);

      // Store session
      await this.storeSession(userData.id, tokens);

      logger.info('User login successful', { userId: user.id, email });

      return { user: userData, tokens };
    });
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshToken(refreshToken: string): Promise<TokenPair> {
    logger.info('Refreshing access token');

    return withTransaction(async (context: TransactionContext) => {
      // Find and validate refresh token
      const sessionResult = await context.client.sql`
        SELECT s.id, s.user_id, s.expires_at,
               u.email, u.first_name, u.last_name, u.role, u.mfa_enabled,
               tu.tenant_id, tu.role as tenant_role
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        JOIN tenant_users tu ON u.id = tu.user_id
        WHERE s.refresh_token = ${refreshToken}
          AND s.expires_at > NOW()
        LIMIT 1
      `;

      if (sessionResult.length === 0) {
        throw new Error('Invalid or expired refresh token');
      }

      const session = sessionResult[0];

      // Create user data
      const userData: UserData = {
        id: session.user_id,
        email: session.email,
        firstName: session.first_name,
        lastName: session.last_name,
        role: session.tenant_role || session.role,
        tenantId: session.tenant_id,
        mfaEnabled: session.mfa_enabled,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generate new token pair
      const tokens = await this.generateTokenPair(userData);

      // Update session with new tokens
      await context.client.sql`
        UPDATE sessions 
        SET token = ${tokens.accessToken}, 
            refresh_token = ${tokens.refreshToken},
            expires_at = ${new Date(tokens.expiresAt * 1000)},
            updated_at = NOW()
        WHERE id = ${session.id}
      `;

      logger.info('Access token refreshed successfully', { userId: session.user_id });

      return tokens;
    });
  }

  /**
   * Logout user by revoking session
   */
  public async logout(accessToken: string): Promise<void> {
    logger.info('User logout');

    try {
      const decoded = jwt.verify(accessToken, this.jwtSecret) as TokenPayload;
      
      await withTransaction(async (context: TransactionContext) => {
        await context.client.sql`
          DELETE FROM sessions WHERE user_id = ${decoded.sub}
        `;
      });

      logger.info('User logged out successfully', { userId: decoded.sub });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Logout with invalid token', { error: errorMessage });
      // Still proceed with logout even if token is invalid
    }
  }

  /**
   * Verify JWT token
   */
  public async verifyToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as TokenPayload;
      
      // Verify session still exists
      const sessionResult = await this.client.sql`
        SELECT id FROM sessions 
        WHERE user_id = ${decoded.sub} AND expires_at > NOW()
        LIMIT 1
      `;

      if (sessionResult.length === 0) {
        throw new Error('Session expired or invalid');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Generate password reset token
   */
  public async generatePasswordResetToken(email: string): Promise<string> {
    logger.info('Generating password reset token', { email });

    return withTransaction(async (context: TransactionContext) => {
      // Find user
      const userResult = await context.client.sql`
        SELECT id FROM users WHERE email = ${email}
      `;

      if (userResult.length === 0) {
        throw new Error('User not found');
      }

      const userId = userResult[0].id;
      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      // Store reset token (you may want to create a separate table for this)
      await context.client.sql`
        INSERT INTO sessions (id, user_id, token, expires_at, created_at, updated_at)
        VALUES (${uuidv4()}, ${userId}, ${resetToken}, ${expiresAt}, NOW(), NOW())
      `;

      logger.info('Password reset token generated', { userId, email });

      return resetToken;
    });
  }

  /**
   * Reset password using reset token
   */
  public async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    logger.info('Resetting password');

    return withTransaction(async (context: TransactionContext) => {
      // Find reset token
      const sessionResult = await context.client.sql`
        SELECT user_id FROM sessions 
        WHERE token = ${resetToken} AND expires_at > NOW()
        LIMIT 1
      `;

      if (sessionResult.length === 0) {
        throw new Error('Invalid or expired reset token');
      }

      const userId = sessionResult[0].user_id;

      // Validate password strength
      this.validatePassword(newPassword);

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

      // Update password
      await context.client.sql`
        UPDATE users 
        SET password_hash = ${passwordHash}, updated_at = NOW()
        WHERE id = ${userId}
      `;

      // Remove reset token
      await context.client.sql`
        DELETE FROM sessions WHERE token = ${resetToken}
      `;

      logger.info('Password reset successfully', { userId });
    });
  }

  /**
   * Change user password
   */
  public async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    logger.info('Changing password', { userId });

    return withTransaction(async (context: TransactionContext) => {
      // Get current password hash
      const userResult = await context.client.sql`
        SELECT password_hash FROM users WHERE id = ${userId}
      `;

      if (userResult.length === 0) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userResult[0].password_hash);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password strength
      this.validatePassword(newPassword);

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, this.saltRounds);

      // Update password
      await context.client.sql`
        UPDATE users 
        SET password_hash = ${passwordHash}, updated_at = NOW()
        WHERE id = ${userId}
      `;

      // Revoke all existing sessions for security
      await context.client.sql`
        DELETE FROM sessions WHERE user_id = ${userId}
      `;

      logger.info('Password changed successfully', { userId });
    });
  }

  /**
   * Generate JWT and refresh token pair
   */
  private async generateTokenPair(user: UserData): Promise<TokenPair> {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + this.jwtExpiresIn;

    // Create JWT payload
    const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    // Generate access token
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'renexus-auth',
      audience: 'renexus-api',
    });

    // Generate refresh token
    const refreshToken = uuidv4();

    return {
      accessToken,
      refreshToken,
      expiresAt,
      expiresIn: this.jwtExpiresIn,
    };
  }

  /**
   * Store session in database
   */
  private async storeSession(userId: string, tokens: TokenPair): Promise<void> {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + this.refreshTokenExpiresIn * 1000);

    await withTransaction(async (context: TransactionContext) => {
      // Remove existing sessions for this user
      await context.client.sql`
        DELETE FROM sessions WHERE user_id = ${userId}
      `;

      // Store new session
      await context.client.sql`
        INSERT INTO sessions (id, user_id, token, refresh_token, expires_at, created_at, updated_at)
        VALUES (${sessionId}, ${userId}, ${tokens.accessToken}, ${tokens.refreshToken}, ${expiresAt}, NOW(), NOW())
      `;
    });
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new Error('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }
}
