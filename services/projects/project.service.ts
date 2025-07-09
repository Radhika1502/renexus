import { Database } from '../../packages/database/db';
import { projects } from '../../packages/database/schema/projects';

const VALID_PROJECT_STATUSES = ['active', 'archived', 'completed', 'on_hold'] as const;
type ProjectStatus = typeof VALID_PROJECT_STATUSES[number];

export class ProjectService {
  constructor(private db: Database) {}

  async createProject(data: {
    name: string;
    description?: string;
    ownerId: string;
  }) {
    try {
      const result = await this.db.insert(projects).values({
        ...data,
        status: 'active'
      });

      if (!result || result.length === 0) {
        throw new Error('Failed to create project');
      }

      return result[0];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to create project');
    }
  }

  async getProject(id: string) {
    try {
      const result = await this.db.select()
        .from(projects)
        .where(projects.id.equals(id));

      return result[0] || null;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch project');
    }
  }

  async updateProject(id: string, data: Partial<{
    name: string;
    description: string;
    status: string;
  }>) {
    try {
      // Validate status if provided
      if (data.status && !VALID_PROJECT_STATUSES.includes(data.status as ProjectStatus)) {
        throw new Error('Invalid project status');
      }

      const result = await this.db.update(projects)
        .set(data)
        .where(projects.id.equals(id));

      if (!result || result.length === 0) {
        throw new Error('Project not found');
      }

      return result[0];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update project');
    }
  }

  async deleteProject(id: string) {
    try {
      await this.db.transaction(async (tx) => {
        const result = await tx.delete(projects)
          .where(projects.id.equals(id));

        if (!result || result.length === 0) {
          throw new Error('Project not found');
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to delete project');
    }
  }
} 