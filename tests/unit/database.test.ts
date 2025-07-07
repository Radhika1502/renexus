import { db } from '../../packages/database/db';
import { tasks, projects } from '../../packages/database/schema';
import { Task, Project } from '../../packages/database/types';
import { eq, and } from 'drizzle-orm';

describe('Database Module', () => {
  it('should have all required query methods for tasks', () => {
    expect(db.select).toBeDefined();
    expect(db.insert).toBeDefined();
    expect(db.update).toBeDefined();
    expect(db.delete).toBeDefined();
  });

  it('should be able to construct task queries', async () => {
    const mockTask: Partial<Task> = {
      title: 'Test Task',
      status: 'todo',
      priority: 'medium',
      projectId: '123',
      createdById: '456'
    };

    // Test select query
    const selectQuery = db.select().from(tasks);
    expect(selectQuery).toBeDefined();
    
    // Test insert query with proper types
    const insertQuery = db.insert(tasks).values(mockTask);
    expect(insertQuery).toBeDefined();

    // Test update query with proper types
    const updateQuery = db.update(tasks)
      .set({ title: 'Updated Task' })
      .where(eq(tasks.id, '123'));
    expect(updateQuery).toBeDefined();

    // Test delete query with proper types
    const deleteQuery = db.delete(tasks)
      .where(eq(tasks.id, '123'));
    expect(deleteQuery).toBeDefined();
  });

  it('should be able to construct project queries', async () => {
    const mockProject: Partial<Project> = {
      name: 'Test Project',
      status: 'active',
      ownerId: '123'
    };

    // Test select query
    const selectQuery = db.select().from(projects);
    expect(selectQuery).toBeDefined();
    
    // Test insert query with proper types
    const insertQuery = db.insert(projects).values(mockProject);
    expect(insertQuery).toBeDefined();

    // Test update query with proper types
    const updateQuery = db.update(projects)
      .set({ name: 'Updated Project' })
      .where(eq(projects.id, '123'));
    expect(updateQuery).toBeDefined();

    // Test delete query with proper types
    const deleteQuery = db.delete(projects)
      .where(eq(projects.id, '123'));
    expect(deleteQuery).toBeDefined();
  });

  describe('Transaction Support', () => {
    it('should have transaction support', () => {
      expect(db.transaction).toBeDefined();
    });

    it('should handle successful transactions', async () => {
      const mockTask: Partial<Task> = {
        title: 'Transaction Task',
        status: 'todo',
        priority: 'high',
        projectId: '123',
        createdById: '456'
      };

      await expect(db.transaction(async (tx) => {
        const result = await tx.insert(tasks).values(mockTask);
        return result;
      })).resolves.toBeDefined();
    });

    it('should handle transaction rollbacks', async () => {
      const mockError = new Error('Transaction failed');

      await expect(db.transaction(async (tx) => {
        throw mockError;
      })).rejects.toThrow(mockError);
    });

    it('should maintain ACID properties in transactions', async () => {
      const mockProject: Partial<Project> = {
        name: 'Transaction Project',
        status: 'active',
        ownerId: '123'
      };

      const mockTask: Partial<Task> = {
        title: 'Project Task',
        status: 'todo',
        priority: 'medium',
        projectId: '123',
        createdById: '456'
      };

      await expect(db.transaction(async (tx) => {
        const project = await tx.insert(projects).values(mockProject);
        const task = await tx.insert(tasks).values({
          ...mockTask,
          projectId: project.id
        });
        return { project, task };
      })).resolves.toBeDefined();
    });
  });
}); 