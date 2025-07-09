import { db } from '../db';
import { eq, desc, like, and, sql } from 'drizzle-orm';
import { projects } from '../schemas/database';
import { v4 as uuidv4 } from 'uuid';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  tenantId: string;
  createdById: string;
  teamId: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  tenantId: string;
  createdById: string;
  teamId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: string;
  teamId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface ListProjectsOptions {
  tenantId: string;
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export class ProjectService {
  async createProject(data: CreateProjectData): Promise<Project> {
    const projectId = uuidv4();
    
    const [project] = await db.insert(projects)
      .values({
        id: projectId,
        name: data.name,
        description: data.description || null,
        status: 'active',
        tenantId: data.tenantId,
        createdById: data.createdById,
        teamId: data.teamId || null,
        startDate: data.startDate || null,
        endDate: data.endDate || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return project;
  }

  async getProjectById(id: string, tenantId: string): Promise<Project | null> {
    const [project] = await db.select()
      .from(projects)
      .where(
        sql`${projects.id} = ${id} AND ${projects.tenantId} = ${tenantId}`
      )
      .limit(1);

    return project || null;
  }

  async updateProject(id: string, tenantId: string, data: UpdateProjectData): Promise<Project | null> {
    let project = null;

    await db.transaction(async (tx) => {
      // First check if the project exists and belongs to the tenant
      const [existing] = await tx.select()
        .from(projects)
        .where(
          sql`${projects.id} = ${id} AND ${projects.tenantId} = ${tenantId}`
        )
        .limit(1);

      if (!existing) {
        return;
      }

      const [updated] = await tx.update(projects)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(
          sql`${projects.id} = ${id} AND ${projects.tenantId} = ${tenantId}`
        )
        .returning();

      project = updated;
    });

    return project;
  }

  async deleteProject(id: string, tenantId: string): Promise<Project | null> {
    let project = null;

    await db.transaction(async (tx) => {
      // First check if the project exists and belongs to the tenant
      const [existing] = await tx.select()
        .from(projects)
        .where(
          sql`${projects.id} = ${id} AND ${projects.tenantId} = ${tenantId}`
        )
        .limit(1);

      if (!existing) {
        return;
      }

      const [deleted] = await tx.delete(projects)
        .where(
          sql`${projects.id} = ${id} AND ${projects.tenantId} = ${tenantId}`
        )
        .returning();

      project = deleted;
    });

    return project;
  }

  async listProjects(options: ListProjectsOptions): Promise<Project[]> {
    let conditions = sql`${projects.tenantId} = ${options.tenantId}`;

    if (options.status) {
      conditions = sql`${conditions} AND ${projects.status} = ${options.status}`;
    }

    if (options.search) {
      conditions = sql`${conditions} AND ${projects.name} LIKE ${`%${options.search}%`}`;
    }

    const query = db.select()
      .from(projects)
      .where(conditions)
      .orderBy(sql`${projects.createdAt} DESC`);

    const finalQuery = options.limit
      ? query.limit(options.limit).offset(options.offset || 0)
      : query;

    return await finalQuery;
  }
}

export const projectService = new ProjectService(); 