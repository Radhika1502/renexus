// @ts-nocheck
import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import projectRoutes from '../../services/projects/project.routes';
import { ProjectService } from '../../services/projects/project.service';

// Mock authentication middleware
jest.mock('../../services/auth/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'test-user-id',
      tenantId: 'test-tenant-id',
      email: 'test@example.com',
      role: 'admin',
    };
    next();
  },
  requireTenantAccess: (req: any, res: any, next: any) => {
    next();
  },
  requireRole: (roles: string[]) => (req: any, res: any, next: any) => {
    next();
  },
}));

// Mock ProjectService
jest.mock('../../services/projects/project.service');

describe('Project API Integration Tests', () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/projects', projectRoutes);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('GET /api/projects', () => {
    it('should return a list of projects', async () => {
      // Arrange
      const mockProjects = {
        data: [
          {
            id: 'project-1',
            name: 'Project 1',
            description: 'Description 1',
            status: 'active',
          },
          {
            id: 'project-2',
            name: 'Project 2',
            description: 'Description 2',
            status: 'active',
          },
        ],
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
        },
      };
      
      (ProjectService.prototype.getProjectsByTenant as jest.Mock).mockResolvedValue(mockProjects);
      
      // Act
      const response = await request(app).get('/api/projects');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockProjects.data);
      expect(response.body.pagination).toEqual(mockProjects.pagination);
    });
    
    it('should handle errors', async () => {
      // Arrange
      (ProjectService.prototype.getProjectsByTenant as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );
      
      // Act
      const response = await request(app).get('/api/projects');
      
      // Assert
      expect(response.status).toBe(500);
      expect(response.body.status).toBe('error');
    });
  });
  
  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      // Arrange
      const mockProject = {
        id: 'new-project-id',
        name: 'New Project',
        description: 'New Description',
        status: 'active',
      };
      
      const projectData = {
        name: 'New Project',
        description: 'New Description',
      };
      
      (ProjectService.prototype.createProject as jest.Mock).mockResolvedValue(mockProject);
      
      // Act
      const response = await request(app)
        .post('/api/projects')
        .send(projectData);
      
      // Assert
      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockProject);
    });
    
    it('should handle validation errors', async () => {
      // Arrange
      const invalidProjectData = {
        // Missing required name field
        description: 'New Description',
      };
      
      (ProjectService.prototype.createProject as jest.Mock).mockImplementation(() => {
        throw { name: 'ZodError', errors: [{ path: ['name'], message: 'Required' }] };
      });
      
      // Act
      const response = await request(app)
        .post('/api/projects')
        .send(invalidProjectData);
      
      // Assert
      expect(response.status).toBe(400);
      expect(response.body.status).toBe('error');
    });
  });
  
  describe('GET /api/projects/:projectId', () => {
    it('should return a project by ID', async () => {
      // Arrange
      const mockProject = {
        id: 'project-1',
        name: 'Project 1',
        description: 'Description 1',
        status: 'active',
      };
      
      (ProjectService.prototype.getProjectById as jest.Mock).mockResolvedValue(mockProject);
      
      // Act
      const response = await request(app).get('/api/projects/project-1');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockProject);
    });
    
    it('should return 404 when project not found', async () => {
      // Arrange
      (ProjectService.prototype.getProjectById as jest.Mock).mockResolvedValue(null);
      
      // Act
      const response = await request(app).get('/api/projects/non-existent-id');
      
      // Assert
      expect(response.status).toBe(404);
      expect(response.body.status).toBe('error');
    });
  });
  
  describe('PUT /api/projects/:projectId', () => {
    it('should update a project', async () => {
      // Arrange
      const mockUpdatedProject = {
        id: 'project-1',
        name: 'Updated Project',
        description: 'Updated Description',
        status: 'active',
      };
      
      const updateData = {
        name: 'Updated Project',
        description: 'Updated Description',
      };
      
      (ProjectService.prototype.updateProject as jest.Mock).mockResolvedValue(mockUpdatedProject);
      
      // Act
      const response = await request(app)
        .put('/api/projects/project-1')
        .send(updateData);
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toEqual(mockUpdatedProject);
    });
  });
  
  describe('DELETE /api/projects/:projectId', () => {
    it('should delete a project', async () => {
      // Arrange
      (ProjectService.prototype.deleteProject as jest.Mock).mockResolvedValue({ success: true });
      
      // Act
      const response = await request(app).delete('/api/projects/project-1');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });
});
