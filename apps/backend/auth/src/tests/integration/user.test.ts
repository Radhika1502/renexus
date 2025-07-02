import request from 'supertest';
import app from '../../index';
import { db } from "../../shared/config/database";
import * as dotenv from 'dotenv';

dotenv.config();

describe('User Management API', () => {
  let adminToken: string;
  let userId: string;
  
  beforeAll(async () => {
    // Register an admin user for testing
    const registerRes = await request(app)
      .post('/auth/register')
      .send({
        email: 'admin@example.com',
        password: 'AdminPass123!',
        name: 'Admin User',
        organizationName: 'Test Organization'
      });
    
    // Update user role to admin directly in the database
    await db.execute(`UPDATE users SET role = 'admin' WHERE email = 'admin@example.com'`);
    
    // Login as admin
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'AdminPass123!'
      });
    
    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Clean up test data
    await db.execute(`DELETE FROM users WHERE email = 'admin@example.com'`);
    await db.execute(`DELETE FROM users WHERE email = 'newuser@example.com'`);
  });

  describe('POST /users', () => {
    it('should create a new user when authenticated as admin', async () => {
      const res = await request(app)
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@example.com',
          password: 'NewUserPass123!',
          name: 'New User',
          role: 'user',
          organizationId: '1' // This should match an existing organization
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe('newuser@example.com');
      
      userId = res.body.id;
    });
  });

  describe('GET /users', () => {
    it('should get all users when authenticated as admin', async () => {
      const res = await request(app)
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /users/:id', () => {
    it('should get a specific user when authenticated as admin', async () => {
      const res = await request(app)
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', userId);
      expect(res.body).toHaveProperty('email', 'newuser@example.com');
    });
  });

  describe('PUT /users/:id', () => {
    it('should update a user when authenticated as admin', async () => {
      const res = await request(app)
        .put(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated User Name',
          role: 'user'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('name', 'Updated User Name');
    });
  });

  describe('PUT /users/:id/password', () => {
    it('should update a user password when authenticated as admin', async () => {
      const res = await request(app)
        .put(`/users/${userId}/password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          password: 'NewPassword123!'
        });

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user when authenticated as admin', async () => {
      const res = await request(app)
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      
      // Verify user is deleted
      const checkRes = await request(app)
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(checkRes.status).toBe(404);
    });
  });
});

