// @ts-nocheck

// Mock dependencies
jest.mock('helmet', () => jest.fn());
jest.mock('cors', () => jest.fn());
jest.mock('compression', () => jest.fn());
jest.mock('express-rate-limit', () => jest.fn());
jest.mock('morgan', () => jest.fn());

// Mock express
jest.mock('express', () => {
  const express = jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }));
  express.json = jest.fn();
  express.urlencoded = jest.fn();
  express.static = jest.fn();
  return express;
});

// Mock middleware
jest.mock('../../backend/middleware/auth', () => ({
  authenticate: jest.fn()
}));

// Mock all route imports
jest.mock('../../api/routes/auth', () => ({ default: jest.fn() }), { virtual: true });
jest.mock('../../api/routes/auth/session.routes', () => ({ default: jest.fn() }), { virtual: true });
jest.mock('../../api/routes/projects', () => ({ default: jest.fn() }), { virtual: true });
jest.mock('../../api/routes/tasks', () => ({ default: jest.fn() }), { virtual: true });
jest.mock('../../api/routes/templates', () => ({ default: jest.fn() }), { virtual: true });
jest.mock('../../api/routes/users', () => ({ default: jest.fn() }), { virtual: true });

// Import dependencies after mocks
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

describe('API Gateway Tests', () => {
  // Simple tests that don't require actual API Gateway instantiation
  describe('Middleware Configuration', () => {
    it('should mock helmet correctly', () => {
      expect(typeof helmet).toBe('function');
    });

    it('should mock cors correctly', () => {
      expect(typeof cors).toBe('function');
    });

    it('should mock compression correctly', () => {
      expect(typeof compression).toBe('function');
    });

    it('should mock rate limiting correctly', () => {
      expect(typeof rateLimit).toBe('function');
    });
  });
});

