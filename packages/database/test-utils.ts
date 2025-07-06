import { getDatabaseClient, createDatabaseClient, DatabaseConfig } from './client';
import { createConnectionManager } from './connection';
import { createTransactionManager, withTransaction } from './transaction-manager';
import { createMigrationRunner } from './migrations';
import { initialSchemaMigration } from './migrations/001_initial_schema';
import { seeder } from './seeds';
import { logger } from './logger';
import * as crypto from 'crypto';

export interface TestDatabaseConfig {
  baseConfig: DatabaseConfig;
  testPrefix?: string;
  isolationLevel?: 'database' | 'transaction' | 'none';
  cleanupStrategy?: 'truncate' | 'drop' | 'rollback';
  seedData?: boolean;
  customSeedData?: any;
}

export interface TestContext {
  testId: string;
  databaseName: string;
  client: any;
  cleanup: () => Promise<void>;
  transaction?: any;
  rollback?: () => Promise<void>;
}

export interface TestDataFactory {
  createTenant(overrides?: any): any;
  createUser(overrides?: any): any;
  createTeam(overrides?: any): any;
  createProject(overrides?: any): any;
  createTask(overrides?: any): any;
  createTimeLog(overrides?: any): any;
}

export interface DatabaseTestUtils {
  createTestContext(config?: Partial<TestDatabaseConfig>): Promise<TestContext>;
  cleanupTestContext(context: TestContext): Promise<void>;
  createTestDatabase(testId: string): Promise<string>;
  dropTestDatabase(databaseName: string): Promise<void>;
  truncateAllTables(client: any): Promise<void>;
  seedTestData(client: any, customData?: any): Promise<void>;
  createTestDataFactory(client: any): TestDataFactory;
  runInTransaction<T>(client: any, callback: (tx: any) => Promise<T>): Promise<T>;
  waitForDatabaseReady(client: any, maxAttempts?: number): Promise<boolean>;
  compareTableData(client: any, table: string, expected: any[]): Promise<boolean>;
  getTableRowCount(client: any, table: string): Promise<number>;
}

class PostgresTestUtils implements DatabaseTestUtils {
  private activeContexts: Map<string, TestContext> = new Map();
  private defaultConfig: TestDatabaseConfig;

  constructor(config: TestDatabaseConfig) {
    this.defaultConfig = {
      testPrefix: 'test_renexus',
      isolationLevel: 'database',
      cleanupStrategy: 'drop',
      seedData: true,
      ...config,
    };
  }

  async createTestContext(config?: Partial<TestDatabaseConfig>): Promise<TestContext> {
    const testConfig = { ...this.defaultConfig, ...config };
    const testId = this.generateTestId();
    
    logger.info(`Creating test context: ${testId}`);

    try {
      let client: any;
      let cleanup: () => Promise<void>;
      let transaction: any;
      let rollback: (() => Promise<void>) | undefined;

      if (testConfig.isolationLevel === 'database') {
        // Create isolated test database
        const databaseName = await this.createTestDatabase(testId);
        const dbConfig = {
          ...testConfig.baseConfig,
          database: databaseName,
        };
        
        client = createDatabaseClient(dbConfig);
        await client.connect();
        
        // Run migrations
        await this.setupTestDatabase(client);
        
        // Seed data if requested
        if (testConfig.seedData) {
          await this.seedTestData(client, testConfig.customSeedData);
        }
        
        cleanup = async () => {
          await client.disconnect();
          await this.dropTestDatabase(databaseName);
        };

        const context: TestContext = {
          testId,
          databaseName,
          client,
          cleanup,
        };

        this.activeContexts.set(testId, context);
        return context;
        
      } else if (testConfig.isolationLevel === 'transaction') {
        // Use transaction-based isolation
        client = getDatabaseClient();
        const transactionManager = createTransactionManager();
        transaction = await transactionManager.beginTransaction();
        
        // Seed data if requested
        if (testConfig.seedData) {
          await this.seedTestData(client, testConfig.customSeedData);
        }
        
        rollback = async () => {
          await transactionManager.rollbackTransaction(transaction);
        };
        
        cleanup = async () => {
          if (transaction.isActive) {
            await transactionManager.rollbackTransaction(transaction);
          }
        };

        const context: TestContext = {
          testId,
          databaseName: testConfig.baseConfig.database,
          client,
          cleanup,
          transaction,
          rollback,
        };

        this.activeContexts.set(testId, context);
        return context;
        
      } else {
        // No isolation - use shared database
        client = getDatabaseClient();
        
        // Clean existing data
        await this.truncateAllTables(client);
        
        // Seed data if requested
        if (testConfig.seedData) {
          await this.seedTestData(client, testConfig.customSeedData);
        }
        
        cleanup = async () => {
          await this.truncateAllTables(client);
        };

        const context: TestContext = {
          testId,
          databaseName: testConfig.baseConfig.database,
          client,
          cleanup,
        };

        this.activeContexts.set(testId, context);
        return context;
      }
    } catch (error) {
      logger.error(`Failed to create test context ${testId}:`, error);
      throw error;
    }
  }

  async cleanupTestContext(context: TestContext): Promise<void> {
    logger.info(`Cleaning up test context: ${context.testId}`);
    
    try {
      await context.cleanup();
      this.activeContexts.delete(context.testId);
      logger.info(`Test context ${context.testId} cleaned up successfully`);
    } catch (error) {
      logger.error(`Failed to cleanup test context ${context.testId}:`, error);
      throw error;
    }
  }

  async createTestDatabase(testId: string): Promise<string> {
    const databaseName = `${this.defaultConfig.testPrefix}_${testId}`;
    const adminClient = createDatabaseClient({
      ...this.defaultConfig.baseConfig,
      database: 'postgres', // Connect to postgres database to create new database
    });
    
    try {
      await adminClient.connect();
      await adminClient.sql`CREATE DATABASE ${adminClient.sql(databaseName)}`;
      logger.info(`Test database created: ${databaseName}`);
      return databaseName;
    } finally {
      await adminClient.disconnect();
    }
  }

  async dropTestDatabase(databaseName: string): Promise<void> {
    const adminClient = createDatabaseClient({
      ...this.defaultConfig.baseConfig,
      database: 'postgres',
    });
    
    try {
      await adminClient.connect();
      // Terminate active connections to the database
      await adminClient.sql`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = ${databaseName} AND pid <> pg_backend_pid()
      `;
      await adminClient.sql`DROP DATABASE IF EXISTS ${adminClient.sql(databaseName)}`;
      logger.info(`Test database dropped: ${databaseName}`);
    } finally {
      await adminClient.disconnect();
    }
  }

  async truncateAllTables(client: any): Promise<void> {
    await withTransaction(async (context) => {
      // Get all table names
      const tables = await context.client.sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `;
      
      if (tables.length === 0) {
        return;
      }
      
      // Disable foreign key checks temporarily
      await context.client.sql`SET session_replication_role = replica`;
      
      // Truncate all tables
      for (const table of tables) {
        await context.client.sql`TRUNCATE TABLE ${context.client.sql(table.table_name)} CASCADE`;
      }
      
      // Re-enable foreign key checks
      await context.client.sql`SET session_replication_role = DEFAULT`;
      
      logger.info(`Truncated ${tables.length} tables`);
    });
  }

  async seedTestData(client: any, customData?: any): Promise<void> {
    if (customData) {
      await this.seedCustomData(client, customData);
    } else {
      await seeder.seedAll();
    }
    logger.info('Test data seeded successfully');
  }

  createTestDataFactory(client: any): TestDataFactory {
    return {
      createTenant: (overrides = {}) => ({
        id: crypto.randomUUID(),
        name: 'Test Tenant',
        slug: 'test-tenant',
        created_at: new Date(),
        updated_at: new Date(),
        ...overrides,
      }),
      
      createUser: (overrides = {}) => ({
        id: crypto.randomUUID(),
        email: `test-${Date.now()}@example.com`,
        password_hash: '$2b$10$test.hash.placeholder',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        created_at: new Date(),
        updated_at: new Date(),
        ...overrides,
      }),
      
      createTeam: (overrides = {}) => ({
        id: crypto.randomUUID(),
        name: 'Test Team',
        description: 'Test team description',
        created_at: new Date(),
        updated_at: new Date(),
        ...overrides,
      }),
      
      createProject: (overrides = {}) => ({
        id: crypto.randomUUID(),
        name: 'Test Project',
        description: 'Test project description',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        ...overrides,
      }),
      
      createTask: (overrides = {}) => ({
        id: crypto.randomUUID(),
        title: 'Test Task',
        description: 'Test task description',
        status: 'todo',
        priority: 'medium',
        created_at: new Date(),
        updated_at: new Date(),
        ...overrides,
      }),
      
      createTimeLog: (overrides = {}) => ({
        id: crypto.randomUUID(),
        hours_logged: 2.5,
        description: 'Test time log',
        logged_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        ...overrides,
      }),
    };
  }

  async runInTransaction<T>(client: any, callback: (tx: any) => Promise<T>): Promise<T> {
    return withTransaction(callback);
  }

  async waitForDatabaseReady(client: any, maxAttempts: number = 30): Promise<boolean> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await client.sql`SELECT 1`;
        return true;
      } catch (error) {
        if (attempt === maxAttempts) {
          logger.error('Database not ready after maximum attempts');
          return false;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return false;
  }

  async compareTableData(client: any, table: string, expected: any[]): Promise<boolean> {
    try {
      const actual = await client.sql`SELECT * FROM ${client.sql(table)} ORDER BY id`;
      
      if (actual.length !== expected.length) {
        logger.warn(`Table ${table}: Expected ${expected.length} rows, got ${actual.length}`);
        return false;
      }
      
      for (let i = 0; i < expected.length; i++) {
        const expectedRow = expected[i];
        const actualRow = actual[i];
        
        for (const key in expectedRow) {
          if (expectedRow[key] !== actualRow[key]) {
            logger.warn(`Table ${table}, row ${i}, field ${key}: Expected ${expectedRow[key]}, got ${actualRow[key]}`);
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      logger.error(`Error comparing table data for ${table}:`, error);
      return false;
    }
  }

  async getTableRowCount(client: any, table: string): Promise<number> {
    const result = await client.sql`SELECT COUNT(*) as count FROM ${client.sql(table)}`;
    return parseInt(result[0].count);
  }

  private generateTestId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async setupTestDatabase(client: any): Promise<void> {
    // Run migrations to set up schema
    const migrationRunner = createMigrationRunner([initialSchemaMigration]);
    await migrationRunner.runMigrations();
  }

  private async seedCustomData(client: any, customData: any): Promise<void> {
    await withTransaction(async (context) => {
      // Seed custom data based on provided structure
      if (customData.tenants) {
        for (const tenant of customData.tenants) {
          await context.client.sql`
            INSERT INTO tenants (id, name, slug, created_at, updated_at)
            VALUES (${tenant.id}, ${tenant.name}, ${tenant.slug}, ${tenant.created_at}, ${tenant.updated_at})
          `;
        }
      }
      
      if (customData.users) {
        for (const user of customData.users) {
          await context.client.sql`
            INSERT INTO users (id, email, password_hash, first_name, last_name, role, created_at, updated_at)
            VALUES (${user.id}, ${user.email}, ${user.password_hash}, ${user.first_name}, ${user.last_name}, ${user.role}, ${user.created_at}, ${user.updated_at})
          `;
        }
      }
      
      // Add more custom data seeding as needed
    });
  }

  // Cleanup all active contexts (useful for test teardown)
  async cleanupAllContexts(): Promise<void> {
    const contexts = Array.from(this.activeContexts.values());
    await Promise.all(contexts.map(context => this.cleanupTestContext(context)));
  }
}

// Global test utils instance
let globalTestUtils: DatabaseTestUtils | null = null;

export const createTestUtils = (config: TestDatabaseConfig): DatabaseTestUtils => {
  globalTestUtils = new PostgresTestUtils(config);
  return globalTestUtils;
};

export const getTestUtils = (): DatabaseTestUtils => {
  if (!globalTestUtils) {
    throw new Error('Test utils not initialized');
  }
  return globalTestUtils;
};

// Helper functions for common test scenarios
export const withTestContext = async <T>(
  testFn: (context: TestContext) => Promise<T>,
  config?: Partial<TestDatabaseConfig>
): Promise<T> => {
  const testUtils = getTestUtils();
  const context = await testUtils.createTestContext(config);
  
  try {
    return await testFn(context);
  } finally {
    await testUtils.cleanupTestContext(context);
  }
};

export const withTestTransaction = async <T>(
  testFn: (tx: any) => Promise<T>,
  client?: any
): Promise<T> => {
  const testUtils = getTestUtils();
  const testClient = client || getDatabaseClient();
  return testUtils.runInTransaction(testClient, testFn);
};

export default getTestUtils; 