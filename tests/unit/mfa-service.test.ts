// @ts-nocheck

import { db } from '../../packages/database/db';
import { users } from '../../packages/database/schema/users';
import { MfaService } from '../../services/auth/mfa.service';
import { eq } from 'drizzle-orm';
import type { User } from '../../packages/database/types';
import type { GeneratedSecret } from 'speakeasy';

// Using a mock UUID function since we're just testing
const uuidv4 = () => 'test-uuid-' + Math.random().toString(36).substring(2, 15);

// Mock dependencies
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn().mockReturnValue({
    base32: 'test-secret',
    otpauth_url: 'otpauth://totp/test@example.com?secret=test-secret'
  } as GeneratedSecret),
  totp: {
    verify: jest.fn().mockReturnValue(true)
  }
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,test')
}));

// Mock database with proper Drizzle types
jest.mock('../../packages/database/db', () => {
  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis()
  };
  return { db: mockDb };
});

describe('MFA Service', () => {
  let mfaService: MfaService;
  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isActive: true,
    mfaEnabled: false,
    mfaSecret: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLoginAt: null
  };

  beforeEach(() => {
    mfaService = new MfaService(db);
    jest.clearAllMocks();
    (db.execute as jest.Mock).mockReset();
  });

  describe('setupMfa', () => {
    it('should setup MFA for a user', async () => {
      // Mock the user query
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([mockUser]);
      
      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom,
        where: mockWhere
      }));
      
      // Mock the update query
      const mockSet = jest.fn().mockReturnThis();
      const mockUpdateWhere = jest.fn().mockResolvedValue([{
        ...mockUser,
        mfaEnabled: true,
        mfaSecret: 'test-secret'
      }]);
      
      (db.update as jest.Mock).mockImplementation(() => ({
        set: mockSet,
        where: mockUpdateWhere
      }));

      const result = await mfaService.setupMfa('123');
      
      expect(result).toEqual({
        secret: 'test-secret',
        qrCode: 'data:image/png;base64,test'
      });

      expect(mockWhere).toHaveBeenCalledWith(eq(users.id, '123'));
      expect(mockSet).toHaveBeenCalledWith({
        mfaEnabled: true,
        mfaSecret: 'test-secret'
      });
    });

    it('should throw error if user not found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([]);
      
      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom,
        where: mockWhere
      }));

      await expect(mfaService.setupMfa('123')).rejects.toThrow('User not found');
    });
  });

  describe('verifyMfa', () => {
    it('should verify MFA token', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([{
        ...mockUser,
        mfaEnabled: true,
        mfaSecret: 'test-secret'
      }]);
      
      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom,
        where: mockWhere
      }));

      const result = await mfaService.verifyMfa('123', '123456');
      expect(result).toBe(true);
    });

    it('should return false for disabled MFA', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([mockUser]);
      
      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom,
        where: mockWhere
      }));

      const result = await mfaService.verifyMfa('123', '123456');
      expect(result).toBe(false);
    });

    it('should throw error if user not found', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockFrom = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([]);
      
      (db.select as jest.Mock).mockImplementation(() => ({
        from: mockFrom,
        where: mockWhere
      }));

      await expect(mfaService.verifyMfa('123', '123456')).rejects.toThrow('User not found');
    });
  });

  describe('disableMfa', () => {
    it('should disable MFA for a user', async () => {
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue([{
        ...mockUser,
        mfaEnabled: false,
        mfaSecret: null
      }]);
      
      (db.update as jest.Mock).mockImplementation(() => ({
        set: mockSet,
        where: mockWhere
      }));

      await mfaService.disableMfa('123');

      expect(mockSet).toHaveBeenCalledWith({
        mfaEnabled: false,
        mfaSecret: null
      });
      expect(mockWhere).toHaveBeenCalledWith(eq(users.id, '123'));
    });
  });
});

