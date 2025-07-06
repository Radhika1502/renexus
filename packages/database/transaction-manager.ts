import { DatabaseClient, getDatabaseClient } from './client';
import { getConnectionManager } from './connection';
import { logger } from './logger';
import { getDatabaseUtils } from './db-utils';

export interface TransactionContext {
  id: string;
  client: DatabaseClient;
  startTime: Date;
  isActive: boolean;
  savepoints: string[];
}

export interface TransactionOptions {
  isolationLevel?: 'READ UNCOMMITTED' | 'READ COMMITTED' | 'REPEATABLE READ' | 'SERIALIZABLE';
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface TransactionManager {
  beginTransaction(options?: TransactionOptions): Promise<TransactionContext>;
  commitTransaction(context: TransactionContext): Promise<void>;
  rollbackTransaction(context: TransactionContext): Promise<void>;
  createSavepoint(context: TransactionContext, name: string): Promise<void>;
  rollbackToSavepoint(context: TransactionContext, name: string): Promise<void>;
  releaseSavepoint(context: TransactionContext, name: string): Promise<void>;
  executeInTransaction<T>(
    callback: (context: TransactionContext) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T>;
  getActiveTransactions(): TransactionContext[];
  isTransactionActive(transactionId: string): boolean;
}

class PostgresTransactionManager implements TransactionManager {
  private activeTransactions: Map<string, TransactionContext> = new Map();
  private transactionTimeout: number = 30000; // 30 seconds default
  private utils = getDatabaseUtils();

  async beginTransaction(options?: TransactionOptions): Promise<TransactionContext> {
    const connectionManager = getConnectionManager();
    const client = await connectionManager.getConnection();
    
    const transactionId = this.generateTransactionId();
    const context: TransactionContext = {
      id: transactionId,
      client,
      startTime: new Date(),
      isActive: true,
      savepoints: [],
    };

    try {
      const profile = this.utils.profiler.startProfile('BEGIN TRANSACTION');

      // Set isolation level if specified
      if (options?.isolationLevel) {
        await client.sql`SET TRANSACTION ISOLATION LEVEL ${client.sql(options.isolationLevel)}`;
      }

      // Begin transaction
      await client.sql`BEGIN`;
      
      this.activeTransactions.set(transactionId, context);
      
      // Set timeout if specified
      if (options?.timeout) {
        setTimeout(() => {
          if (this.activeTransactions.has(transactionId)) {
            logger.warn(`Transaction ${transactionId} timed out, rolling back`);
            this.rollbackTransaction(context).catch(error => {
              logger.error('Error rolling back timed out transaction:', error);
            });
          }
        }, options.timeout);
      }

      this.utils.profiler.endProfile(profile);
      logger.debug(`Transaction ${transactionId} started`);
      return context;
    } catch (error) {
      // Release connection if transaction start failed
      await connectionManager.releaseConnection(client);
      logger.error('Failed to begin transaction:', error);
      throw error;
    }
  }

  async commitTransaction(context: TransactionContext): Promise<void> {
    if (!context.isActive) {
      throw new Error('Transaction is not active');
    }

    if (!this.activeTransactions.has(context.id)) {
      throw new Error('Transaction not found');
    }

    try {
      const profile = this.utils.profiler.startProfile('COMMIT TRANSACTION');
      await context.client.sql`COMMIT`;
      this.utils.profiler.endProfile(profile);

      context.isActive = false;
      this.activeTransactions.delete(context.id);
      
      // Release connection back to pool
      const connectionManager = getConnectionManager();
      await connectionManager.releaseConnection(context.client);
      
      logger.debug(`Transaction ${context.id} committed`);
    } catch (error) {
      logger.error(`Failed to commit transaction ${context.id}:`, error);
      // Try to rollback on commit failure
      await this.rollbackTransaction(context);
      throw error;
    }
  }

  async rollbackTransaction(context: TransactionContext): Promise<void> {
    if (!this.activeTransactions.has(context.id)) {
      logger.warn(`Transaction ${context.id} not found for rollback`);
      return;
    }

    try {
      if (context.isActive) {
        const profile = this.utils.profiler.startProfile('ROLLBACK TRANSACTION');
        await context.client.sql`ROLLBACK`;
        this.utils.profiler.endProfile(profile);
      }
      
      context.isActive = false;
      this.activeTransactions.delete(context.id);
      
      // Release connection back to pool
      const connectionManager = getConnectionManager();
      await connectionManager.releaseConnection(context.client);
      
      logger.debug(`Transaction ${context.id} rolled back`);
    } catch (error) {
      logger.error(`Failed to rollback transaction ${context.id}:`, error);
      // Force cleanup even if rollback fails
      context.isActive = false;
      this.activeTransactions.delete(context.id);
      
      const connectionManager = getConnectionManager();
      await connectionManager.releaseConnection(context.client);
      throw error;
    }
  }

  async createSavepoint(context: TransactionContext, name: string): Promise<void> {
    if (!context.isActive) {
      throw new Error('Transaction is not active');
    }

    try {
      const profile = this.utils.profiler.startProfile(`SAVEPOINT ${name}`);
      await context.client.sql`SAVEPOINT ${context.client.sql(name)}`;
      this.utils.profiler.endProfile(profile);

      context.savepoints.push(name);
      logger.debug(`Savepoint ${name} created in transaction ${context.id}`);
    } catch (error) {
      logger.error(`Failed to create savepoint ${name}:`, error);
      throw error;
    }
  }

  async rollbackToSavepoint(context: TransactionContext, name: string): Promise<void> {
    if (!context.isActive) {
      throw new Error('Transaction is not active');
    }

    if (!context.savepoints.includes(name)) {
      throw new Error(`Savepoint ${name} not found`);
    }

    try {
      const profile = this.utils.profiler.startProfile(`ROLLBACK TO SAVEPOINT ${name}`);
      await context.client.sql`ROLLBACK TO SAVEPOINT ${context.client.sql(name)}`;
      this.utils.profiler.endProfile(profile);
      
      // Remove savepoints created after this one
      const savepointIndex = context.savepoints.indexOf(name);
      context.savepoints = context.savepoints.slice(0, savepointIndex + 1);
      
      logger.debug(`Rolled back to savepoint ${name} in transaction ${context.id}`);
    } catch (error) {
      logger.error(`Failed to rollback to savepoint ${name}:`, error);
      throw error;
    }
  }

  async releaseSavepoint(context: TransactionContext, name: string): Promise<void> {
    if (!context.isActive) {
      throw new Error('Transaction is not active');
    }

    if (!context.savepoints.includes(name)) {
      throw new Error(`Savepoint ${name} not found`);
    }

    try {
      const profile = this.utils.profiler.startProfile(`RELEASE SAVEPOINT ${name}`);
      await context.client.sql`RELEASE SAVEPOINT ${context.client.sql(name)}`;
      this.utils.profiler.endProfile(profile);
      
      // Remove the savepoint and any created after it
      const savepointIndex = context.savepoints.indexOf(name);
      context.savepoints = context.savepoints.slice(0, savepointIndex);
      
      logger.debug(`Released savepoint ${name} in transaction ${context.id}`);
    } catch (error) {
      logger.error(`Failed to release savepoint ${name}:`, error);
      throw error;
    }
  }

  async executeInTransaction<T>(
    callback: (context: TransactionContext) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const context = await this.beginTransaction(options);
    try {
      const result = await callback(context);
      await this.commitTransaction(context);
      return result;
    } catch (error) {
      await this.rollbackTransaction(context);
      throw error;
    }
  }

  getActiveTransactions(): TransactionContext[] {
    return Array.from(this.activeTransactions.values());
  }

  isTransactionActive(transactionId: string): boolean {
    return this.activeTransactions.has(transactionId);
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      '40001', // serialization_failure
      '40P01', // deadlock_detected
      '55P03', // lock_not_available
    ];
    return retryableCodes.includes(error.code);
  }
}

let globalManager: TransactionManager | undefined;

export const createTransactionManager = (): TransactionManager => {
  if (!globalManager) {
    globalManager = new PostgresTransactionManager();
  }
  return globalManager;
};

export const getTransactionManager = (): TransactionManager => {
  if (!globalManager) {
    globalManager = createTransactionManager();
  }
  return globalManager;
};

export const withTransaction = async <T>(
  callback: (context: TransactionContext) => Promise<T>,
  options?: TransactionOptions
): Promise<T> => {
  const manager = getTransactionManager();
  return manager.executeInTransaction(callback, options);
};

export const beginTransaction = async (options?: TransactionOptions): Promise<TransactionContext> => {
  const manager = getTransactionManager();
  return manager.beginTransaction(options);
};

export const commitTransaction = async (context: TransactionContext): Promise<void> => {
  const manager = getTransactionManager();
  return manager.commitTransaction(context);
};

export const rollbackTransaction = async (context: TransactionContext): Promise<void> => {
  const manager = getTransactionManager();
  return manager.rollbackTransaction(context);
};

export default getTransactionManager;
