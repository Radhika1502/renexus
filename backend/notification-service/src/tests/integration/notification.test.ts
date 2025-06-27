import request from 'supertest';
import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import jwt from 'jsonwebtoken';
import app from '../../index';
import { createClient } from 'redis';
import amqplib from 'amqplib';
import { closeMessageQueue } from '../../config/queue';

describe('Notification Service Integration Tests', () => {
  let redisClient: ReturnType<typeof createClient>;
  let authToken: string;
  let adminAuthToken: string;
  let testTemplateId: string;
  
  // Create test JWT tokens
  before(async () => {
    // Create test user token
    authToken = jwt.sign(
      { id: 'test-user-id', email: 'test@example.com', role: 'user' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    // Create admin token
    adminAuthToken = jwt.sign(
      { id: 'admin-user-id', email: 'admin@example.com', role: 'admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
    
    // Connect to Redis for cleanup
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await redisClient.connect();
  });
  
  // Clean up test data
  beforeEach(async () => {
    // Clear test notifications and templates
    const keys = await redisClient.keys('notification:*');
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
    
    const userNotificationKeys = await redisClient.keys('user:test-user-id:*');
    if (userNotificationKeys.length > 0) {
      await redisClient.del(userNotificationKeys);
    }
    
    // Create a test template for email tests
    const templateResponse = await request(app)
      .post('/templates')
      .set('Authorization', `Bearer ${adminAuthToken}`)
      .send({
        name: 'Test Template',
        description: 'Test template for integration tests',
        subject: 'Test Subject',
        content: '<p>Hello {{name}},</p><p>This is a test email.</p>',
        variables: ['name']
      });
    
    testTemplateId = templateResponse.body.id;
  });
  
  after(async () => {
    // Clean up Redis
    await redisClient.flushDb();
    await redisClient.quit();
    
    // Close message queue connections
    await closeMessageQueue();
  });
  
  describe('Health Check', () => {
    it('should return 200 OK for health check endpoint', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('status', 'ok');
      expect(response.body).to.have.property('service', 'notification-service');
    });
  });
  
  describe('Email Notifications', () => {
    it('should queue an email notification with direct content', async () => {
      const response = await request(app)
        .post('/notifications/email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: 'recipient@example.com',
          subject: 'Test Email',
          text: 'This is a test email',
          html: '<p>This is a test email</p>'
        });
      
      expect(response.status).to.equal(202);
      expect(response.body).to.have.property('message', 'Email notification queued successfully');
    });
    
    it('should queue an email notification with template', async () => {
      const response = await request(app)
        .post('/notifications/email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: 'recipient@example.com',
          templateId: testTemplateId,
          templateData: {
            name: 'Test User'
          }
        });
      
      expect(response.status).to.equal(202);
      expect(response.body).to.have.property('message', 'Email notification queued successfully');
    });
    
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/notifications/email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subject: 'Test Email'
          // Missing 'to' field
        });
      
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('errors');
    });
    
    it('should return 401 if no auth token is provided', async () => {
      const response = await request(app)
        .post('/notifications/email')
        .send({
          to: 'recipient@example.com',
          subject: 'Test Email',
          text: 'This is a test email'
        });
      
      expect(response.status).to.equal(401);
    });
  });
  
  describe('In-App Notifications', () => {
    it('should create an in-app notification', async () => {
      const response = await request(app)
        .post('/notifications/inapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: 'test-user-id',
          type: 'info',
          title: 'Test Notification',
          message: 'This is a test notification',
          data: { key: 'value' }
        });
      
      expect(response.status).to.equal(202);
      expect(response.body).to.have.property('message', 'In-app notification queued successfully');
    });
    
    it('should get user notifications', async () => {
      // First create a notification
      await request(app)
        .post('/notifications/inapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: 'test-user-id',
          type: 'info',
          title: 'Test Notification',
          message: 'This is a test notification'
        });
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get notifications
      const response = await request(app)
        .get('/notifications/user/test-user-id')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('object');
      expect(response.body.notifications).to.be.an('array');
      expect(response.body.notifications.length).to.be.at.least(1);
    });
    
    it('should mark a notification as read', async () => {
      // First create a notification
      await request(app)
        .post('/notifications/inapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: 'test-user-id',
          type: 'info',
          title: 'Test Notification',
          message: 'This is a test notification'
        });
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get notification ID
      const getResponse = await request(app)
        .get('/notifications/user/test-user-id')
        .set('Authorization', `Bearer ${authToken}`);
      
      const notificationId = getResponse.body.notifications[0].id;
      
      // Mark as read
      const response = await request(app)
        .put(`/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: 'test-user-id'
        });
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message', 'Notification marked as read');
      
      // Verify it's marked as read
      const verifyResponse = await request(app)
        .get('/notifications/user/test-user-id')
        .set('Authorization', `Bearer ${authToken}`);
      
      const readNotification = verifyResponse.body.notifications.find(
        (n: any) => n.id === notificationId
      );
      
      expect(readNotification.read).to.equal(true);
    });
    
    it('should mark all notifications as read', async () => {
      // Create multiple notifications
      await request(app)
        .post('/notifications/inapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: 'test-user-id',
          type: 'info',
          title: 'Test Notification 1',
          message: 'This is test notification 1'
        });
      
      await request(app)
        .post('/notifications/inapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: 'test-user-id',
          type: 'info',
          title: 'Test Notification 2',
          message: 'This is test notification 2'
        });
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mark all as read
      const response = await request(app)
        .put('/notifications/user/test-user-id/read-all')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      
      // Verify all are marked as read
      const verifyResponse = await request(app)
        .get('/notifications/user/test-user-id')
        .set('Authorization', `Bearer ${authToken}`);
      
      const unreadNotifications = verifyResponse.body.notifications.filter(
        (n: any) => !n.read
      );
      
      expect(unreadNotifications.length).to.equal(0);
    });
  });
  
  describe('Notification Templates', () => {
    it('should create a template', async () => {
      const response = await request(app)
        .post('/templates')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send({
          name: 'Welcome Email',
          description: 'Welcome email for new users',
          subject: 'Welcome to Renexus',
          content: '<p>Hello {{name}},</p><p>Welcome to Renexus!</p>',
          variables: ['name']
        });
      
      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id');
      expect(response.body).to.have.property('name', 'Welcome Email');
    });
    
    it('should get all templates', async () => {
      const response = await request(app)
        .get('/templates')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.at.least(1);
    });
    
    it('should get a template by ID', async () => {
      const response = await request(app)
        .get(`/templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('id', testTemplateId);
      expect(response.body).to.have.property('name', 'Test Template');
    });
    
    it('should update a template', async () => {
      const response = await request(app)
        .put(`/templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send({
          subject: 'Updated Subject',
          content: '<p>Updated content for {{name}}</p>'
        });
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('subject', 'Updated Subject');
      expect(response.body).to.have.property('content', '<p>Updated content for {{name}}</p>');
    });
    
    it('should not allow non-admin to update templates', async () => {
      const response = await request(app)
        .put(`/templates/${testTemplateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          subject: 'Should Not Update'
        });
      
      expect(response.status).to.equal(403);
    });
    
    it('should delete a template', async () => {
      // Create a template to delete
      const createResponse = await request(app)
        .post('/templates')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send({
          name: 'Template To Delete',
          description: 'This template will be deleted',
          subject: 'Delete Me',
          content: '<p>Delete this template</p>',
          variables: []
        });
      
      const templateId = createResponse.body.id;
      
      // Delete the template
      const response = await request(app)
        .delete(`/templates/${templateId}`)
        .set('Authorization', `Bearer ${adminAuthToken}`);
      
      expect(response.status).to.equal(200);
      
      // Verify it's deleted
      const verifyResponse = await request(app)
        .get(`/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(verifyResponse.status).to.equal(404);
    });
  });
});
