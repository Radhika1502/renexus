import { prisma } from '../db';
import request from 'supertest';
import { app } from '../app';

  beforeAll(async () => {
  await prisma.$connect();
  });

  afterAll(async () => {
  await prisma.$disconnect();
  });

  beforeEach(async () => {
  await prisma.project.deleteMany();
});

describe('Project Service Endpoints', () => {
  const testProject = {
        name: 'Test Project',
    description: 'Test Description',
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    createdById: '123e4567-e89b-12d3-a456-426614174001'
  };

  describe('POST /projects', () => {
    it('should create a new project and return 201', async () => {
      const response = await request(app)
        .post('/projects')
        .send(testProject);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Project');
    });

    it('should handle invalid project data', async () => {
      const response = await request(app)
        .post('/projects')
        .send({
          description: 'Missing name'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /projects/:id', () => {
    it('should return project by id', async () => {
      const project = await prisma.project.create({
        data: testProject
      });

      const response = await request(app)
        .get(`/projects/${project.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(project.id);
      expect(response.body.name).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/projects/123e4567-e89b-12d3-a456-426614174000');
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });
  });

  describe('PATCH /projects/:id', () => {
    it('should update project and return 200', async () => {
      const project = await prisma.project.create({
        data: testProject
      });

      const response = await request(app)
        .patch(`/projects/${project.id}`)
        .send({
          name: 'Updated Project',
          description: 'Updated Description'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Project');
      expect(response.body.description).toBe('Updated Description');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .patch('/projects/123e4567-e89b-12d3-a456-426614174000')
        .send({
          name: 'Updated Project'
        });
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });
  });

  describe('DELETE /projects/:id', () => {
    it('should delete project and return 204', async () => {
      const project = await prisma.project.create({
        data: testProject
      });

      const response = await request(app)
        .delete(`/projects/${project.id}`);
      
      expect(response.status).toBe(204);

      const deleted = await prisma.project.findUnique({
        where: { id: project.id }
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .delete('/projects/123e4567-e89b-12d3-a456-426614174000');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });
  });

  describe('POST /projects/:id/members', () => {
    it('should add member to project and return 200', async () => {
      const project = await prisma.project.create({
        data: testProject
      });

      const response = await request(app)
        .post(`/projects/${project.id}/members`)
        .send({
          userId: '123e4567-e89b-12d3-a456-426614174002'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.members).toContain('123e4567-e89b-12d3-a456-426614174002');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .post('/projects/123e4567-e89b-12d3-a456-426614174000/members')
        .send({
          userId: '123e4567-e89b-12d3-a456-426614174002'
        });
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });

    it('should handle invalid member data', async () => {
      const project = await prisma.project.create({
        data: testProject
      });

      const response = await request(app)
        .post(`/projects/${project.id}/members`)
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });
}); 