import { 
  errorHandler, 
  notFoundHandler, 
  requestTracker,
  ApiError,
  ValidationError,
  NotFoundError,
  AuthenticationError
} from '../../backend/middleware/error.middleware';
import { Request, Response } from 'express';

describe('Error Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      originalUrl: '/test',
      method: 'GET',
      body: { test: 'data' },
      query: { q: 'search' },
      params: { id: '123' }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('Custom Error Classes', () => {
    it('should create ApiError with correct properties', () => {
      const error = new ApiError('API Error', 500);
      expect(error.message).toBe('API Error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('ApiError');
    });

    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Invalid data', ['field is required']);
      expect(error.message).toBe('Invalid data');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
      expect(error.errors).toEqual(['field is required']);
    });

    it('should create NotFoundError with correct properties', () => {
      const error = new NotFoundError('Resource not found');
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    it('should create AuthenticationError with correct properties', () => {
      const error = new AuthenticationError('Unauthorized');
      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('AuthenticationError');
    });
  });

  describe('requestTracker', () => {
    it('should add request ID to the request object', () => {
      requestTracker(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockRequest.id).toBeDefined();
      expect(typeof mockRequest.id).toBe('string');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('errorHandler', () => {
    beforeEach(() => {
      mockRequest.id = 'test-request-id';
    });

    it('should handle ApiError correctly', () => {
      const error = new ApiError('API Error', 500);

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        statusCode: 500,
        message: 'API Error',
        requestId: 'test-request-id',
        path: '/test',
        method: 'GET'
      }));
      expect(consoleSpy).toHaveBeenCalledWith('[ERROR]', expect.any(String));
    });

    it('should handle ValidationError with error details', () => {
      const error = new ValidationError('Validation failed', ['field is invalid']);

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        statusCode: 400,
        message: 'Validation failed',
        errors: ['field is invalid'],
        requestId: 'test-request-id'
      }));
    });

    it('should include request details in error log', () => {
      const error = new Error('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith('[ERROR]', expect.stringContaining('"body":{"test":"data"}'));
      expect(consoleSpy).toHaveBeenCalledWith('[ERROR]', expect.stringContaining('"query":{"q":"search"}'));
      expect(consoleSpy).toHaveBeenCalledWith('[ERROR]', expect.stringContaining('"params":{"id":"123"}'));
    });

    it('should use default 500 status for errors without status code', () => {
      const error = new Error('Internal error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        status: 'error',
        statusCode: 500,
        message: 'Internal error',
        requestId: 'test-request-id'
      }));
    });

    it('should use default message for errors without message', () => {
      const error = new Error();

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Internal server error',
        requestId: 'test-request-id'
      }));
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Dev error');
      error.stack = 'Test stack trace';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
        stack: 'Test stack trace',
        requestId: 'test-request-id'
      }));

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Prod error');
      error.stack = 'Test stack trace';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith(expect.not.objectContaining({
        stack: expect.any(String)
      }));

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('notFoundHandler', () => {
    beforeEach(() => {
      mockRequest.id = 'test-request-id';
    });

    it('should return 404 with route information', () => {
      notFoundHandler(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 404,
        message: 'Route not found: /test',
        requestId: 'test-request-id',
        timestamp: expect.any(String),
        path: '/test',
        method: 'GET'
      });
    });
  });
}); 