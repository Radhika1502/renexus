import { db } from '../../database/db';
import { users, sessions, tenantUsers } from '../../database/schema/unified_schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { z } from 'zod';

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
const SALT_ROUNDS = 10;

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  tenantId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  tenantId: z.string().uuid().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Authentication Service
 * Handles user registration, login, session management, and multi-tenant authentication
 */
export class AuthService {
  /**
   * Register a new user
   * @param userData User registration data
   * @returns Newly created user (without password)
   */
  async register(userData: RegisterInput) {
    try {
      // Validate input
      registerSchema.parse(userData);
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, userData.email),
      });
      
      if (existingUser) {
        throw new Error('User already exists');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
      
      // Create user
      const userId = uuidv4();
      const newUser = await db.insert(users).values({
        id: userId,
        email: userData.email,
        name: userData.name,
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
      });
      
      // If tenantId is provided, associate user with tenant
      if (userData.tenantId) {
        await db.insert(tenantUsers).values({
          id: uuidv4(),
          userId: userId,
          tenantId: userData.tenantId,
          role: 'user', // Default role
          createdAt: new Date(),
        });
      }
      
      return newUser[0];
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  /**
   * Login a user
   * @param loginData User login credentials
   * @returns JWT token and user data
   */
  async login(loginData: LoginInput) {
    try {
      // Validate input
      loginSchema.parse(loginData);
      
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(users.email, loginData.email),
      });
      
      if (!user || !user.passwordHash) {
        throw new Error('Invalid credentials');
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }
      
      // If tenantId is provided, verify user belongs to tenant
      if (loginData.tenantId) {
        const tenantUser = await db.query.tenantUsers.findFirst({
          where: (fields) => {
            return eq(fields.userId, user.id) && eq(fields.tenantId, loginData.tenantId);
          },
        });
        
        if (!tenantUser) {
          throw new Error('User does not belong to this tenant');
        }
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          tenantId: loginData.tenantId
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      
      // Create session
      const sessionId = uuidv4();
      await db.insert(sessions).values({
        sid: sessionId,
        sess: {
          userId: user.id,
          email: user.email,
          tenantId: loginData.tenantId,
        },
        expire: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
      });
      
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        sessionId,
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  /**
   * Verify JWT token
   * @param token JWT token
   * @returns Decoded token payload
   */
  verifyToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
  
  /**
   * Logout user by invalidating session
   * @param sessionId Session ID
   */
  async logout(sessionId: string) {
    try {
      await db.delete(sessions).where(eq(sessions.sid, sessionId));
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
  
  /**
   * Get user by ID
   * @param userId User ID
   * @returns User data
   */
  async getUserById(userId: string) {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Remove sensitive data
      const { passwordHash, ...userData } = user;
      return userData;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }
  
  /**
   * Get user's tenants
   * @param userId User ID
   * @returns List of tenants the user belongs to
   */
  async getUserTenants(userId: string) {
    try {
      const userTenantRelations = await db.query.tenantUsers.findMany({
        where: eq(tenantUsers.userId, userId),
        with: {
          tenant: true,
        },
      });
      
      return userTenantRelations.map(relation => ({
        ...relation.tenant,
        role: relation.role,
      }));
    } catch (error) {
      console.error('Get user tenants error:', error);
      throw error;
    }
  }
  
  /**
   * Change user password
   * @param userId User ID
   * @param currentPassword Current password
   * @param newPassword New password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      
      if (!user || !user.passwordHash) {
        throw new Error('User not found');
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      
      // Update password
      await db.update(users)
        .set({ 
          passwordHash: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
      
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
