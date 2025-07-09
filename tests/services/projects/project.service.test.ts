import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { ProjectService } from '@services/projects/project.service';
import { db } from '@packages/database/db';
import { Project } from '@packages/api-types/project';

// Mock the database
jest.mock('@packages/database/db', () => ({
  db: {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    execute: jest.fn()
  }
}));

describe('ProjectService', () => {
  let projectService: ProjectService;
  const mockProject: Project = {
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

      const mockValues = jest.fn().mockResolvedValue([mockProject]);
      const mockInsert = jest.fn().mockReturnValue({ values: mockValues });
      (db.insert as jest.Mock).mockImplementation(mockInsert);

      // Act
      const result = await projectService.createProject(projectData);

      // Assert
      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalled();
      expect(result).toEqual(mockProject);
    });
  });

  describe('getProjectById', () => {
    it('should return a project when found', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const tenantId = 'test-tenant-id';

      const mockWhere = jest.fn().mockResolvedValue([mockProject]);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });
      (db.select as jest.Mock).mockImplementation(mockSelect);

      // Act
      const result = await projectService.getProjectById(projectId, tenantId);

      // Assert
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(result).toEqual(mockProject);
    });

    it('should return null when project not found', async () => {
      // Arrange
      const projectId = 'non-existent-id';
      const tenantId = 'test-tenant-id';

      const mockWhere = jest.fn().mockResolvedValue(null);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });
      (db.select as jest.Mock).mockImplementation(mockSelect);

      // Act
      const result = await projectService.getProjectById(projectId, tenantId);

      // Assert
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
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

      const mockWhere = jest.fn().mockResolvedValue([mockProject]);
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });
      (db.update as jest.Mock).mockImplementation(mockUpdate);

      // Act
      const result = await projectService.updateProject(projectId, tenantId, updateData);

      // Assert
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(result.name).toBe('Updated Project Name');
      expect(result.description).toBe('Updated Description');
    });
  });

  describe('deleteProject', () => {
    it('should delete a project successfully', async () => {
      // Arrange
      const projectId = 'test-project-id';
      const tenantId = 'test-tenant-id';

      const mockWhere = jest.fn().mockResolvedValue([mockProject]);
      const mockDelete = jest.fn().mockReturnValue({ where: mockWhere });
      (db.delete as jest.Mock).mockImplementation(mockDelete);

      // Act
      const result = await projectService.deleteProject(projectId, tenantId);

      // Assert
      expect(mockDelete).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
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

      const mockWhere = jest.fn().mockResolvedValue(mockProjects);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });
      (db.select as jest.Mock).mockImplementation(mockSelect);

      (db.count as jest.Mock).mockResolvedValue([{ count: 2 }]);

      // Act
      const result = await projectService.getProjectsByTenant(tenantId, page, limit);

      // Assert
      expect(mockSelect).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(result.data).toEqual(mockProjects);
      expect(result.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 10,
      });
    });
  });
});

