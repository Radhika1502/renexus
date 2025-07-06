import { getDatabaseClient } from '../client';
import { withTransaction, TransactionContext } from '../transaction-manager';
import { logger } from '../logger';
import { getDatabaseUtils } from '../db-utils';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived' | 'completed';
  visibility: 'public' | 'private' | 'team';
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  tags?: string[];
  templateId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  status?: 'active' | 'archived' | 'completed';
  visibility?: 'public' | 'private' | 'team';
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  tags?: string[];
  templateId?: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  status?: 'active' | 'archived' | 'completed';
  visibility?: 'public' | 'private' | 'team';
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  tags?: string[];
}

export interface ProjectMember {
  userId: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: Date;
}

export interface ProjectFilter {
  status?: string[];
  visibility?: string[];
  dateRange?: { from?: Date; to?: Date };
  tags?: string[];
  search?: string;
  memberId?: string;
}

export interface ProjectSort {
  field: 'name' | 'startDate' | 'endDate' | 'createdAt' | 'updatedAt';
  direction: 'asc' | 'desc';
}

export interface ProjectPagination {
  page: number;
  pageSize: number;
}

export interface ProjectListResult {
  projects: Project[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  tasksByAssignee: Record<string, number>;
  timeSpent: number;
  timeEstimated: number;
  progress: number;
}

export class ProjectService {
  private client = getDatabaseClient();
  private utils = getDatabaseUtils();

  async createProject(project: ProjectCreate, userId: string): Promise<Project> {
    logger.info(`Creating project: ${project.name}`);

    return withTransaction(async (context: TransactionContext) => {
      // Create project
      const result = await context.client.sql`
        INSERT INTO projects (
          name,
          description,
          status,
          visibility,
          start_date,
          end_date,
          budget,
          tags,
          template_id,
          created_by,
          created_at,
          updated_at
        ) VALUES (
          ${project.name},
          ${project.description || null},
          ${project.status || 'active'},
          ${project.visibility || 'private'},
          ${project.startDate || null},
          ${project.endDate || null},
          ${project.budget || null},
          ${project.tags ? JSON.stringify(project.tags) : null},
          ${project.templateId || null},
          ${userId},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        RETURNING *
      `;

      const newProject = this.mapToProject(result[0]);

      // Add creator as admin
      await context.client.sql`
        INSERT INTO project_members (
          project_id,
          user_id,
          role,
          joined_at
        ) VALUES (
          ${newProject.id},
          ${userId},
          'admin',
          CURRENT_TIMESTAMP
        )
      `;

      // If using template, copy template items
      if (project.templateId) {
        await this.copyTemplateItems(context, project.templateId, newProject.id);
      }

      // Create project history entry
      await this.createProjectHistory(context, newProject.id, userId, 'created', null, newProject);

      return newProject;
    });
  }

  async updateProject(projectId: string, updates: ProjectUpdate, userId: string): Promise<Project> {
    logger.info(`Updating project: ${projectId}`);

    return withTransaction(async (context: TransactionContext) => {
      // Get current project state
      const currentProject = await this.getProjectById(projectId);
      if (!currentProject) {
        throw new Error(`Project ${projectId} not found`);
      }

      // Validate user has admin access
      await this.validateProjectAdmin(context, projectId, userId);

      // Update project
      const result = await context.client.sql`
        UPDATE projects
        SET
          name = ${updates.name || currentProject.name},
          description = ${updates.description !== undefined ? updates.description : currentProject.description},
          status = ${updates.status || currentProject.status},
          visibility = ${updates.visibility || currentProject.visibility},
          start_date = ${updates.startDate || currentProject.startDate},
          end_date = ${updates.endDate || currentProject.endDate},
          budget = ${updates.budget !== undefined ? updates.budget : currentProject.budget},
          tags = ${updates.tags ? JSON.stringify(updates.tags) : currentProject.tags},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${projectId}
        RETURNING *
      `;

      const updatedProject = this.mapToProject(result[0]);

      // Create project history entry
      await this.createProjectHistory(context, projectId, userId, 'updated', currentProject, updatedProject);

      return updatedProject;
    });
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    logger.info(`Deleting project: ${projectId}`);

    return withTransaction(async (context: TransactionContext) => {
      // Get project to validate access and create history
      const project = await this.getProjectById(projectId);
      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      // Validate user has admin access
      await this.validateProjectAdmin(context, projectId, userId);

      // Create project history entry before deletion
      await this.createProjectHistory(context, projectId, userId, 'deleted', project, null);

      // Delete all project data in correct order
      await context.client.sql`
        DELETE FROM task_history WHERE task_id IN (
          SELECT id FROM tasks WHERE project_id = ${projectId}
        )
      `;
      await context.client.sql`DELETE FROM tasks WHERE project_id = ${projectId}`;
      await context.client.sql`DELETE FROM project_members WHERE project_id = ${projectId}`;
      await context.client.sql`DELETE FROM projects WHERE id = ${projectId}`;
    });
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    const result = await this.client.sql`
      SELECT * FROM projects WHERE id = ${projectId}
    `;

    return result.length > 0 ? this.mapToProject(result[0]) : null;
  }

  async listProjects(
    filter: ProjectFilter,
    sort: ProjectSort = { field: 'createdAt', direction: 'desc' },
    pagination: ProjectPagination = { page: 1, pageSize: 20 }
  ): Promise<ProjectListResult> {
    // Build base query
    let query = this.client.sql`
      SELECT DISTINCT p.* FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE 1=1
    `;

    // Add filters
    if (filter.status && filter.status.length > 0) {
      query = query.append(this.client.sql` AND p.status = ANY(${filter.status})`);
    }
    if (filter.visibility && filter.visibility.length > 0) {
      query = query.append(this.client.sql` AND p.visibility = ANY(${filter.visibility})`);
    }
    if (filter.dateRange) {
      if (filter.dateRange.from) {
        query = query.append(this.client.sql` AND p.start_date >= ${filter.dateRange.from}`);
      }
      if (filter.dateRange.to) {
        query = query.append(this.client.sql` AND p.end_date <= ${filter.dateRange.to}`);
      }
    }
    if (filter.tags && filter.tags.length > 0) {
      query = query.append(this.client.sql` AND p.tags && ${filter.tags}`);
    }
    if (filter.search) {
      query = query.append(this.client.sql`
        AND (
          p.name ILIKE ${'%' + filter.search + '%'} OR
          p.description ILIKE ${'%' + filter.search + '%'}
        )
      `);
    }
    if (filter.memberId) {
      query = query.append(this.client.sql` AND pm.user_id = ${filter.memberId}`);
    }

    // Add sorting
    query = query.append(this.client.sql` ORDER BY p.${this.client.sql(sort.field)} ${this.client.sql(sort.direction)}`);

    // Add pagination
    const offset = (pagination.page - 1) * pagination.pageSize;
    query = query.append(this.client.sql` LIMIT ${pagination.pageSize} OFFSET ${offset}`);

    // Execute query
    const result = await query;
    const projects = result.map(this.mapToProject);

    // Get total count
    const countResult = await this.client.sql`
      SELECT COUNT(DISTINCT p.id) as total
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id
      WHERE 1=1
    `;
    const total = parseInt(countResult[0].total);

    return {
      projects,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  }

  async addProjectMember(projectId: string, userId: string, role: string, adminId: string): Promise<void> {
    logger.info(`Adding member ${userId} to project ${projectId}`);

    return withTransaction(async (context: TransactionContext) => {
      // Validate admin has access
      await this.validateProjectAdmin(context, projectId, adminId);

      // Check if user is already a member
      const existing = await context.client.sql`
        SELECT 1 FROM project_members
        WHERE project_id = ${projectId} AND user_id = ${userId}
      `;

      if (existing.length > 0) {
        throw new Error(`User ${userId} is already a member of project ${projectId}`);
      }

      // Add member
      await context.client.sql`
        INSERT INTO project_members (
          project_id,
          user_id,
          role,
          joined_at
        ) VALUES (
          ${projectId},
          ${userId},
          ${role},
          CURRENT_TIMESTAMP
        )
      `;
    });
  }

  async updateProjectMember(projectId: string, userId: string, role: string, adminId: string): Promise<void> {
    logger.info(`Updating member ${userId} role in project ${projectId}`);

    return withTransaction(async (context: TransactionContext) => {
      // Validate admin has access
      await this.validateProjectAdmin(context, projectId, adminId);

      // Update member role
      const result = await context.client.sql`
        UPDATE project_members
        SET role = ${role}
        WHERE project_id = ${projectId} AND user_id = ${userId}
      `;

      if (result.count === 0) {
        throw new Error(`User ${userId} is not a member of project ${projectId}`);
      }
    });
  }

  async removeProjectMember(projectId: string, userId: string, adminId: string): Promise<void> {
    logger.info(`Removing member ${userId} from project ${projectId}`);

    return withTransaction(async (context: TransactionContext) => {
      // Validate admin has access
      await this.validateProjectAdmin(context, projectId, adminId);

      // Check if removing last admin
      const admins = await context.client.sql`
        SELECT user_id FROM project_members
        WHERE project_id = ${projectId} AND role = 'admin'
      `;

      if (admins.length === 1 && admins[0].user_id === userId) {
        throw new Error('Cannot remove last project admin');
      }

      // Remove member
      await context.client.sql`
        DELETE FROM project_members
        WHERE project_id = ${projectId} AND user_id = ${userId}
      `;
    });
  }

  async getProjectStats(projectId: string): Promise<ProjectStats> {
    const result = await this.client.sql`
      WITH task_stats AS (
        SELECT
          COUNT(*) as total_tasks,
          COUNT(*) FILTER (WHERE status = 'done') as completed_tasks,
          COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status != 'done') as overdue_tasks,
          SUM(actual_hours) as time_spent,
          SUM(estimated_hours) as time_estimated,
          jsonb_object_agg(status, COUNT(*)) as tasks_by_status,
          jsonb_object_agg(priority, COUNT(*)) as tasks_by_priority,
          jsonb_object_agg(assignee_id, COUNT(*)) as tasks_by_assignee
        FROM tasks
        WHERE project_id = ${projectId}
        GROUP BY project_id
      )
      SELECT * FROM task_stats
    `;

    const stats = result[0] || {
      total_tasks: 0,
      completed_tasks: 0,
      overdue_tasks: 0,
      time_spent: 0,
      time_estimated: 0,
      tasks_by_status: {},
      tasks_by_priority: {},
      tasks_by_assignee: {},
    };

    return {
      totalTasks: parseInt(stats.total_tasks),
      completedTasks: parseInt(stats.completed_tasks),
      overdueTasks: parseInt(stats.overdue_tasks),
      tasksByStatus: stats.tasks_by_status || {},
      tasksByPriority: stats.tasks_by_priority || {},
      tasksByAssignee: stats.tasks_by_assignee || {},
      timeSpent: parseFloat(stats.time_spent) || 0,
      timeEstimated: parseFloat(stats.time_estimated) || 0,
      progress: stats.total_tasks > 0 ? (stats.completed_tasks / stats.total_tasks) * 100 : 0,
    };
  }

  private async validateProjectAdmin(context: TransactionContext, projectId: string, userId: string): Promise<void> {
    const result = await context.client.sql`
      SELECT 1 FROM project_members
      WHERE project_id = ${projectId}
        AND user_id = ${userId}
        AND role = 'admin'
    `;

    if (result.length === 0) {
      throw new Error(`User ${userId} is not an admin of project ${projectId}`);
    }
  }

  private async copyTemplateItems(context: TransactionContext, templateId: string, projectId: string): Promise<void> {
    // Get template tasks
    const templateTasks = await context.client.sql`
      SELECT * FROM template_tasks WHERE template_id = ${templateId}
    `;

    // Create tasks from template
    for (const task of templateTasks) {
      await context.client.sql`
        INSERT INTO tasks (
          title,
          description,
          status,
          priority,
          estimated_hours,
          project_id,
          created_by,
          created_at,
          updated_at
        ) VALUES (
          ${task.title},
          ${task.description},
          'todo',
          ${task.priority},
          ${task.estimated_hours},
          ${projectId},
          ${task.created_by},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `;
    }
  }

  private async createProjectHistory(
    context: TransactionContext,
    projectId: string,
    userId: string,
    action: 'created' | 'updated' | 'deleted',
    oldData: Project | null,
    newData: Project | null
  ): Promise<void> {
    await context.client.sql`
      INSERT INTO project_history (
        project_id,
        user_id,
        action,
        old_data,
        new_data,
        created_at
      ) VALUES (
        ${projectId},
        ${userId},
        ${action},
        ${oldData ? JSON.stringify(oldData) : null},
        ${newData ? JSON.stringify(newData) : null},
        CURRENT_TIMESTAMP
      )
    `;
  }

  private mapToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      visibility: row.visibility,
      startDate: row.start_date,
      endDate: row.end_date,
      budget: row.budget,
      tags: row.tags,
      templateId: row.template_id,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

let globalService: ProjectService | undefined;

export const getProjectService = (): ProjectService => {
  if (!globalService) {
    globalService = new ProjectService();
  }
  return globalService;
}; 