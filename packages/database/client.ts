import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { logger } from './logger';
import * as schema from './schema';
import { getDatabaseUtils } from './db-utils';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  idleTimeout?: number;
  connectTimeout?: number;
}

export interface DatabaseClient {
  db: ReturnType<typeof drizzle>;
  sql: postgres.Sql;
  isConnected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
}

class PostgresClient implements DatabaseClient {
  public db: ReturnType<typeof drizzle>;
  public sql: postgres.Sql;
  public isConnected: boolean = false;
  private config: DatabaseConfig;
  private utils = getDatabaseUtils();

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.initializeConnection();
  }

  private initializeConnection(): void {
    try {
      // Create postgres connection
      this.sql = postgres({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        username: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl || false,
        max: this.config.maxConnections || 20,
        idle_timeout: this.config.idleTimeout || 30,
        connect_timeout: this.config.connectTimeout || 10,
        onnotice: (notice) => {
          logger.info('Database notice:', notice);
        },
        onparameter: (parameterStatus) => {
          logger.debug('Database parameter status:', parameterStatus);
        },
        // Add query profiling
        onQuery: (query) => {
          const profile = this.utils.profiler.startProfile(query.text, query.args);
          query.on('end', (result) => {
            this.utils.profiler.endProfile(profile, result);
          });
          query.on('error', (error) => {
            this.utils.profiler.endProfile(profile, undefined, error);
          });
        },
      });

      // Create drizzle instance with schema
      this.db = drizzle(this.sql, { schema });
      
      logger.info('Database client initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database client:', error);
      throw error;
    }
  }

  async connect(): Promise<void> {
    try {
      // Test connection with a simple query
      await this.sql`SELECT 1`;
      this.isConnected = true;
      logger.info('Database connection established successfully');

      // Initialize database utilities
      await this.utils.initialize();
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to connect to database:', error);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Shutdown database utilities
      await this.utils.shutdown();

      if (this.sql) {
        await this.sql.end();
        this.isConnected = false;
        logger.info('Database connection closed successfully');
      }
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const healthStatus = await this.utils.health.checkHealth();
      return healthStatus.isHealthy;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

// Database configuration from environment variables
const getDatabaseConfig = (): DatabaseConfig => {
  const config: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'renexus',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true',
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30', 10),
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10', 10),
  };

  // Validate required configuration
  if (!config.host || !config.database || !config.username) {
    throw new Error('Missing required database configuration');
  }

  return config;
};

// Create and export database client instance
let dbClient: DatabaseClient | null = null;

export const createDatabaseClient = (config?: DatabaseConfig): DatabaseClient => {
  if (!dbClient) {
    const dbConfig = config || getDatabaseConfig();
    dbClient = new PostgresClient(dbConfig);
  }
  return dbClient;
};

export const getDatabaseClient = (): DatabaseClient => {
  if (!dbClient) {
    dbClient = createDatabaseClient();
  }
  return dbClient;
};

// Export database instance for direct use
export const db = getDatabaseClient().db;
export const sql = getDatabaseClient().sql;

// Graceful shutdown handler
process.on('SIGINT', async () => {
  if (dbClient) {
    logger.info('Shutting down database connection...');
    await dbClient.disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (dbClient) {
    logger.info('Shutting down database connection...');
    await dbClient.disconnect();
  }
  process.exit(0);
});

export default getDatabaseClient;
