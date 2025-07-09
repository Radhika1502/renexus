import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';

const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/renexus_test';

class TestDatabase {
  private pool: Pool;
  private static instance: TestDatabase;

  private constructor() {
    this.pool = new Pool({
      connectionString: TEST_DB_URL,
      max: 1 // Limit pool size for tests
    });
  }

  static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  async connect() {
    const db = drizzle(this.pool);
    await migrate(db, { migrationsFolder: './drizzle' });
    return db;
  }

  async cleanup() {
    // Drop all tables after tests
    const db = drizzle(this.pool);
    await db.execute(sql`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = current_schema()) LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);
  }

  async disconnect() {
    await this.pool.end();
  }

  async transaction<T>(callback: (db: any) => Promise<T>): Promise<T> {
    const db = await this.connect();
    try {
      const result = await callback(db);
      return result;
    } finally {
      await this.cleanup();
    }
  }
}

export const testDb = TestDatabase.getInstance();

// Global setup
beforeAll(async () => {
  await testDb.connect();
});

// Global teardown
afterAll(async () => {
  await testDb.cleanup();
  await testDb.disconnect();
});

// Transaction wrapper for tests
export const withTestDb = (fn: (db: any) => Promise<void>) => {
  return async () => {
    await testDb.transaction(fn);
  };
}; 