import { db } from '../../database/db';
import { users, tenantUsers, teams, teamMembers } from '../../database/schema/unified_schema';
import { eq, and, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { z } from 'zod';

// Validation schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8).optional(),
  role: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  tenantId: z.string().uuid(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * User Management Service
 * Handles user CRUD operations, tenant associations, and team memberships
 */
export class UserService {
  /**
   * Create a new user and associate with tenant
   * @param userData User data
   * @returns Created user
   */
  async createUser(userData: CreateUserInput) {
    try {
      // Validate input
      createUserSchema.parse(userData);
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, userData.email),
      });
      
      let userId: string;
      
      // If user exists, check if they're already in the tenant
      if (existingUser) {
        userId = existingUser.id;
        
        const existingTenantUser = await db.query.tenantUsers.findFirst({
          where: and(
            eq(tenantUsers.userId, userId),
            eq(tenantUsers.tenantId, userData.tenantId)
          ),
        });
        
        if (existingTenantUser) {
          throw new Error('User already exists in this tenant');
        }
      } else {
        // Create new user
        userId = uuidv4();
        
        // Generate random password if not provided
        const password = userData.password || Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 10);
        
        await db.insert(users).values({
          id: userId,
          email: userData.email,
          name: userData.name,
          passwordHash: hashedPassword,
          avatarUrl: userData.avatarUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      
      // Associate user with tenant
      await db.insert(tenantUsers).values({
        id: uuidv4(),
        userId: userId,
        tenantId: userData.tenantId,
        role: userData.role || 'user',
        createdAt: new Date(),
      });
      
      // Get user with tenant role
      const user = await this.getUserById(userId, userData.tenantId);
      return user;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }
  
  /**
   * Get user by ID with tenant role
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns User with tenant role
   */
  async getUserById(userId: string, tenantId?: string) {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Remove sensitive data
      const { passwordHash, ...userData } = user;
      
      // Get tenant role if tenantId is provided
      if (tenantId) {
        const tenantUser = await db.query.tenantUsers.findFirst({
          where: and(
            eq(tenantUsers.userId, userId),
            eq(tenantUsers.tenantId, tenantId)
          ),
        });
        
        if (tenantUser) {
          return {
            ...userData,
            role: tenantUser.role,
          };
        }
      }
      
      return userData;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }
  
  /**
   * Update user
   * @param userId User ID
   * @param userData User data to update
   * @param tenantId Optional tenant ID for role updates
   * @returns Updated user
   */
  async updateUser(userId: string, userData: UpdateUserInput, tenantId?: string) {
    try {
      // Validate input
      updateUserSchema.parse(userData);
      
      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      
      if (!existingUser) {
        throw new Error('User not found');
      }
      
      // Update user fields
      const { role, ...userFields } = userData;
      
      if (Object.keys(userFields).length > 0) {
        await db.update(users)
          .set({
            ...userFields,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }
      
      // Update role if tenantId is provided
      if (role && tenantId) {
        await db.update(tenantUsers)
          .set({ role })
          .where(and(
            eq(tenantUsers.userId, userId),
            eq(tenantUsers.tenantId, tenantId)
          ));
      }
      
      // Get updated user
      return this.getUserById(userId, tenantId);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }
  
  /**
   * Delete user from tenant
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Success status
   */
  async deleteUserFromTenant(userId: string, tenantId: string) {
    try {
      // Delete user from tenant
      await db.delete(tenantUsers)
        .where(and(
          eq(tenantUsers.userId, userId),
          eq(tenantUsers.tenantId, tenantId)
        ));
      
      // Remove from all teams in this tenant
      await db.delete(teamMembers)
        .where(and(
          eq(teamMembers.userId, userId),
          eq(teamMembers.tenantId, tenantId)
        ));
      
      return { success: true };
    } catch (error) {
      console.error('Delete user from tenant error:', error);
      throw error;
    }
  }
  
  /**
   * Get users by tenant
   * @param tenantId Tenant ID
   * @param page Page number
   * @param limit Items per page
   * @returns Paginated list of users
   */
  async getUsersByTenant(tenantId: string, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      // Get tenant users
      const tenantUsersList = await db.query.tenantUsers.findMany({
        where: eq(tenantUsers.tenantId, tenantId),
        limit,
        offset,
      });
      
      const userIds = tenantUsersList.map(tu => tu.userId);
      
      if (userIds.length === 0) {
        return { users: [], total: 0 };
      }
      
      // Get user details
      const usersList = await db.query.users.findMany({
        where: inArray(users.id, userIds),
      });
      
      // Combine user details with tenant roles
      const usersWithRoles = usersList.map(user => {
        const tenantUser = tenantUsersList.find(tu => tu.userId === user.id);
        const { passwordHash, ...userData } = user;
        
        return {
          ...userData,
          role: tenantUser?.role || 'user',
        };
      });
      
      // Get total count
      const { count } = await db
        .select({ count: db.fn.count() })
        .from(tenantUsers)
        .where(eq(tenantUsers.tenantId, tenantId))
        .then(res => res[0]);
      
      return {
        users: usersWithRoles,
        total: Number(count),
      };
    } catch (error) {
      console.error('Get users by tenant error:', error);
      throw error;
    }
  }
  
  /**
   * Add user to team
   * @param userId User ID
   * @param teamId Team ID
   * @param role Team role
   * @returns Team member
   */
  async addUserToTeam(userId: string, teamId: string, role = 'member') {
    try {
      // Check if user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if team exists
      const team = await db.query.teams.findFirst({
        where: eq(teams.id, teamId),
      });
      
      if (!team) {
        throw new Error('Team not found');
      }
      
      // Check if user is already in team
      const existingMember = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.userId, userId),
          eq(teamMembers.teamId, teamId)
        ),
      });
      
      if (existingMember) {
        throw new Error('User is already a member of this team');
      }
      
      // Add user to team
      const teamMember = await db.insert(teamMembers).values({
        id: uuidv4(),
        userId,
        teamId,
        tenantId: team.tenantId,
        role,
        createdAt: new Date(),
      }).returning();
      
      return teamMember[0];
    } catch (error) {
      console.error('Add user to team error:', error);
      throw error;
    }
  }
  
  /**
   * Remove user from team
   * @param userId User ID
   * @param teamId Team ID
   * @returns Success status
   */
  async removeUserFromTeam(userId: string, teamId: string) {
    try {
      // Remove user from team
      await db.delete(teamMembers)
        .where(and(
          eq(teamMembers.userId, userId),
          eq(teamMembers.teamId, teamId)
        ));
      
      return { success: true };
    } catch (error) {
      console.error('Remove user from team error:', error);
      throw error;
    }
  }
  
  /**
   * Get user's teams
   * @param userId User ID
   * @param tenantId Optional tenant ID to filter teams
   * @returns List of teams
   */
  async getUserTeams(userId: string, tenantId?: string) {
    try {
      let query = db.query.teamMembers.findMany({
        where: eq(teamMembers.userId, userId),
        with: {
          team: true,
        },
      });
      
      if (tenantId) {
        query = db.query.teamMembers.findMany({
          where: and(
            eq(teamMembers.userId, userId),
            eq(teamMembers.tenantId, tenantId)
          ),
          with: {
            team: true,
          },
        });
      }
      
      const teamMemberships = await query;
      
      return teamMemberships.map(membership => ({
        ...membership.team,
        role: membership.role,
      }));
    } catch (error) {
      console.error('Get user teams error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const userService = new UserService();
