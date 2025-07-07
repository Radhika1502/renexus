import '@testing-library/jest-dom';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql as drizzleSQL } from 'drizzle-orm/sql';
import { tasks, projects, users, sessions } from '../packages/database/schema';

// Mock database for tests
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  execute: jest.fn(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  transaction: jest.fn(),
  sql: drizzleSQL
};

// Mock the database module
jest.mock('../packages/database/db', () => ({
  default: mockDb,
  db: mockDb
}));

// Initialize test database connection if needed for integration tests
let pool: Pool | null = null;
let testDb: ReturnType<typeof drizzle> | null = null;

if (process.env.TEST_TYPE === 'integration') {
  pool = new Pool({
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    user: process.env.TEST_DB_USER || 'test',
    password: process.env.TEST_DB_PASSWORD || 'test',
    database: process.env.TEST_DB_NAME || 'test_db'
  });

  testDb = drizzle(pool, {
    schema: {
      tasks,
      projects,
      users,
      sessions
    }
  });
}

// Global test setup
beforeAll(async () => {
  if (testDb && pool) {
    // Clear all tables before integration tests
    await testDb.execute(drizzleSQL`TRUNCATE TABLE users, projects, tasks, sessions CASCADE`);
  }
});

// Global test cleanup
afterAll(async () => {
  if (pool) {
    await pool.end();
  }
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  if (mockDb) {
    Object.values(mockDb).forEach(mock => {
      if (jest.isMockFunction(mock)) {
        mock.mockClear();
      }
    });
  }
}); 