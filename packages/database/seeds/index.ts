import { getDatabaseClient } from '../client';
import { withTransaction } from '../transaction-manager';
import { logger } from '../logger';
import bcrypt from 'bcryptjs';

export interface SeedData {
  tenants: any[];
  users: any[];
  teams: any[];
  projects: any[];
  tasks: any[];
  timeLog: any[];
}

export interface Seeder {
  seedAll(): Promise<void>;
  seedTenants(): Promise<any[]>;
  seedUsers(): Promise<any[]>;
  seedTeams(): Promise<any[]>;
  seedProjects(): Promise<any[]>;
  seedTasks(): Promise<any[]>;
  seedTimeLog(): Promise<any[]>;
  clearAll(): Promise<void>;
}

class DatabaseSeeder implements Seeder {
  private client = getDatabaseClient();

  async seedAll(): Promise<void> {
    logger.info('Starting database seeding...');
    
    await withTransaction(async (context) => {
      // Clear existing data first
      await this.clearAllData(context.client.sql);
      
      // Seed in order due to foreign key dependencies
      const tenants = await this.seedTenantsData(context.client.sql);
      const users = await this.seedUsersData(context.client.sql, tenants);
      const teams = await this.seedTeamsData(context.client.sql, tenants, users);
      const projects = await this.seedProjectsData(context.client.sql, tenants, users, teams);
      const tasks = await this.seedTasksData(context.client.sql, tenants, users, projects);
      await this.seedTimeLogData(context.client.sql, tenants, users, tasks);
      
      logger.info('Database seeding completed successfully');
    });
  }

  async seedTenants(): Promise<any[]> {
    return withTransaction(async (context) => {
      return this.seedTenantsData(context.client.sql);
    });
  }

  async seedUsers(): Promise<any[]> {
    return withTransaction(async (context) => {
      const tenants = await this.getExistingTenants(context.client.sql);
      return this.seedUsersData(context.client.sql, tenants);
    });
  }

  async seedTeams(): Promise<any[]> {
    return withTransaction(async (context) => {
      const tenants = await this.getExistingTenants(context.client.sql);
      const users = await this.getExistingUsers(context.client.sql);
      return this.seedTeamsData(context.client.sql, tenants, users);
    });
  }

  async seedProjects(): Promise<any[]> {
    return withTransaction(async (context) => {
      const tenants = await this.getExistingTenants(context.client.sql);
      const users = await this.getExistingUsers(context.client.sql);
      const teams = await this.getExistingTeams(context.client.sql);
      return this.seedProjectsData(context.client.sql, tenants, users, teams);
    });
  }

  async seedTasks(): Promise<any[]> {
    return withTransaction(async (context) => {
      const tenants = await this.getExistingTenants(context.client.sql);
      const users = await this.getExistingUsers(context.client.sql);
      const projects = await this.getExistingProjects(context.client.sql);
      return this.seedTasksData(context.client.sql, tenants, users, projects);
    });
  }

  async seedTimeLog(): Promise<any[]> {
    return withTransaction(async (context) => {
      const tenants = await this.getExistingTenants(context.client.sql);
      const users = await this.getExistingUsers(context.client.sql);
      const tasks = await this.getExistingTasks(context.client.sql);
      return this.seedTimeLogData(context.client.sql, tenants, users, tasks);
    });
  }

  async clearAll(): Promise<void> {
    await withTransaction(async (context) => {
      await this.clearAllData(context.client.sql);
      logger.info('All seed data cleared');
    });
  }

  private async seedTenantsData(sql: any): Promise<any[]> {
    const tenants = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Acme Corporation',
        slug: 'acme-corp',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        name: 'TechStart Inc',
        slug: 'techstart-inc',
      },
    ];

    for (const tenant of tenants) {
      await sql`
        INSERT INTO tenants (id, name, slug, created_at, updated_at)
        VALUES (${tenant.id}, ${tenant.name}, ${tenant.slug}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `;
    }

    logger.info(`Seeded ${tenants.length} tenants`);
    return tenants;
  }

  private async seedUsersData(sql: any, tenants: any[]): Promise<any[]> {
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        id: '550e8400-e29b-41d4-a716-446655440101',
        email: 'admin@acme.com',
        password_hash: passwordHash,
        first_name: 'John',
        last_name: 'Admin',
        role: 'admin',
        tenant_id: tenants[0].id,
        tenant_role: 'admin',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440102',
        email: 'manager@acme.com',
        password_hash: passwordHash,
        first_name: 'Sarah',
        last_name: 'Manager',
        role: 'manager',
        tenant_id: tenants[0].id,
        tenant_role: 'manager',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440103',
        email: 'developer@acme.com',
        password_hash: passwordHash,
        first_name: 'Mike',
        last_name: 'Developer',
        role: 'user',
        tenant_id: tenants[0].id,
        tenant_role: 'member',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440104',
        email: 'designer@acme.com',
        password_hash: passwordHash,
        first_name: 'Emily',
        last_name: 'Designer',
        role: 'user',
        tenant_id: tenants[0].id,
        tenant_role: 'member',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440105',
        email: 'tester@acme.com',
        password_hash: passwordHash,
        first_name: 'David',
        last_name: 'Tester',
        role: 'user',
        tenant_id: tenants[0].id,
        tenant_role: 'member',
      },
    ];

    for (const user of users) {
      // Insert user
      await sql`
        INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at, updated_at)
        VALUES (${user.id}, ${user.email}, ${user.password_hash}, ${user.first_name}, ${user.last_name}, ${user.role}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `;

      // Insert tenant-user relationship
      await sql`
        INSERT INTO tenant_users (tenant_id, user_id, role, created_at, updated_at)
        VALUES (${user.tenant_id}, ${user.id}, ${user.tenant_role}, NOW(), NOW())
        ON CONFLICT (tenant_id, user_id) DO NOTHING
      `;
    }

    logger.info(`Seeded ${users.length} users`);
    return users;
  }

  private async seedTeamsData(sql: any, tenants: any[], users: any[]): Promise<any[]> {
    const teams = [
      {
        id: '550e8400-e29b-41d4-a716-446655440201',
        name: 'Development Team',
        description: 'Core development team responsible for building features',
        tenant_id: tenants[0].id,
        created_by_id: users[0].id,
        members: [users[1].id, users[2].id], // Manager and Developer
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440202',
        name: 'Design Team',
        description: 'UI/UX design and user research team',
        tenant_id: tenants[0].id,
        created_by_id: users[0].id,
        members: [users[3].id], // Designer
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440203',
        name: 'QA Team',
        description: 'Quality assurance and testing team',
        tenant_id: tenants[0].id,
        created_by_id: users[0].id,
        members: [users[4].id], // Tester
      },
    ];

    for (const team of teams) {
      // Insert team
      await sql`
        INSERT INTO teams (id, name, description, tenant_id, created_by_id, created_at, updated_at)
        VALUES (${team.id}, ${team.name}, ${team.description}, ${team.tenant_id}, ${team.created_by_id}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `;

      // Insert team members
      for (const memberId of team.members) {
        await sql`
          INSERT INTO team_members (team_id, user_id, role, created_at, updated_at)
          VALUES (${team.id}, ${memberId}, 'member', NOW(), NOW())
          ON CONFLICT (team_id, user_id) DO NOTHING
        `;
      }
    }

    logger.info(`Seeded ${teams.length} teams`);
    return teams;
  }

  private async seedProjectsData(sql: any, tenants: any[], users: any[], teams: any[]): Promise<any[]> {
    const projects = [
      {
        id: '550e8400-e29b-41d4-a716-446655440301',
        name: 'E-commerce Platform',
        description: 'Build a modern e-commerce platform with React and Node.js',
        status: 'active',
        tenant_id: tenants[0].id,
        created_by_id: users[0].id,
        team_id: teams[0].id,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-06-30'),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440302',
        name: 'Mobile App',
        description: 'Develop a mobile application for iOS and Android',
        status: 'planning',
        tenant_id: tenants[0].id,
        created_by_id: users[1].id,
        team_id: teams[0].id,
        start_date: new Date('2024-03-01'),
        end_date: new Date('2024-08-31'),
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440303',
        name: 'Analytics Dashboard',
        description: 'Create a comprehensive analytics dashboard',
        status: 'completed',
        tenant_id: tenants[0].id,
        created_by_id: users[1].id,
        team_id: teams[0].id,
        start_date: new Date('2023-09-01'),
        end_date: new Date('2023-12-31'),
      },
    ];

    for (const project of projects) {
      // Insert project
      await sql`
        INSERT INTO projects (id, name, description, status, tenant_id, created_by_id, team_id, start_date, end_date, created_at, updated_at)
        VALUES (${project.id}, ${project.name}, ${project.description}, ${project.status}, ${project.tenant_id}, ${project.created_by_id}, ${project.team_id}, ${project.start_date}, ${project.end_date}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `;

      // Add project members (all team members)
      const teamMembers = await sql`
        SELECT user_id FROM team_members WHERE team_id = ${project.team_id}
      `;

      for (const member of teamMembers) {
        await sql`
          INSERT INTO project_members (project_id, user_id, role, created_at, updated_at)
          VALUES (${project.id}, ${member.user_id}, 'member', NOW(), NOW())
          ON CONFLICT (project_id, user_id) DO NOTHING
        `;
      }
    }

    logger.info(`Seeded ${projects.length} projects`);
    return projects;
  }

  private async seedTasksData(sql: any, tenants: any[], users: any[], projects: any[]): Promise<any[]> {
    const tasks = [
      // E-commerce Platform tasks
      {
        id: '550e8400-e29b-41d4-a716-446655440401',
        title: 'Set up development environment',
        description: 'Configure development tools and dependencies',
        status: 'done',
        priority: 'high',
        project_id: projects[0].id,
        tenant_id: tenants[0].id,
        created_by_id: users[1].id,
        estimated_hours: 8,
        assignees: [users[2].id],
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440402',
        title: 'Design user authentication flow',
        description: 'Create wireframes and user flows for login/register',
        status: 'done',
        priority: 'high',
        project_id: projects[0].id,
        tenant_id: tenants[0].id,
        created_by_id: users[1].id,
        estimated_hours: 16,
        assignees: [users[3].id],
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440403',
        title: 'Implement user registration',
        description: 'Build user registration API and frontend form',
        status: 'in_progress',
        priority: 'high',
        project_id: projects[0].id,
        tenant_id: tenants[0].id,
        created_by_id: users[1].id,
        estimated_hours: 24,
        due_date: new Date('2024-02-15'),
        assignees: [users[2].id],
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440404',
        title: 'Create product catalog',
        description: 'Build product listing and search functionality',
        status: 'todo',
        priority: 'medium',
        project_id: projects[0].id,
        tenant_id: tenants[0].id,
        created_by_id: users[1].id,
        estimated_hours: 40,
        due_date: new Date('2024-03-01'),
        assignees: [users[2].id],
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440405',
        title: 'Implement shopping cart',
        description: 'Build shopping cart functionality with persistence',
        status: 'todo',
        priority: 'medium',
        project_id: projects[0].id,
        tenant_id: tenants[0].id,
        created_by_id: users[1].id,
        estimated_hours: 32,
        assignees: [users[2].id],
      },
      
      // Mobile App tasks
      {
        id: '550e8400-e29b-41d4-a716-446655440406',
        title: 'Research mobile frameworks',
        description: 'Evaluate React Native vs Flutter for mobile development',
        status: 'in_progress',
        priority: 'high',
        project_id: projects[1].id,
        tenant_id: tenants[0].id,
        created_by_id: users[1].id,
        estimated_hours: 16,
        assignees: [users[2].id],
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440407',
        title: 'Design mobile UI mockups',
        description: 'Create mobile-first UI designs and prototypes',
        status: 'todo',
        priority: 'high',
        project_id: projects[1].id,
        tenant_id: tenants[0].id,
        created_by_id: users[1].id,
        estimated_hours: 24,
        assignees: [users[3].id],
      },

      // Analytics Dashboard tasks (completed project)
      {
        id: '550e8400-e29b-41d4-a716-446655440408',
        title: 'Implement dashboard components',
        description: 'Build reusable dashboard components',
        status: 'done',
        priority: 'medium',
        project_id: projects[2].id,
        tenant_id: tenants[0].id,
        created_by_id: users[1].id,
        estimated_hours: 40,
        assignees: [users[2].id],
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440409',
        title: 'Integrate analytics API',
        description: 'Connect dashboard to analytics data sources',
        status: 'done',
        priority: 'high',
        project_id: projects[2].id,
        tenant_id: tenants[0].id,
        created_by_id: users[1].id,
        estimated_hours: 24,
        assignees: [users[2].id],
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440410',
        title: 'Test dashboard functionality',
        description: 'Comprehensive testing of all dashboard features',
        status: 'done',
        priority: 'medium',
        project_id: projects[2].id,
        tenant_id: tenants[0].id,
        created_by_id: users[1].id,
        estimated_hours: 16,
        assignees: [users[4].id],
      },
    ];

    for (const task of tasks) {
      // Insert task
      await sql`
        INSERT INTO tasks (id, title, description, status, priority, project_id, tenant_id, created_by_id, estimated_hours, due_date, created_at, updated_at)
        VALUES (${task.id}, ${task.title}, ${task.description}, ${task.status}, ${task.priority}, ${task.project_id}, ${task.tenant_id}, ${task.created_by_id}, ${task.estimated_hours}, ${task.due_date || null}, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `;

      // Insert task assignees
      if (task.assignees) {
        for (const assigneeId of task.assignees) {
          await sql`
            INSERT INTO task_assignees (task_id, user_id, assigned_at)
            VALUES (${task.id}, ${assigneeId}, NOW())
            ON CONFLICT (task_id, user_id) DO NOTHING
          `;
        }
      }
    }

    // Create a task dependency
    await sql`
      INSERT INTO task_dependencies (task_id, depends_on_task_id, created_at, updated_at)
      VALUES (${tasks[2].id}, ${tasks[0].id}, NOW(), NOW())
      ON CONFLICT (task_id, depends_on_task_id) DO NOTHING
    `;

    logger.info(`Seeded ${tasks.length} tasks`);
    return tasks;
  }

  private async seedTimeLogData(sql: any, tenants: any[], users: any[], tasks: any[]): Promise<any[]> {
    const timeLogs = [
      {
        task_id: tasks[0].id,
        user_id: users[2].id,
        tenant_id: tenants[0].id,
        hours_logged: 6.5,
        description: 'Set up development environment and configured tools',
        logged_at: new Date('2024-01-02'),
      },
      {
        task_id: tasks[1].id,
        user_id: users[3].id,
        tenant_id: tenants[0].id,
        hours_logged: 8.0,
        description: 'Created wireframes for authentication flow',
        logged_at: new Date('2024-01-03'),
      },
      {
        task_id: tasks[2].id,
        user_id: users[2].id,
        tenant_id: tenants[0].id,
        hours_logged: 4.5,
        description: 'Started implementing user registration API',
        logged_at: new Date('2024-01-05'),
      },
      {
        task_id: tasks[7].id,
        user_id: users[2].id,
        tenant_id: tenants[0].id,
        hours_logged: 8.0,
        description: 'Completed dashboard components implementation',
        logged_at: new Date('2023-10-15'),
      },
    ];

    for (const timeLog of timeLogs) {
      await sql`
        INSERT INTO time_logs (task_id, user_id, tenant_id, hours_logged, description, logged_at, created_at, updated_at)
        VALUES (${timeLog.task_id}, ${timeLog.user_id}, ${timeLog.tenant_id}, ${timeLog.hours_logged}, ${timeLog.description}, ${timeLog.logged_at}, NOW(), NOW())
      `;
    }

    logger.info(`Seeded ${timeLogs.length} time log entries`);
    return timeLogs;
  }

  private async clearAllData(sql: any): Promise<void> {
    // Clear in reverse order of dependencies
    await sql`DELETE FROM time_logs`;
    await sql`DELETE FROM task_dependencies`;
    await sql`DELETE FROM task_assignees`;
    await sql`DELETE FROM tasks`;
    await sql`DELETE FROM project_members`;
    await sql`DELETE FROM projects`;
    await sql`DELETE FROM team_members`;
    await sql`DELETE FROM teams`;
    await sql`DELETE FROM tenant_users`;
    await sql`DELETE FROM sessions`;
    await sql`DELETE FROM users`;
    await sql`DELETE FROM tenants`;
    
    logger.info('Cleared all existing seed data');
  }

  // Helper methods to get existing data
  private async getExistingTenants(sql: any): Promise<any[]> {
    return await sql`SELECT * FROM tenants ORDER BY created_at`;
  }

  private async getExistingUsers(sql: any): Promise<any[]> {
    return await sql`SELECT * FROM users ORDER BY created_at`;
  }

  private async getExistingTeams(sql: any): Promise<any[]> {
    return await sql`SELECT * FROM teams ORDER BY created_at`;
  }

  private async getExistingProjects(sql: any): Promise<any[]> {
    return await sql`SELECT * FROM projects ORDER BY created_at`;
  }

  private async getExistingTasks(sql: any): Promise<any[]> {
    return await sql`SELECT * FROM tasks ORDER BY created_at`;
  }
}

// Export seeder instance
export const seeder = new DatabaseSeeder();

// Export convenience functions
export const seedDatabase = () => seeder.seedAll();
export const clearDatabase = () => seeder.clearAll();

export default seeder; 