/**
 * Unit Tests for Project Repository
 * Phase 5.1.1 - Database Query Tests
 */
const ProjectRepository = require('../../../src/repositories/ProjectRepository');
const db = require('../../../src/config/database');
const { sql } = require('drizzle-orm');

// Mock the database connection
jest.mock('../../../src/config/database', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

describe('ProjectRepository', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findById()', () => {
    test('should return a project when found', async () => {
      // Define mock data
      const mockProject = {
        id: 'proj-123',
        name: 'Test Project',
        description: 'A test project',
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: 'user-456'
      };

      // Set up the mock implementation
      db.query.mockResolvedValueOnce([mockProject]);

      // Execute the test
      const result = await ProjectRepository.findById('proj-123');

      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM projects WHERE id = $1'),
        ['proj-123']
      );
      expect(result).toEqual(mockProject);
    });

    test('should return null when project not found', async () => {
      // Set up the mock implementation
      db.query.mockResolvedValueOnce([]);

      // Execute the test
      const result = await ProjectRepository.findById('nonexistent');

      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe('findAll()', () => {
    test('should return all projects', async () => {
      // Define mock data
      const mockProjects = [
        {
          id: 'proj-123',
          name: 'Test Project 1',
          description: 'A test project',
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: 'user-456'
        },
        {
          id: 'proj-456',
          name: 'Test Project 2',
          description: 'Another test project',
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: 'user-789'
        }
      ];

      // Set up the mock implementation
      db.query.mockResolvedValueOnce(mockProjects);

      // Execute the test
      const result = await ProjectRepository.findAll();

      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM projects')
      );
      expect(result).toEqual(mockProjects);
      expect(result.length).toBe(2);
    });

    test('should return empty array when no projects exist', async () => {
      // Set up the mock implementation
      db.query.mockResolvedValueOnce([]);

      // Execute the test
      const result = await ProjectRepository.findAll();

      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  describe('create()', () => {
    test('should create and return a new project', async () => {
      // Define mock data
      const projectData = {
        name: 'New Project',
        description: 'A new project for testing',
        ownerId: 'user-123'
      };

      const createdProject = {
        id: 'proj-999',
        name: 'New Project',
        description: 'A new project for testing',
        ownerId: 'user-123',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Set up the mock implementation
      db.query.mockResolvedValueOnce([createdProject]);

      // Execute the test
      const result = await ProjectRepository.create(projectData);

      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO projects'),
        expect.arrayContaining([projectData.name, projectData.description, projectData.ownerId])
      );
      expect(result).toEqual(createdProject);
    });
  });

  describe('update()', () => {
    test('should update and return the updated project', async () => {
      // Define mock data
      const projectId = 'proj-123';
      const updateData = {
        name: 'Updated Project',
        description: 'An updated project description'
      };

      const updatedProject = {
        id: projectId,
        name: 'Updated Project',
        description: 'An updated project description',
        ownerId: 'user-456',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Set up the mock implementation
      db.query.mockResolvedValueOnce([updatedProject]);

      // Execute the test
      const result = await ProjectRepository.update(projectId, updateData);

      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE projects SET'),
        expect.arrayContaining([updateData.name, updateData.description, projectId])
      );
      expect(result).toEqual(updatedProject);
    });

    test('should return null when project not found', async () => {
      // Define mock data
      const projectId = 'nonexistent';
      const updateData = {
        name: 'Updated Project',
        description: 'An updated project description'
      };

      // Set up the mock implementation
      db.query.mockResolvedValueOnce([]);

      // Execute the test
      const result = await ProjectRepository.update(projectId, updateData);

      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });
  });

  describe('delete()', () => {
    test('should delete a project and return true when successful', async () => {
      // Define mock data
      const projectId = 'proj-123';

      // Set up the mock implementation
      db.query.mockResolvedValueOnce([{ id: projectId }]);

      // Execute the test
      const result = await ProjectRepository.delete(projectId);

      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM projects WHERE id = $1 RETURNING id'),
        [projectId]
      );
      expect(result).toBe(true);
    });

    test('should return false when project not found', async () => {
      // Define mock data
      const projectId = 'nonexistent';

      // Set up the mock implementation
      db.query.mockResolvedValueOnce([]);

      // Execute the test
      const result = await ProjectRepository.delete(projectId);

      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toBe(false);
    });
  });

  describe('findByOwner()', () => {
    test('should return all projects for a specific owner', async () => {
      // Define mock data
      const ownerId = 'user-123';
      const mockProjects = [
        {
          id: 'proj-123',
          name: 'Owner Project 1',
          description: 'A project owned by the user',
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: ownerId
        },
        {
          id: 'proj-456',
          name: 'Owner Project 2',
          description: 'Another project owned by the user',
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: ownerId
        }
      ];

      // Set up the mock implementation
      db.query.mockResolvedValueOnce(mockProjects);

      // Execute the test
      const result = await ProjectRepository.findByOwner(ownerId);

      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM projects WHERE owner_id = $1'),
        [ownerId]
      );
      expect(result).toEqual(mockProjects);
      expect(result.length).toBe(2);
    });

    test('should return empty array when owner has no projects', async () => {
      // Define mock data
      const ownerId = 'user-no-projects';

      // Set up the mock implementation
      db.query.mockResolvedValueOnce([]);

      // Execute the test
      const result = await ProjectRepository.findByOwner(ownerId);

      // Assertions
      expect(db.query).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });
  });
});
