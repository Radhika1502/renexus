import { eq, and, like, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { projectMembers } from '../schemas/database';
import { addMemberSchema, listMembersQuerySchema, updateMemberSchema } from '../schemas/member';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddMemberData {
  projectId: string;
  userId: string;
  role?: string;
}

export interface UpdateMemberData {
  role: string;
}

export interface ListMembersOptions {
  role?: string;
}

export class MemberService {
  async addMember(data: AddMemberData): Promise<ProjectMember | null> {
    let member = null;

    await db.transaction(async (tx) => {
      const memberId = uuidv4();
      
      const [created] = await tx.insert(projectMembers)
        .values({
          id: memberId,
          projectId: data.projectId,
          userId: data.userId,
          role: data.role || 'member',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      member = created;
    });

    return member;
  }

  async removeMember(projectId: string, userId: string): Promise<ProjectMember | null> {
    let member = null;

    await db.transaction(async (tx) => {
      // First check if the member exists
      const [existing] = await tx.select()
        .from(projectMembers)
        .where(and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        ))
        .limit(1);

      if (!existing) {
        return;
      }

      const [deleted] = await tx.delete(projectMembers)
        .where(and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        ))
        .returning();

      member = deleted;
    });

    return member;
  }

  async updateMember(projectId: string, userId: string, data: UpdateMemberData): Promise<ProjectMember | null> {
    let member = null;

    await db.transaction(async (tx) => {
      // First check if the member exists
      const [existing] = await tx.select()
        .from(projectMembers)
        .where(and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        ))
        .limit(1);

      if (!existing) {
        return;
      }

      const [updated] = await tx.update(projectMembers)
        .set({
          role: data.role,
          updatedAt: new Date(),
        })
        .where(and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.userId, userId)
        ))
        .returning();

      member = updated;
    });

    return member;
  }

  async listMembers(projectId: string, options: ListMembersOptions = {}): Promise<ProjectMember[]> {
    const conditions = [eq(projectMembers.projectId, projectId)];

    if (options.role) {
      conditions.push(eq(projectMembers.role, options.role));
    }

    const members = await db.select({
      id: projectMembers.id,
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
      createdAt: projectMembers.createdAt,
      updatedAt: projectMembers.updatedAt,
    })
      .from(projectMembers)
      .where(and(...conditions))
      .orderBy(desc(projectMembers.createdAt));

    return members.map(member => ({
      ...member,
      createdAt: member.createdAt || new Date(),
      updatedAt: member.updatedAt || new Date(),
    }));
  }

  async getMember(projectId: string, userId: string): Promise<ProjectMember | null> {
    const [member] = await db.select({
      id: projectMembers.id,
      projectId: projectMembers.projectId,
      userId: projectMembers.userId,
      role: projectMembers.role,
      createdAt: projectMembers.createdAt,
      updatedAt: projectMembers.updatedAt,
    })
      .from(projectMembers)
      .where(and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId)
      ))
      .limit(1);

    if (!member) return null;

    return {
      ...member,
      createdAt: member.createdAt || new Date(),
      updatedAt: member.updatedAt || new Date(),
    };
  }
}

// Export singleton instance
export const memberService = new MemberService(); 