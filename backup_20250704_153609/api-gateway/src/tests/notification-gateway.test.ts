import request from 'supertest';
import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import nock from 'nock';
import jwt from 'jsonwebtoken';
import app from '../index';

describe('API Gateway - Notification Service Integration Tests', () => {
  let authToken: string;
  let adminAuthToken: string;
  const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4002';
  
  before(() => {
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
  });
  
  describe('Notification Routes', () => {
    it('should proxy email notification requests to notification service', async () => {
      // Mock notification service response
      nock(notificationServiceUrl)
        .post('/notifications/email')
        .reply(202, { message: 'Email notification queued successfully' });
      
      const response = await request(app)
        .post('/api/notifications/email')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          to: 'recipient@example.com',
          subject: 'Test Email',
          text: 'This is a test email'
        });
      
      expect(response.status).to.equal(202);
      expect(response.body).to.have.property('message', 'Email notification queued successfully');
    });
    
    it('should proxy in-app notification requests to notification service', async () => {
      // Mock notification service response
      nock(notificationServiceUrl)
        .post('/notifications/inapp')
        .reply(202, { message: 'In-app notification queued successfully' });
      
      const response = await request(app)
        .post('/api/notifications/inapp')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: 'test-user-id',
          type: 'info',
          title: 'Test Notification',
          message: 'This is a test notification'
        });
      
      expect(response.status).to.equal(202);
      expect(response.body).to.have.property('message', 'In-app notification queued successfully');
    });
    
    it('should proxy user notification requests to notification service', async () => {
      // Mock notification service response
      nock(notificationServiceUrl)
        .get('/notifications/user/test-user-id')
        .reply(200, {
          notifications: [
            {
              id: 'notification:123',
              userId: 'test-user-id',
              title: 'Test Notification',
              message: 'This is a test notification',
              read: false
            }
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1
          }
        });
      
      const response = await request(app)
        .get('/api/notifications/user/test-user-id')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('notifications');
      expect(response.body.notifications).to.be.an('array');
      expect(response.body.notifications.length).to.equal(1);
    });
    
    it('should return 404 for non-existent notification routes', async () => {
      const response = await request(app)
        .get('/api/notifications/invalid-route')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(404);
    });
  });
  
  describe('Template Routes', () => {
    it('should proxy template creation requests to notification service', async () => {
      // Mock notification service response
      nock(notificationServiceUrl)
        .post('/templates')
        .reply(201, {
          id: 'template:123',
          name: 'Test Template',
          description: 'Test template description',
          subject: 'Test Subject',
          content: '<p>Test content</p>',
          variables: []
        });
      
      const response = await request(app)
        .post('/api/notification-templates')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send({
          name: 'Test Template',
          description: 'Test template description',
          subject: 'Test Subject',
          content: '<p>Test content</p>',
          variables: []
        });
      
      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('id', 'template:123');
      expect(response.body).to.have.property('name', 'Test Template');
    });
    
    it('should proxy template retrieval requests to notification service', async () => {
      // Mock notification service response
      nock(notificationServiceUrl)
        .get('/templates')
        .reply(200, [
          {
            id: 'template:123',
            name: 'Test Template',
            description: 'Test template description',
            subject: 'Test Subject',
            content: '<p>Test content</p>',
            variables: []
          }
        ]);
      
      const response = await request(app)
        .get('/api/notification-templates')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.equal(1);
      expect(response.body[0]).to.have.property('id', 'template:123');
    });
    
    it('should proxy template update requests to notification service', async () => {
      // Mock notification service response
      nock(notificationServiceUrl)
        .put('/templates/template:123')
        .reply(200, {
          id: 'template:123',
          name: 'Test Template',
          description: 'Updated description',
          subject: 'Updated Subject',
          content: '<p>Updated content</p>',
          variables: []
        });
      
      const response = await request(app)
        .put('/api/notification-templates/template:123')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send({
          description: 'Updated description',
          subject: 'Updated Subject',
          content: '<p>Updated content</p>'
        });
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('description', 'Updated description');
      expect(response.body).to.have.property('subject', 'Updated Subject');
    });
    
    it('should handle notification service unavailability', async () => {
      // Mock notification service being down
      nock(notificationServiceUrl)
        .get('/templates/template:123')
        .replyWithError('Service unavailable');
      
      const response = await request(app)
        .get('/api/notification-templates/template:123')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(response.status).to.equal(500);
      expect(response.body).to.have.property('message', 'Notification template service unavailable');
    });
  });
});
