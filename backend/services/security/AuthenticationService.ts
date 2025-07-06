import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { db } from '@/database/db';
import { users, userSessions, mfaSettings } from '@/database/schema';
import { eq } from 'drizzle-orm';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  tenantId?: string;
  sessionId: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Enhanced Authentication Service for Phase 4 Security Implementation
 * Implements multi-factor authentication, brute force protection,
 * account lockout mechanisms, and secure password reset flow
 */
export class AuthenticationService {
  private readonly JWT_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly ACCESS_TOKEN_EXPIRES_IN: string;
  private readonly REFRESH_TOKEN_EXPIRES_IN: string;
  private readonly MAX_LOGIN_ATTEMPTS: number = 5;
  private readonly LOCKOUT_DURATION_MINUTES: number = 30;
  private readonly SALT_ROUNDS: number = 12;
  
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production';
    this.ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
    this.REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
  }
  
  /**
   * Authenticate user with username/password and handle MFA if enabled
   * Implements brute force protection and account lockout
   */
  async authenticate(email: string, password: string): Promise<{ 
    success: boolean; 
    accessToken?: string; 
    refreshToken?: string; 
    requiresMfa?: boolean;
    tempToken?: string;
    message?: string;
    userId?: string;
  }> {
    try {
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
        with: {
          mfaSettings: true,
          loginAttempts: true
        }
      });
      
      if (!user) {
        return { success: false, message: 'Invalid credentials' };
      }
      
      // Check if account is locked
      if (user.loginAttempts && user.loginAttempts.lockedUntil) {
        const lockExpiry = new Date(user.loginAttempts.lockedUntil);
        if (lockExpiry > new Date()) {
          return { 
            success: false, 
            message: `Account is locked. Try again after ${lockExpiry.toLocaleString()}` 
          };
        } else {
          // Reset lockout if expired
          await db.update(users)
            .set({ 
              loginAttempts: { 
                count: 0, 
                lockedUntil: null 
              } 
            })
            .where(eq(users.id, user.id));
        }
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        // Increment failed login attempts
        const attempts = (user.loginAttempts?.count || 0) + 1;
        let lockedUntil = null;
        
        // Lock account if max attempts reached
        if (attempts >= this.MAX_LOGIN_ATTEMPTS) {
          const lockoutTime = new Date();
          lockoutTime.setMinutes(lockoutTime.getMinutes() + this.LOCKOUT_DURATION_MINUTES);
          lockedUntil = lockoutTime;
          
          // Log security event
          await this.logSecurityEvent(user.id, 'ACCOUNT_LOCKED', {
            reason: 'Too many failed login attempts',
            lockedUntil: lockoutTime
          });
        }
        
        await db.update(users)
          .set({ 
            loginAttempts: { 
              count: attempts, 
              lockedUntil 
            } 
          })
          .where(eq(users.id, user.id));
        
        return { 
          success: false, 
          message: lockedUntil 
            ? `Account locked due to too many failed attempts. Try again after ${lockedUntil.toLocaleString()}`
            : 'Invalid credentials'
        };
      }
      
      // Reset login attempts on successful password verification
      await db.update(users)
        .set({ loginAttempts: { count: 0, lockedUntil: null } })
        .where(eq(users.id, user.id));
      
      // Check if MFA is enabled
      if (user.mfaSettings && user.mfaSettings.enabled) {
        // Generate temporary token for MFA verification
        const tempToken = jwt.sign(
          { userId: user.id, requiresMfa: true },
          this.JWT_SECRET,
          { expiresIn: '5m' }
        );
        
        return {
          success: true,
          requiresMfa: true,
          tempToken,
          userId: user.id
        };
      }
      
      // Generate tokens if MFA not enabled
      const { accessToken, refreshToken } = await this.generateTokens(user, uuidv4());
      
      // Create session
      await this.createSession(user.id, refreshToken);
      
      // Log successful login
      await this.logSecurityEvent(user.id, 'LOGIN_SUCCESS', {
        method: 'password'
      });
      
      return {
        success: true,
        accessToken,
        refreshToken,
        userId: user.id
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, message: 'Authentication failed' };
    }
  }
  
  /**
   * Verify MFA token for second factor authentication
   */
  async verifyMfaToken(userId: string, token: string, tempToken: string): Promise<{
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    message?: string;
  }> {
    try {
      // Verify temp token
      const decoded = jwt.verify(tempToken, this.JWT_SECRET) as { userId: string, requiresMfa: boolean };
      
      if (!decoded || decoded.userId !== userId || !decoded.requiresMfa) {
        return { success: false, message: 'Invalid session' };
      }
      
      // Get user MFA settings
      const mfaSetting = await db.query.mfaSettings.findFirst({
        where: eq(mfaSettings.userId, userId)
      });
      
      if (!mfaSetting || !mfaSetting.secret) {
        return { success: false, message: 'MFA not configured properly' };
      }
      
      // Verify token
      const isValid = speakeasy.totp.verify({
        secret: mfaSetting.secret,
        encoding: 'base32',
        token,
        window: 1 // Allow 1 period before/after for clock drift
      });
      
      if (!isValid) {
        await this.logSecurityEvent(userId, 'MFA_FAILED', {
          method: 'totp'
        });
        return { success: false, message: 'Invalid MFA token' };
      }
      
      // Get user for token generation
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      
      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user, uuidv4());
      
      // Create session
      await this.createSession(userId, refreshToken);
      
      // Log successful MFA verification
      await this.logSecurityEvent(userId, 'MFA_SUCCESS', {
        method: 'totp'
      });
      
      return {
        success: true,
        accessToken,
        refreshToken
      };
    } catch (error) {
      console.error('MFA verification error:', error);
      return { success: false, message: 'MFA verification failed' };
    }
  }
  
  /**
   * Setup MFA for a user
   */
  async setupMfa(userId: string): Promise<{
    success: boolean;
    qrCode?: string;
    secret?: string;
    message?: string;
  }> {
    try {
      // Generate new secret
      const secret = speakeasy.generateSecret({
        name: `Renexus:${userId}`,
        length: 20
      });
      
      // Generate QR code
      const qrCode = await qrcode.toDataURL(secret.otpauth_url || '');
      
      // Save secret to database (not enabled yet until verified)
      await db.insert(mfaSettings)
        .values({
          id: uuidv4(),
          userId,
          secret: secret.base32,
          enabled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .onConflictDoUpdate({
          target: mfaSettings.userId,
          set: {
            secret: secret.base32,
            enabled: false,
            updatedAt: new Date()
          }
        });
      
      return {
        success: true,
        qrCode,
        secret: secret.base32
      };
    } catch (error) {
      console.error('MFA setup error:', error);
      return { success: false, message: 'Failed to setup MFA' };
    }
  }
  
  /**
   * Verify and enable MFA after setup
   */
  async enableMfa(userId: string, token: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // Get MFA settings
      const mfaSetting = await db.query.mfaSettings.findFirst({
        where: eq(mfaSettings.userId, userId)
      });
      
      if (!mfaSetting || !mfaSetting.secret) {
        return { success: false, message: 'MFA not set up' };
      }
      
      // Verify token
      const isValid = speakeasy.totp.verify({
        secret: mfaSetting.secret,
        encoding: 'base32',
        token,
        window: 1
      });
      
      if (!isValid) {
        return { success: false, message: 'Invalid verification code' };
      }
      
      // Enable MFA
      await db.update(mfaSettings)
        .set({ enabled: true, updatedAt: new Date() })
        .where(eq(mfaSettings.userId, userId));
      
      // Log MFA enablement
      await this.logSecurityEvent(userId, 'MFA_ENABLED', {});
      
      return { success: true };
    } catch (error) {
      console.error('MFA enable error:', error);
      return { success: false, message: 'Failed to enable MFA' };
    }
  }
  
  /**
   * Disable MFA for a user
   */
  async disableMfa(userId: string, password: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // Verify password first for security
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!user) {
        return { success: false, message: 'User not found' };
      }
      
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid password' };
      }
      
      // Disable MFA
      await db.update(mfaSettings)
        .set({ enabled: false, updatedAt: new Date() })
        .where(eq(mfaSettings.userId, userId));
      
      // Log MFA disablement
      await this.logSecurityEvent(userId, 'MFA_DISABLED', {});
      
      return { success: true };
    } catch (error) {
      console.error('MFA disable error:', error);
      return { success: false, message: 'Failed to disable MFA' };
    }
  }
  
  /**
   * Initiate password reset process
   */
  async initiatePasswordReset(email: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, email)
      });
      
      if (!user) {
        // Return success even if user not found to prevent email enumeration
        return { success: true };
      }
      
      // Generate reset token
      const resetToken = uuidv4();
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry
      
      // Save reset token
      await db.update(users)
        .set({ 
          resetToken, 
          resetTokenExpiry: resetTokenExpiry.toISOString() 
        })
        .where(eq(users.id, user.id));
      
      // In a real implementation, send email with reset link
      // For this implementation, we'll just log it
      console.log(`Password reset token for ${email}: ${resetToken}`);
      
      // Log password reset request
      await this.logSecurityEvent(user.id, 'PASSWORD_RESET_REQUESTED', {});
      
      return { success: true };
    } catch (error) {
      console.error('Password reset initiation error:', error);
      return { success: false, message: 'Failed to initiate password reset' };
    }
  }
  
  /**
   * Complete password reset with token verification
   */
  async completePasswordReset(token: string, newPassword: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // Find user by reset token
      const user = await db.query.users.findFirst({
        where: eq(users.resetToken, token)
      });
      
      if (!user || !user.resetTokenExpiry) {
        return { success: false, message: 'Invalid or expired reset token' };
      }
      
      // Check if token is expired
      const tokenExpiry = new Date(user.resetTokenExpiry);
      if (tokenExpiry < new Date()) {
        return { success: false, message: 'Reset token has expired' };
      }
      
      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      // Update password and clear reset token
      await db.update(users)
        .set({ 
          passwordHash, 
          resetToken: null, 
          resetTokenExpiry: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, user.id));
      
      // Invalidate all existing sessions for security
      await db.delete(userSessions)
        .where(eq(userSessions.userId, user.id));
      
      // Log password reset completion
      await this.logSecurityEvent(user.id, 'PASSWORD_RESET_COMPLETED', {});
      
      return { success: true };
    } catch (error) {
      console.error('Password reset completion error:', error);
      return { success: false, message: 'Failed to reset password' };
    }
  }
  
  /**
   * Generate new access and refresh tokens
   */
  private async generateTokens(user: any, sessionId: string): Promise<TokenResponse> {
    // Create base payload
    const basePayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      sessionId
    };

    // Generate access token with shorter expiry
    const accessToken = jwt.sign(
      { ...basePayload, type: 'access' },
      this.JWT_SECRET,
      {
        expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
        issuer: 'renexus-auth',
        audience: 'renexus-api'
      }
    );

    // Generate refresh token with longer expiry
    const refreshToken = jwt.sign(
      { ...basePayload, type: 'refresh' },
      this.JWT_REFRESH_SECRET,
      {
        expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
        issuer: 'renexus-auth',
        audience: 'renexus-api'
      }
    );

    // Calculate expiry in seconds
    const expiresIn = parseInt(this.ACCESS_TOKEN_EXPIRES_IN) || 900; // Default 15 minutes

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }
  
  /**
   * Verify and decode a JWT token
   */
  public async verifyToken(token: string, type: 'access' | 'refresh' = 'access'): Promise<TokenPayload> {
    try {
      // Use appropriate secret based on token type
      const secret = type === 'access' ? this.JWT_SECRET : this.JWT_REFRESH_SECRET;
      
      // Verify token
      const decoded = jwt.verify(token, secret) as TokenPayload;
      
      // Validate token type
      if (decoded.type !== type) {
        throw new Error(`Invalid token type. Expected ${type} token.`);
      }

      // Check if session is still valid
      const session = await db.query.userSessions.findFirst({
        where: eq(userSessions.id, decoded.sessionId)
      });

      if (!session || !session.isActive || new Date(session.expiresAt) < new Date()) {
        throw new Error('Session expired or invalid');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }
  
  /**
   * Refresh access token using refresh token
   */
  public async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    try {
      // Verify refresh token
      const decoded = await this.verifyToken(refreshToken, 'refresh');
      
      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.userId)
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new token pair
      return await this.generateTokens(user, decoded.sessionId);
    } catch (error) {
      throw new Error('Failed to refresh token: ' + error.message);
    }
  }
  
  /**
   * Invalidate a session and its tokens
   */
  public async invalidateSession(sessionId: string): Promise<void> {
    await db.update(userSessions)
      .set({ 
        isActive: false,
        lastActivityAt: new Date()
      })
      .where(eq(userSessions.id, sessionId));
  }
  
  /**
   * Create a new session for a user
   */
  private async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await db.insert(userSessions).values({
      id: sessionId,
      userId,
      ipAddress,
      userAgent,
      isActive: true,
      expiresAt,
      lastActivityAt: new Date()
    });

    return sessionId;
  }
  
  /**
   * Log security events for audit purposes
   */
  private async logSecurityEvent(userId: string, eventType: string, details: any): Promise<void> {
    await db.insert({
      table: 'security_events',
      values: {
        id: uuidv4(),
        userId,
        eventType,
        details: JSON.stringify(details),
        ipAddress: '0.0.0.0', // In a real implementation, get from request
        userAgent: 'Unknown', // In a real implementation, get from request
        createdAt: new Date()
      }
    });
  }

  /**
   * Hash a password securely using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Validate password complexity
   */
  private validatePasswordComplexity(password: string): { isValid: boolean; message?: string } {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return { isValid: false, message: `Password must be at least ${minLength} characters long` };
    }
    if (!hasUpperCase) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!hasLowerCase) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!hasNumbers) {
      return { isValid: false, message: 'Password must contain at least one number' };
    }
    if (!hasSpecialChar) {
      return { isValid: false, message: 'Password must contain at least one special character' };
    }

    return { isValid: true };
  }

  /**
   * Verify password against stored hash
   */
  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Change user password with validation
   */
  public async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Verify current password
      const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return { success: false, message: 'Current password is incorrect' };
      }

      // Validate new password complexity
      const passwordValidation = this.validatePasswordComplexity(newPassword);
      if (!passwordValidation.isValid) {
        return { success: false, message: passwordValidation.message };
      }

      // Hash new password
      const newPasswordHash = await this.hashPassword(newPassword);

      // Update password
      await db.update(users)
        .set({ 
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Invalidate all existing sessions for security
      await db.update(userSessions)
        .set({ isActive: false })
        .where(eq(userSessions.userId, userId));

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, message: 'Failed to update password' };
    }
  }

  /**
   * Enhanced user registration with password validation
   */
  public async registerUser(email: string, password: string, firstName: string, lastName: string): Promise<{ success: boolean; message?: string; userId?: string }> {
    try {
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email)
      });

      if (existingUser) {
        return { success: false, message: 'Email already registered' };
      }

      // Validate password complexity
      const passwordValidation = this.validatePasswordComplexity(password);
      if (!passwordValidation.isValid) {
        return { success: false, message: passwordValidation.message };
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Create user
      const userId = uuidv4();
      await db.insert(users).values({
        id: userId,
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return { success: true, userId };
    } catch (error) {
      console.error('User registration error:', error);
      return { success: false, message: 'Registration failed' };
    }
  }
}

export default new AuthenticationService();
