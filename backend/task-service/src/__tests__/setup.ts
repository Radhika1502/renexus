import { execSync } from 'child_process';

// Set test environment variables early so they are available before Prisma Client initialization
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/project_service";
process.env.PORT = "3002";
process.env.NODE_ENV = "test";

import { prisma } from '../db';

// Helper to create required tables when they do not yet exist
async function ensureSchema() {
  // Create the core Task table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Task" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "title" TEXT NOT NULL,
      "description" TEXT,
      "status" TEXT NOT NULL DEFAULT 'Todo',
      "projectId" TEXT NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  // Join table for the self-referential many-to-many relation
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_TaskDependencies" (
      "A" UUID NOT NULL,
      "B" UUID NOT NULL,
      CONSTRAINT "_TaskDependencies_A_fkey" FOREIGN KEY ("A") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "_TaskDependencies_B_fkey" FOREIGN KEY ("B") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      PRIMARY KEY ("A", "B")
    );
  `);
}

beforeAll(async () => {
  await prisma.$connect();
  await ensureSchema();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Increase timeout for all tests – database setups can be slow in CI
jest.setTimeout(10000);

// Handle unhandled promise rejections & uncaught exceptions so Jest fails fast
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
}); 