import { db } from '../../database/db';
import { teams, teamMembers, users } from '../../database/schema/unified_schema';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

/**
 * Team creation schema validation
 */
export const createTeamSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().optional(),
  tenantId: z.string().uuid(),
  createdBy: z.string().uuid(),
});

/**
 * Team update schema validation
 */
export const updateTeamSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().optional(),
});

/**
 * Team member schema validation
 */
export const teamMemberSchema = z.object({
  role: z.enum(['member', 'lead', 'admin']),
});

/**
 * Team Service
 * Handles team management operations
 */
class TeamService {
  /**
   * Create a new team
   * @param data Team data
   * @returns Created team
   */
  async createTeam(data: z.infer<typeof createTeamSchema>) {
    const teamId = uuidv4();
    
    // Create team
    const [team] = await db.insert(teams).values({
      id: teamId,
      name: data.name,
      description: data.description || null,
      tenantId: data.tenantId,
      createdBy: data.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    // Add creator as team admin
    await db.insert(teamMembers).values({
      id: uuidv4(),
      teamId: teamId,
      userId: data.createdBy,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    return team;
  }
  
  /**
   * Get team by ID
   * @param teamId Team ID
   * @param tenantId Tenant ID
   * @returns Team or null if not found
   */
  async getTeamById(teamId: string, tenantId: string) {
    const team = await db.query.teams.findFirst({
      where: and(
        eq(teams.id, teamId),
        eq(teams.tenantId, tenantId)
      ),
    });
    
    if (!team) {
      throw new Error('Team not found');
    }
    
    return team;
  }
  
  /**
   * Update team
   * @param teamId Team ID
   * @param data Team data to update
   * @param tenantId Tenant ID
   * @returns Updated team
   */
  async updateTeam(teamId: string, data: z.infer<typeof updateTeamSchema>, tenantId: string) {
    const team = await this.getTeamById(teamId, tenantId);
    
    const [updatedTeam] = await db.update(teams)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(
        eq(teams.id, teamId),
        eq(teams.tenantId, tenantId)
      ))
      .returning();
    
    return updatedTeam;
  }
  
  /**
   * Delete team
   * @param teamId Team ID
   * @param tenantId Tenant ID
   */
  async deleteTeam(teamId: string, tenantId: string) {
    const team = await this.getTeamById(teamId, tenantId);
    
    // Delete team members first (cascade not handled by ORM)
    await db.delete(teamMembers)
      .where(eq(teamMembers.teamId, teamId));
    
    // Delete team
    await db.delete(teams)
      .where(and(
        eq(teams.id, teamId),
        eq(teams.tenantId, tenantId)
      ));
  }
  
  /**
   * Get teams by tenant
   * @param tenantId Tenant ID
   * @param page Page number
   * @param limit Items per page
   * @returns Teams and total count
   */
  async getTeamsByTenant(tenantId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    
    const teamsResult = await db.query.teams.findMany({
      where: eq(teams.tenantId, tenantId),
      limit,
      offset,
      orderBy: teams.createdAt,
    });
    
    const totalCount = await db.select({ count: teams.id })
      .from(teams)
      .where(eq(teams.tenantId, tenantId))
      .then(result => result.length);
    
    return {
      teams: teamsResult,
      total: totalCount,
    };
  }
  
  /**
   * Add member to team
   * @param teamId Team ID
   * @param userId User ID
   * @param role Member role
   * @param tenantId Tenant ID
   * @returns Team member
   */
  async addTeamMember(teamId: string, userId: string, role: string, tenantId: string) {
    // Verify team exists and belongs to tenant
    await this.getTeamById(teamId, tenantId);
    
    // Verify user exists and belongs to tenant
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user is already a member
    const existingMember = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      ),
    });
    
    if (existingMember) {
      throw new Error('User is already a member of this team');
    }
    
    // Add user to team
    const [teamMember] = await db.insert(teamMembers).values({
      id: uuidv4(),
      teamId,
      userId,
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    return teamMember;
  }
  
  /**
   * Remove member from team
   * @param teamId Team ID
   * @param userId User ID
   * @param tenantId Tenant ID
   */
  async removeTeamMember(teamId: string, userId: string, tenantId: string) {
    // Verify team exists and belongs to tenant
    await this.getTeamById(teamId, tenantId);
    
    // Remove user from team
    const result = await db.delete(teamMembers)
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      ));
    
    if (result.rowCount === 0) {
      throw new Error('User is not a member of this team');
    }
  }
  
  /**
   * Update team member role
   * @param teamId Team ID
   * @param userId User ID
   * @param role New role
   * @param tenantId Tenant ID
   * @returns Updated team member
   */
  async updateTeamMemberRole(teamId: string, userId: string, role: string, tenantId: string) {
    // Verify team exists and belongs to tenant
    await this.getTeamById(teamId, tenantId);
    
    // Update user role
    const [updatedMember] = await db.update(teamMembers)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId)
      ))
      .returning();
    
    if (!updatedMember) {
      throw new Error('User is not a member of this team');
    }
    
    return updatedMember;
  }
  
  /**
   * Get team members
   * @param teamId Team ID
   * @param tenantId Tenant ID
   * @returns Team members with user details
   */
  async getTeamMembers(teamId: string, tenantId: string) {
    // Verify team exists and belongs to tenant
    await this.getTeamById(teamId, tenantId);
    
    // Get team members with user details
    const members = await db
      .select({
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        userId: teamMembers.userId,
        role: teamMembers.role,
        createdAt: teamMembers.createdAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));
    
    return members;
  }
  
  /**
   * Get teams by user
   * @param userId User ID
   * @param tenantId Tenant ID
   * @returns Teams the user is a member of
   */
  async getTeamsByUser(userId: string, tenantId: string) {
    const userTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        tenantId: teams.tenantId,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        role: teamMembers.role,
      })
      .from(teams)
      .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .where(and(
        eq(teamMembers.userId, userId),
        eq(teams.tenantId, tenantId)
      ));
    
    return userTeams;
  }
}

// Export singleton instance
export const teamService = new TeamService();
