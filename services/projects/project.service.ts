import { Database } from '../../packages/database/db';
import { projects } from '../../packages/database/schema/projects';

export class ProjectService {
  constructor(private db: Database) {}

  async createProject(data: {
    name: string;
    description?: string;
    ownerId: string;
  }) {
    const result = await this.db.insert(projects).values({
      ...data,
      status: 'active'
    });

    return result[0];
  }

  async getProject(id: string) {
    const result = await this.db.select()
      .from(projects)
      .where(projects.id.equals(id));

    return result[0];
  }

  async updateProject(id: string, data: Partial<{
    name: string;
    description: string;
    status: string;
  }>) {
    const result = await this.db.update(projects)
      .set(data)
      .where(projects.id.equals(id));

    return result[0];
  }

  async deleteProject(id: string) {
    await this.db.delete(projects)
      .where(projects.id.equals(id));
  }
} 