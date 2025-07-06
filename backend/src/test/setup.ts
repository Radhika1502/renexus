import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

const generateTestDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set');
  
  const dbName = `test_${uuidv4().replace(/-/g, '_')}`;
  return url.replace(/\/[^/]+$/, `/${dbName}`);
};

export const setupTestDatabase = async () => {
  const testDbUrl = generateTestDatabaseUrl();
  process.env.DATABASE_URL = testDbUrl;

  // Create test database
  const prisma = new PrismaClient();
  
  try {
    // Run migrations
    execSync('npx prisma migrate deploy', {
      env: { ...process.env, DATABASE_URL: testDbUrl },
      stdio: 'inherit',
    });

    return prisma;
  } catch (error) {
    console.error('Failed to setup test database:', error);
    throw error;
  }
};

export const teardownTestDatabase = async (prisma: PrismaClient) => {
  try {
    // Drop all tables
    await prisma.$executeRawUnsafe(`
      DROP SCHEMA public CASCADE;
      CREATE SCHEMA public;
    `);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to teardown test database:', error);
    throw error;
  }
};

export const createTestUser = async (prisma: PrismaClient, data = {}) => {
  return prisma.user.create({
    data: {
      email: `test_${uuidv4()}@example.com`,
      password: 'hashedPassword123',
      name: 'Test User',
      ...data,
    },
  });
};

export const createTestProject = async (prisma: PrismaClient, userId: string, data = {}) => {
  return prisma.project.create({
    data: {
      name: `Test Project ${uuidv4()}`,
      description: 'Test project description',
      createdById: userId,
      ...data,
    },
  });
};

export const createTestTask = async (prisma: PrismaClient, projectId: string, userId: string, data = {}) => {
  return prisma.task.create({
    data: {
      title: `Test Task ${uuidv4()}`,
      description: 'Test task description',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId,
      createdById: userId,
      ...data,
    },
  });
};

export const generateAuthToken = (userId: string): string => {
  // This would use your actual token generation logic
  return `test_token_${userId}`;
};

export const mockWebSocket = () => {
  return {
    broadcast: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
  };
};

export const mockRequest = (overrides = {}) => {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    user: { id: 'test-user-id' },
    ...overrides,
  };
};

export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

export const mockNext = jest.fn(); 