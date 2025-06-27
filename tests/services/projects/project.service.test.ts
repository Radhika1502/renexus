import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { ProjectService } from '../../../services/projects/project.service';
import { db } from '../../../database/db';

// Mock the database
jest.mock('../../../database/db', () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockResolvedValue([{ id: 'test-project-id' }]),
    query: {
      projects: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      }
    },
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
  }
}));

describe('ProjectService', () => {
  let projectService: ProjectService;
  const mockProject = {
    id: 'test-project-id',
    name: 'Test Project',
    description: 'Test Description',
    status: 'active',
    tenantId: 'test-tenant-id',
    createdById: 'test-user-id',
    teamId: null,
    startDate: null,
    endDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    projectService = new ProjectService();
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create a project successfully', async () => {
      // Arrange
      const projectData = {
        name: 'Test Project',
        description: 'Test Description',
        tenantId: 'test-tenant-id',
        createdById: 'test-user-id',
      };

      (db.insert as jest.Mock).mockReturnThis();
      (db.values as jest.Mock).mockReturnThis();
      (db.returning as jest.Mock).mockResolvedValue([mockProject]);

      // Act
      const result = await projectService.createProject(projectData);

      // Assert
      expect(db.insert).toHaveBeenCalled();
      expect(db.values).toHaveBeenCalled();
      expect(db.returning).toHaveBeenCalled();
      expect(result).toEqual(mockProject);
    });
  });

  describe('getProjectById', () => {
    it('should return a project when found', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const tenantId = 'test-tenant-id';

      (db.query.projects.findFirst as jest.Mock).mockResolvedValue(mockProject);

      // Act
      const result = await projectService.getProjectById(projectId, tenantId);

      // Assert
      expect(db.query.projects.findFirst).toHaveBeenCalled();
      expect(result).toEqual(mockProject);
    });

    it('should return null when project not found', async () => {
      // Arrange
      const projectId = 'non-existent-id';
      const tenantId = 'test-tenant-id';

      (db.query.projects.findFirst as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await projectService.getProjectById(projectId, tenantId);

      // Assert
      expect(db.query.projects.findFirst).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('updateProject', () => {
    it('should update a project successfully', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const tenantId = 'test-tenant-id';
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated Description',
      };

      (db.update as jest.Mock).mockReturnThis();
      (db.set as jest.Mock).mockReturnThis();
      (db.where as jest.Mock).mockReturnThis();
      (db.returning as jest.Mock).mockResolvedValue([{
        ...mockProject,
        name: 'Updated Project Name',
        description: 'Updated Description',
      }]);

      // Act
      const result = await projectService.updateProject(projectId, tenantId, updateData);

      // Assert
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(db.returning).toHaveBeenCalled();
      expect(result.name).toBe('Updated Project Name');
      expect(result.description).toBe('Updated Description');
    });
  });

  describe('deleteProject', () => {
    it('should delete a project successfully', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const tenantId = 'test-tenant-id';

      (db.delete as jest.Mock).mockReturnThis();
      (db.where as jest.Mock).mockReturnThis();
      (db.returning as jest.Mock).mockResolvedValue([mockProject]);

      // Act
      const result = await projectService.deleteProject(projectId, tenantId);

      // Assert
      expect(db.delete).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe('getProjectsByTenant', () => {
    it('should return projects with pagination', async () => {
      // Arrange
      const tenantId = 'test-tenant-id';
      const page = 1;
      const limit = 10;
      const mockProjects = [mockProject, { ...mockProject, id: 'test-project-id-2' }];

      (db.query.projects.findMany as jest.Mock).mockResolvedValue(mockProjects);
      (db.select as jest.Mock).mockReturnThis();
      (db.from as jest.Mock).mockReturnThis();
      (db.where as jest.Mock).mockReturnThis();
      (db.count as jest.Mock).mockResolvedValue([{ count: 2 }]);

      // Act
      const result = await projectService.getProjectsByTenant(tenantId, page, limit);

      // Assert
      expect(db.query.projects.findMany).toHaveBeenCalled();
      expect(result.data).toEqual(mockProjects);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 10,
      });
    });
  });
});
