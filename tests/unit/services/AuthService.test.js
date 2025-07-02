/**
 * Unit Tests for Authentication Service
 * Phase 5.1.1 - Unit Testing
 */
const AuthService = require('../../../src/services/AuthService');
const UserRepository = require('../../../src/repositories/UserRepository');
const TokenService = require('../../../src/services/TokenService');

// Mocking dependencies
jest.mock('../../../src/repositories/UserRepository');
jest.mock('../../../src/services/TokenService');

describe('AuthService', () => {
  // Setup
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  // Login tests
  describe('login()', () => {
    test('should return user data and tokens on successful login', async () => {
      // Mock setup
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: '$2b$10$validHashedPassword',
        name: 'Test User',
        role: 'user'
      };
      
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };
      
      // Mock implementations
      UserRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);
      UserRepository.comparePassword = jest.fn().mockResolvedValue(true);
      TokenService.generateTokens = jest.fn().mockResolvedValue(mockTokens);
      
      // Test execution
      const result = await AuthService.login('test@example.com', 'password123');
      
      // Assertions
      expect(UserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(UserRepository.comparePassword).toHaveBeenCalledWith('password123', mockUser.password);
      expect(TokenService.generateTokens).toHaveBeenCalledWith({ 
        userId: mockUser.id, 
        email: mockUser.email, 
        role: mockUser.role 
      });
      
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role
        },
        tokens: mockTokens
      });
    });

    test('should throw an error when user not found', async () => {
      // Mock implementations
      UserRepository.findByEmail = jest.fn().mockResolvedValue(null);
      
      // Test execution & assertion
      await expect(AuthService.login('nonexistent@example.com', 'password123'))
        .rejects
        .toThrow('Invalid email or password');
        
      expect(UserRepository.findByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(UserRepository.comparePassword).not.toHaveBeenCalled();
      expect(TokenService.generateTokens).not.toHaveBeenCalled();
    });

    test('should throw an error when password is incorrect', async () => {
      // Mock setup
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password: '$2b$10$validHashedPassword',
      };
      
      // Mock implementations
      UserRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);
      UserRepository.comparePassword = jest.fn().mockResolvedValue(false);
      
      // Test execution & assertion
      await expect(AuthService.login('test@example.com', 'wrongpassword'))
        .rejects
        .toThrow('Invalid email or password');
        
      expect(UserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(UserRepository.comparePassword).toHaveBeenCalledWith('wrongpassword', mockUser.password);
      expect(TokenService.generateTokens).not.toHaveBeenCalled();
    });
  });

  // Register tests
  describe('register()', () => {
    test('should create a new user and return tokens', async () => {
      // Mock setup
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123'
      };
      
      const createdUser = {
        id: '456',
        name: 'New User',
        email: 'newuser@example.com',
        role: 'user'
      };
      
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      };
      
      // Mock implementations
      UserRepository.findByEmail = jest.fn().mockResolvedValue(null);
      UserRepository.create = jest.fn().mockResolvedValue(createdUser);
      TokenService.generateTokens = jest.fn().mockResolvedValue(mockTokens);
      
      // Test execution
      const result = await AuthService.register(userData);
      
      // Assertions
      expect(UserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(UserRepository.create).toHaveBeenCalledWith({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: 'user'
      });
      
      expect(TokenService.generateTokens).toHaveBeenCalledWith({ 
        userId: createdUser.id, 
        email: createdUser.email, 
        role: createdUser.role 
      });
      
      expect(result).toEqual({
        user: createdUser,
        tokens: mockTokens
      });
    });

    test('should throw an error when email already exists', async () => {
      // Mock setup
      const userData = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123'
      };
      
      const existingUser = {
        id: '789',
        email: 'existing@example.com'
      };
      
      // Mock implementations
      UserRepository.findByEmail = jest.fn().mockResolvedValue(existingUser);
      
      // Test execution & assertion
      await expect(AuthService.register(userData))
        .rejects
        .toThrow('Email already in use');
        
      expect(UserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(UserRepository.create).not.toHaveBeenCalled();
      expect(TokenService.generateTokens).not.toHaveBeenCalled();
    });
  });

  // Refresh token tests
  describe('refreshTokens()', () => {
    test('should return new tokens when refresh token is valid', async () => {
      // Mock setup
      const refreshToken = 'valid-refresh-token';
      const payload = { 
        userId: '123', 
        email: 'test@example.com', 
        role: 'user' 
      };
      
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };
      
      // Mock implementations
      TokenService.verifyRefreshToken = jest.fn().mockResolvedValue(payload);
      TokenService.generateTokens = jest.fn().mockResolvedValue(mockTokens);
      
      // Test execution
      const result = await AuthService.refreshTokens(refreshToken);
      
      // Assertions
      expect(TokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(TokenService.generateTokens).toHaveBeenCalledWith(payload);
      expect(result).toEqual(mockTokens);
    });

    test('should throw an error when refresh token is invalid', async () => {
      // Mock setup
      const refreshToken = 'invalid-refresh-token';
      
      // Mock implementations
      TokenService.verifyRefreshToken = jest.fn().mockRejectedValue(new Error('Invalid token'));
      
      // Test execution & assertion
      await expect(AuthService.refreshTokens(refreshToken))
        .rejects
        .toThrow('Invalid token');
        
      expect(TokenService.verifyRefreshToken).toHaveBeenCalledWith(refreshToken);
      expect(TokenService.generateTokens).not.toHaveBeenCalled();
    });
  });
});
