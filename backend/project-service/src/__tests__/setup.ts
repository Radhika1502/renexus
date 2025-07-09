import { prisma } from '../db';

// Set test environment variables
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/project_service";
process.env.PORT = "3001";
process.env.NODE_ENV = "test";

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Increase timeout for all tests
jest.setTimeout(10000);

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Fail the test suite if there are unhandled rejections
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Fail the test suite if there are uncaught exceptions
  process.exit(1);
}); 