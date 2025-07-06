import { DatabaseClient, createDatabaseClient, DatabaseConfig } from './client';
import { logger } from './logger';

export interface ConnectionPoolConfig {
  minConnections: number;
  maxConnections: number;
  acquireTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
}

export interface ConnectionManager {
  initialize(): Promise<void>;
  getConnection(): Promise<DatabaseClient>;
  releaseConnection(client: DatabaseClient): Promise<void>;
  closeAllConnections(): Promise<void>;
  getConnectionStats(): ConnectionStats;
  isHealthy(): Promise<boolean>;
}

export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  pendingRequests: number;
  errorCount: number;
  lastHealthCheck: Date | null;
}

class PostgresConnectionManager implements ConnectionManager {
  private clients: Map<string, DatabaseClient> = new Map();
  private activeConnections: Set<string> = new Set();
  private idleConnections: Set<string> = new Set();
  private pendingRequests: number = 0;
  private errorCount: number = 0;
  private lastHealthCheck: Date | null = null;
  private config: ConnectionPoolConfig;
  private dbConfig: DatabaseConfig;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor(dbConfig: DatabaseConfig, poolConfig?: Partial<ConnectionPoolConfig>) {
    this.dbConfig = dbConfig;
    this.config = {
      minConnections: poolConfig?.minConnections || 2,
      maxConnections: poolConfig?.maxConnections || 20,
      acquireTimeoutMillis: poolConfig?.acquireTimeoutMillis || 30000,
      idleTimeoutMillis: poolConfig?.idleTimeoutMillis || 300000, // 5 minutes
      reapIntervalMillis: poolConfig?.reapIntervalMillis || 60000, // 1 minute
      createRetryIntervalMillis: poolConfig?.createRetryIntervalMillis || 5000,
      createTimeoutMillis: poolConfig?.createTimeoutMillis || 10000,
      destroyTimeoutMillis: poolConfig?.destroyTimeoutMillis || 5000,
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Connection manager already initialized');
      return;
    }

    try {
      logger.info('Initializing connection pool...');
      
      // Create minimum number of connections
      for (let i = 0; i < this.config.minConnections; i++) {
        const client = await this.createConnection();
        const clientId = this.generateClientId();
        this.clients.set(clientId, client);
        this.idleConnections.add(clientId);
      }

      // Start health check interval
      this.startHealthCheckInterval();
      
      // Start connection reaper
      this.startConnectionReaper();

      this.isInitialized = true;
      logger.info(`Connection pool initialized with ${this.config.minConnections} connections`);
    } catch (error) {
      logger.error('Failed to initialize connection pool:', error);
      throw error;
    }
  }

  async getConnection(): Promise<DatabaseClient> {
    if (!this.isInitialized) {
      throw new Error('Connection manager not initialized');
    }

    this.pendingRequests++;
    
    try {
      // Try to get an idle connection first
      const idleClientId = this.idleConnections.values().next().value;
      if (idleClientId) {
        const client = this.clients.get(idleClientId);
        if (client && await client.healthCheck()) {
          this.idleConnections.delete(idleClientId);
          this.activeConnections.add(idleClientId);
          this.pendingRequests--;
          return client;
        } else {
          // Remove unhealthy connection
          this.removeConnection(idleClientId);
        }
      }

      // Create new connection if under max limit
      if (this.clients.size < this.config.maxConnections) {
        const client = await this.createConnection();
        const clientId = this.generateClientId();
        this.clients.set(clientId, client);
        this.activeConnections.add(clientId);
        this.pendingRequests--;
        return client;
      }

      // Wait for connection to become available
      return await this.waitForConnection();
    } catch (error) {
      this.pendingRequests--;
      this.errorCount++;
      logger.error('Failed to get connection:', error);
      throw error;
    }
  }

  async releaseConnection(client: DatabaseClient): Promise<void> {
    const clientId = this.findClientId(client);
    if (!clientId) {
      logger.warn('Attempting to release unknown connection');
      return;
    }

    try {
      // Check if connection is still healthy
      if (await client.healthCheck()) {
        this.activeConnections.delete(clientId);
        this.idleConnections.add(clientId);
        logger.debug(`Connection ${clientId} released to idle pool`);
      } else {
        // Remove unhealthy connection
        this.removeConnection(clientId);
        logger.warn(`Removed unhealthy connection ${clientId}`);
      }
    } catch (error) {
      logger.error('Error releasing connection:', error);
      this.removeConnection(clientId);
    }
  }

  async closeAllConnections(): Promise<void> {
    logger.info('Closing all database connections...');
    
    // Stop intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Close all connections
    const closePromises = Array.from(this.clients.values()).map(async (client) => {
      try {
        await client.disconnect();
      } catch (error) {
        logger.error('Error closing connection:', error);
      }
    });

    await Promise.all(closePromises);
    
    this.clients.clear();
    this.activeConnections.clear();
    this.idleConnections.clear();
    this.isInitialized = false;
    
    logger.info('All database connections closed');
  }

  getConnectionStats(): ConnectionStats {
    return {
      totalConnections: this.clients.size,
      activeConnections: this.activeConnections.size,
      idleConnections: this.idleConnections.size,
      pendingRequests: this.pendingRequests,
      errorCount: this.errorCount,
      lastHealthCheck: this.lastHealthCheck,
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      const stats = this.getConnectionStats();
      
      // Check if we have minimum connections
      if (stats.totalConnections < this.config.minConnections) {
        return false;
      }

      // Test a random connection
      const clientIds = Array.from(this.clients.keys());
      if (clientIds.length > 0) {
        const randomClientId = clientIds[Math.floor(Math.random() * clientIds.length)];
        const client = this.clients.get(randomClientId);
        if (client) {
          const healthy = await client.healthCheck();
          this.lastHealthCheck = new Date();
          return healthy;
        }
      }

      return false;
    } catch (error) {
      logger.error('Health check failed:', error);
      return false;
    }
  }

  private async createConnection(): Promise<DatabaseClient> {
    const client = createDatabaseClient(this.dbConfig);
    await client.connect();
    return client;
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private findClientId(client: DatabaseClient): string | null {
    for (const [clientId, storedClient] of this.clients.entries()) {
      if (storedClient === client) {
        return clientId;
      }
    }
    return null;
  }

  private removeConnection(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.disconnect().catch(error => {
        logger.error('Error disconnecting removed client:', error);
      });
    }
    
    this.clients.delete(clientId);
    this.activeConnections.delete(clientId);
    this.idleConnections.delete(clientId);
  }

  private async waitForConnection(): Promise<DatabaseClient> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection acquire timeout'));
      }, this.config.acquireTimeoutMillis);

      const checkForConnection = async () => {
        try {
          const idleClientId = this.idleConnections.values().next().value;
          if (idleClientId) {
            clearTimeout(timeout);
            const client = this.clients.get(idleClientId);
            if (client && await client.healthCheck()) {
              this.idleConnections.delete(idleClientId);
              this.activeConnections.add(idleClientId);
              resolve(client);
              return;
            } else {
              this.removeConnection(idleClientId);
            }
          }
          
          // Check again after a short delay
          setTimeout(checkForConnection, 100);
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };

      checkForConnection();
    });
  }

  private startHealthCheckInterval(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.isHealthy();
      } catch (error) {
        logger.error('Health check interval error:', error);
      }
    }, 30000); // Check every 30 seconds
  }

  private startConnectionReaper(): void {
    setInterval(async () => {
      try {
        // Remove idle connections that have been idle too long
        const now = Date.now();
        const idleClientIds = Array.from(this.idleConnections);
        
        for (const clientId of idleClientIds) {
          const client = this.clients.get(clientId);
          if (client && !(await client.healthCheck())) {
            this.removeConnection(clientId);
            logger.info(`Reaped unhealthy connection ${clientId}`);
          }
        }

        // Ensure minimum connections
        while (this.clients.size < this.config.minConnections) {
          try {
            const client = await this.createConnection();
            const clientId = this.generateClientId();
            this.clients.set(clientId, client);
            this.idleConnections.add(clientId);
            logger.info(`Created new connection to maintain minimum pool size`);
          } catch (error) {
            logger.error('Failed to create connection for minimum pool:', error);
            break;
          }
        }
      } catch (error) {
        logger.error('Connection reaper error:', error);
      }
    }, this.config.reapIntervalMillis);
  }
}

// Global connection manager instance
let connectionManager: ConnectionManager | null = null;

export const createConnectionManager = (
  dbConfig: DatabaseConfig,
  poolConfig?: Partial<ConnectionPoolConfig>
): ConnectionManager => {
  if (!connectionManager) {
    connectionManager = new PostgresConnectionManager(dbConfig, poolConfig);
  }
  return connectionManager;
};

export const getConnectionManager = (): ConnectionManager => {
  if (!connectionManager) {
    throw new Error('Connection manager not initialized');
  }
  return connectionManager;
};

export default getConnectionManager;
