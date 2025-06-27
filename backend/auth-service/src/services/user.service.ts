import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '@renexus/api-types';
import { db } from '../config/database';
import { users } from '../models/schema';
import { eq } from 'drizzle-orm';

interface CreateUserParams {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  organizationId: string;
}

interface UpdateUserParams {
  name?: string;
  email?: string;
}

export class UserService {
  /**
   * Find user by ID
   */
  public async findById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  /**
   * Find user by email
   */
  public async findByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  /**
   * Find all users
   */
  public async findAll(): Promise<Omit<User, 'passwordHash'>[]> {
    const result = await db.select().from(users);
    
    // Remove password hash from users
    return result.map(user => {
      const { passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  /**
   * Create a new user
   */
  public async create(params: CreateUserParams): Promise<Omit<User, 'passwordHash'>> {
    const { email, password, name, role, organizationId } = params;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Create user
    const newUser: User = {
      id: uuidv4(),
      email,
      passwordHash,
      name,
      role,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: {},
    };
    
    await db.insert(users).values(newUser);
    
    // Remove password hash before returning
    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  /**
   * Update user
   */
  public async update(
    id: string,
    params: UpdateUserParams
  ): Promise<Omit<User, 'passwordHash'>> {
    const { name, email } = params;
    
    // Get current user
    const currentUser = await this.findById(id);
    if (!currentUser) {
      throw new Error('User not found');
    }
    
    // Update user
    const updatedUser = {
      ...currentUser,
      name: name || currentUser.name,
      email: email || currentUser.email,
      updatedAt: new Date(),
    };
    
    await db
      .update(users)
      .set({
        name: updatedUser.name,
        email: updatedUser.email,
        updatedAt: updatedUser.updatedAt,
      })
      .where(eq(users.id, id));
    
    // Remove password hash before returning
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Update user password
   */
  public async updatePassword(id: string, newPassword: string): Promise<void> {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  /**
   * Verify user password
   */
  public async verifyPassword(id: string, password: string): Promise<boolean> {
    // Get user
    const user = await this.findById(id);
    if (!user) {
      return false;
    }
    
    // Compare password
    return bcrypt.compare(password, user.passwordHash);
  }

  /**
   * Update user preferences
   */
  public async updatePreferences(
    id: string,
    preferences: Record<string, any>
  ): Promise<Omit<User, 'passwordHash'>> {
    // Get current user
    const currentUser = await this.findById(id);
    if (!currentUser) {
      throw new Error('User not found');
    }
    
    // Merge preferences
    const updatedPreferences = {
      ...currentUser.preferences,
      ...preferences,
    };
    
    // Update user
    const updatedUser = {
      ...currentUser,
      preferences: updatedPreferences,
      updatedAt: new Date(),
    };
    
    await db
      .update(users)
      .set({
        preferences: updatedPreferences,
        updatedAt: updatedUser.updatedAt,
      })
      .where(eq(users.id, id));
    
    // Remove password hash before returning
    const { passwordHash, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Delete user
   */
  public async delete(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }
}
