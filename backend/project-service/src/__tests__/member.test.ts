import { prisma } from '../db';
import request from 'supertest';
import { app } from '../app';

describe('Project Member Management', () => {
  beforeEach(async () => {
    await prisma.project.deleteMany();
  });

  const testProject = {
    name: 'Test Project',
    description: 'Test Description',
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    createdById: '123e4567-e89b-12d3-a456-426614174001'
  };

  describe('POST /projects/:id/members', () => {
    it('should add a member to a project', async () => {
      // Create a project first
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
    }, 30000); // Increase timeout for this test
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
}); 