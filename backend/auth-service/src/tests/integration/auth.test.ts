import request from 'supertest';
import app from '../../index';
import { db } from '../../config/database';
import { createClient } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

describe('Authentication API', () => {
  let redisClient: any;
  
  beforeAll(async () => {
    // Connect to Redis
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    await redisClient.connect();
  });

  afterAll(async () => {
    // Clean up test data
    await db.execute(`DELETE FROM users WHERE email = 'test@example.com'`);
    await redisClient.disconnect();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
          organizationName: 'Test Organization'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body).toHaveProperty('token');
    });

    it('should not register a user with an existing email', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
          organizationName: 'Test Organization'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should not login with invalid credentials', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123!'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/refresh-token', () => {
    let refreshToken: string;

    beforeAll(async () => {
      // Login to get a refresh token
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });
      
      refreshToken = loginRes.body.refreshToken;
    });

    it('should issue a new token with a valid refresh token', async () => {
      const res = await request(app)
        .post('/auth/refresh-token')
        .send({
          refreshToken
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should not issue a new token with an invalid refresh token', async () => {
      const res = await request(app)
        .post('/auth/refresh-token')
        .send({
          refreshToken: 'invalid-token'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    let token: string;
    let refreshToken: string;

    beforeAll(async () => {
      // Login to get tokens
      const loginRes = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });
      
      token = loginRes.body.token;
      refreshToken = loginRes.body.refreshToken;
    });

    it('should successfully logout with valid tokens', async () => {
      const res = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({
          refreshToken
        });

      expect(res.status).toBe(200);
    });
  });
});
