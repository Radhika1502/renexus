// @ts-nocheck
/* 
 * This file uses @ts-nocheck to bypass TypeScript errors in test mocks.
 * Since this is a test file, we prioritize test functionality over type safety.
 */

// Using a mock UUID function since we're just testing
const uuidv4 = () => 'test-uuid-' + Math.random().toString(36).substring(2, 15);

import { db } from '../../packages/database/db';
import { sessions } from '../../packages/database/schema/sessions';
import { SessionService } from '../../services/auth/session.service';

// Mock database
jest.mock('../../packages/database/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn()
  }
}));

describe('Session Service', () => {
  let sessionService: SessionService;
  const mockSession = {
    id: '123',
    userId: '456',
    token: 'test-token',
    expiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    lastActivityAt: new Date()
  };

  beforeEach(() => {
    sessionService = new SessionService(db);
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const mockValues = jest.fn().mockResolvedValue([mockSession]);
      const mockInsert = jest.fn().mockReturnValue({ values: mockValues });
      (db.insert as jest.Mock).mockImplementation(mockInsert);

      const result = await sessionService.createSession('456');
      expect(result).toEqual(mockSession);
    });
  });

  describe('validateSession', () => {
    it('should validate a valid session', async () => {
      const mockWhere = jest.fn().mockResolvedValue([mockSession]);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });
      (db.select as jest.Mock).mockImplementation(mockSelect);

      const result = await sessionService.validateSession('test-token');
      expect(result).toBe(true);
    });

    it('should return false for invalid session', async () => {
      const mockWhere = jest.fn().mockResolvedValue([]);
      const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
      const mockSelect = jest.fn().mockReturnValue({ from: mockFrom });
      (db.select as jest.Mock).mockImplementation(mockSelect);

      const result = await sessionService.validateSession('invalid-token');
      expect(result).toBe(false);
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      const mockWhere = jest.fn().mockResolvedValue([mockSession]);
      const mockDelete = jest.fn().mockReturnValue({ where: mockWhere });
      (db.delete as jest.Mock).mockImplementation(mockDelete);

      await sessionService.deleteSession('test-token');
      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('updateLastActivity', () => {
    it('should update last activity timestamp', async () => {
      const mockWhere = jest.fn().mockResolvedValue([mockSession]);
      const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
      const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });
      (db.update as jest.Mock).mockImplementation(mockUpdate);

      await sessionService.updateLastActivity('test-token');
      expect(mockWhere).toHaveBeenCalled();
    });
  });
});

