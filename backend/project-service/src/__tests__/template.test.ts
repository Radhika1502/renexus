import { prisma } from '../db';
import request from 'supertest';
import { app } from '../app';

describe('Project Templates', () => {
  beforeEach(async () => {
    await prisma.project.deleteMany();
  });

  const baseTemplate = {
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    createdById: '123e4567-e89b-12d3-a456-426614174001'
  };

  describe('POST /projects/templates', () => {
    it('should create a project template', async () => {
      const response = await request(app)
        .post('/projects/templates')
        .send({
          ...baseTemplate,
        name: 'Test Template',
          description: 'Test Description',
          status: 'template'
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Template');
      expect(response.body.status).toBe('template');
    });

    it('should handle invalid template data', async () => {
      const response = await request(app)
        .post('/projects/templates')
        .send({
          description: 'Missing name'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /projects/templates', () => {
    it('should list all templates', async () => {
      // Create some templates
      await prisma.project.create({
        data: {
          ...baseTemplate,
          name: 'Template 1',
          description: 'Test',
          status: 'template'
        }
      });

      await prisma.project.create({
        data: {
          ...baseTemplate,
          name: 'Template 2',
          description: 'Test',
          status: 'template'
        }
      });

      await prisma.project.create({
        data: {
          ...baseTemplate,
          name: 'Regular Project',
          description: 'Test',
          status: 'active'
        }
      });

      const response = await request(app)
        .get('/projects/templates')
        .query({ status: 'template' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.every((t: any) => t.status === 'template')).toBe(true);
    });

    it('should handle invalid status parameter', async () => {
      const response = await request(app)
        .get('/projects/templates')
        .query({ status: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should handle missing status parameter', async () => {
      const response = await request(app)
        .get('/projects/templates');

      expect(response.status).toBe(200);
      const templates = await prisma.project.findMany();
      expect(response.body).toHaveLength(templates.length);
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
}); 