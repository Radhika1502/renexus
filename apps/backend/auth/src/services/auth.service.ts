import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from './user.service';
import { TokenService } from './token.service';
import { User, UserRole } from '@renexus/api-types';

interface RegisterParams {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
}

interface TokenPair {
  token: string;
  refreshToken: string;
  expiresAt: number;
}

interface TokenVerificationResult {
  valid: boolean;
  userId?: string;
}

export class AuthService {
  private userService: UserService;
  private tokenService: TokenService;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor() {
    this.userService = new UserService();
    this.tokenService = new TokenService();
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1h';
  }

  /**
   * Register a new user
   */
  public async register(params: RegisterParams): Promise<Omit<User, 'passwordHash'>> {
    const { email, password, name, organizationName } = params;

    // Create organization if name provided
    let organizationId = '';
    if (organizationName) {
      // In a real implementation, this would create an organization
      organizationId = uuidv4();
    }

    // Create user
    const user = await this.userService.create({
      email,
      password,
      name,
      role: UserRole.ADMIN, // First user is admin
      organizationId: organizationId || uuidv4(),
    });

    return user;
  }

  /**
   * Generate JWT and refresh tokens
   */
  public generateTokens(user: Omit<User, 'passwordHash'>): TokenPair {
    // Generate access token
    const expiresIn = this.jwtExpiresIn;
    const token = jwt.sign({ sub: user.id, role: user.role }, this.jwtSecret, {
      expiresIn,
    });

    // Calculate expiration time
    const expiresAt = Math.floor(Date.now() / 1000) + parseInt(expiresIn) * 3600;

    // Generate refresh token
    const refreshToken = uuidv4();

    return {
      token,
      refreshToken,
      expiresAt,
    };
  }

  /**
   * Store refresh token
   */
  public async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.tokenService.storeRefreshToken(userId, refreshToken);
  }

  /**
   * Verify refresh token
   */
  public async verifyRefreshToken(refreshToken: string): Promise<TokenVerificationResult> {
    const token = await this.tokenService.findRefreshToken(refreshToken);

    if (!token) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: token.userId,
    };
  }

  /**
   * Rotate refresh token
   */
  public async rotateRefreshToken(
    userId: string,
    oldToken: string,
    newToken: string
  ): Promise<void> {
    await this.tokenService.rotateRefreshToken(userId, oldToken, newToken);
  }

  /**
   * Revoke refresh token
   */
  public async revokeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.tokenService.revokeRefreshToken(userId, refreshToken);
  }

  /**
   * Generate password reset token
   */
  public async generatePasswordResetToken(userId: string): Promise<string> {
    const resetToken = uuidv4();
    await this.tokenService.storePasswordResetToken(userId, resetToken);
    return resetToken;
  }

  /**
   * Verify password reset token
   */
  public async verifyPasswordResetToken(token: string): Promise<TokenVerificationResult> {
    const resetToken = await this.tokenService.findPasswordResetToken(token);

    if (!resetToken) {
      return { valid: false };
    }

    return {
      valid: true,
      userId: resetToken.userId,
    };
  }

  /**
   * Revoke password reset token
   */
  public async revokePasswordResetToken(token: string): Promise<void> {
    await this.tokenService.revokePasswordResetToken(token);
  }
}
