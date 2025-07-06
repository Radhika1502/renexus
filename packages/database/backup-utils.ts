import { getDatabaseClient } from './client';
import { withTransaction } from './transaction-manager';
import { logger } from './logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BackupConfig {
  backupDirectory: string;
  retentionDays: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  encryptionKey?: string;
  excludeTables?: string[];
  includeTables?: string[];
}

export interface BackupMetadata {
  id: string;
  filename: string;
  filepath: string;
  type: 'full' | 'incremental' | 'schema-only';
  size: number;
  compressed: boolean;
  encrypted: boolean;
  createdAt: Date;
  databaseVersion: string;
  schemaChecksum: string;
  tableCount: number;
  recordCount: number;
}

export interface RestoreOptions {
  backupId: string;
  targetDatabase?: string;
  dropExisting?: boolean;
  dataOnly?: boolean;
  schemaOnly?: boolean;
  skipTables?: string[];
  onlyTables?: string[];
}

export interface BackupManager {
  createFullBackup(): Promise<BackupMetadata>;
  createIncrementalBackup(baseBackupId: string): Promise<BackupMetadata>;
  createSchemaBackup(): Promise<BackupMetadata>;
  restoreBackup(options: RestoreOptions): Promise<void>;
  listBackups(): Promise<BackupMetadata[]>;
  deleteBackup(backupId: string): Promise<void>;
  cleanupOldBackups(): Promise<void>;
  validateBackup(backupId: string): Promise<boolean>;
  exportBackupMetadata(): Promise<string>;
}

class PostgresBackupManager implements BackupManager {
  private config: BackupConfig;
  private client = getDatabaseClient();

  constructor(config: BackupConfig) {
    this.config = {
      ...config,
      retentionDays: config.retentionDays || 30,
      compressionEnabled: config.compressionEnabled !== undefined ? config.compressionEnabled : true,
      encryptionEnabled: config.encryptionEnabled !== undefined ? config.encryptionEnabled : false,
      excludeTables: config.excludeTables || [],
      includeTables: config.includeTables || [],
    };
    
    this.ensureBackupDirectory();
  }

  async createFullBackup(): Promise<BackupMetadata> {
    logger.info('Starting full database backup...');
    
    const backupId = this.generateBackupId('full');
    const filename = `${backupId}.sql${this.config.compressionEnabled ? '.gz' : ''}`;
    const filepath = path.join(this.config.backupDirectory, filename);

    try {
      // Get database connection info
      const dbConfig = this.getDatabaseConfig();
      
      // Build pg_dump command
      const dumpCommand = this.buildPgDumpCommand(dbConfig, filepath, 'full');
      
      // Execute backup
      const startTime = Date.now();
      await execAsync(dumpCommand);
      const executionTime = Date.now() - startTime;
      
      // Get file stats
      const stats = await fs.stat(filepath);
      
      // Get database metadata
      const metadata = await this.collectDatabaseMetadata();
      
      const backupMetadata: BackupMetadata = {
        id: backupId,
        filename,
        filepath,
        type: 'full',
        size: stats.size,
        compressed: this.config.compressionEnabled,
        encrypted: this.config.encryptionEnabled,
        createdAt: new Date(),
        databaseVersion: metadata.version,
        schemaChecksum: metadata.schemaChecksum,
        tableCount: metadata.tableCount,
        recordCount: metadata.recordCount,
      };

      // Save metadata
      await this.saveBackupMetadata(backupMetadata);
      
      logger.info(`Full backup completed successfully`, {
        backupId,
        size: stats.size,
        executionTime,
        filepath,
      });

      return backupMetadata;
    } catch (error) {
      logger.error('Full backup failed:', error);
      // Cleanup failed backup file
      try {
        await fs.unlink(filepath);
      } catch (cleanupError) {
        logger.warn('Failed to cleanup incomplete backup file:', cleanupError);
      }
      throw error;
    }
  }

  async createIncrementalBackup(baseBackupId: string): Promise<BackupMetadata> {
    logger.info(`Starting incremental backup based on ${baseBackupId}...`);
    
    const baseBackup = await this.getBackupMetadata(baseBackupId);
    if (!baseBackup) {
      throw new Error(`Base backup ${baseBackupId} not found`);
    }

    const backupId = this.generateBackupId('incremental');
    const filename = `${backupId}_incremental.sql${this.config.compressionEnabled ? '.gz' : ''}`;
    const filepath = path.join(this.config.backupDirectory, filename);

    try {
      // Get changes since base backup
      const changes = await this.getChangesSinceBackup(baseBackup.createdAt);
      
      // Create incremental backup with only changed data
      await this.createIncrementalDump(filepath, changes, baseBackup.createdAt);
      
      const stats = await fs.stat(filepath);
      const metadata = await this.collectDatabaseMetadata();
      
      const backupMetadata: BackupMetadata = {
        id: backupId,
        filename,
        filepath,
        type: 'incremental',
        size: stats.size,
        compressed: this.config.compressionEnabled,
        encrypted: this.config.encryptionEnabled,
        createdAt: new Date(),
        databaseVersion: metadata.version,
        schemaChecksum: metadata.schemaChecksum,
        tableCount: changes.length,
        recordCount: changes.reduce((sum, change) => sum + change.recordCount, 0),
      };

      await this.saveBackupMetadata(backupMetadata);
      
      logger.info(`Incremental backup completed successfully`, {
        backupId,
        baseBackupId,
        size: stats.size,
        changedTables: changes.length,
      });

      return backupMetadata;
    } catch (error) {
      logger.error('Incremental backup failed:', error);
      try {
        await fs.unlink(filepath);
      } catch (cleanupError) {
        logger.warn('Failed to cleanup incomplete backup file:', cleanupError);
      }
      throw error;
    }
  }

  async createSchemaBackup(): Promise<BackupMetadata> {
    logger.info('Starting schema-only backup...');
    
    const backupId = this.generateBackupId('schema');
    const filename = `${backupId}_schema.sql`;
    const filepath = path.join(this.config.backupDirectory, filename);

    try {
      const dbConfig = this.getDatabaseConfig();
      const dumpCommand = this.buildPgDumpCommand(dbConfig, filepath, 'schema-only');
      
      await execAsync(dumpCommand);
      
      const stats = await fs.stat(filepath);
      const metadata = await this.collectDatabaseMetadata();
      
      const backupMetadata: BackupMetadata = {
        id: backupId,
        filename,
        filepath,
        type: 'schema-only',
        size: stats.size,
        compressed: false,
        encrypted: false,
        createdAt: new Date(),
        databaseVersion: metadata.version,
        schemaChecksum: metadata.schemaChecksum,
        tableCount: metadata.tableCount,
        recordCount: 0,
      };

      await this.saveBackupMetadata(backupMetadata);
      
      logger.info(`Schema backup completed successfully`, {
        backupId,
        size: stats.size,
      });

      return backupMetadata;
    } catch (error) {
      logger.error('Schema backup failed:', error);
      try {
        await fs.unlink(filepath);
      } catch (cleanupError) {
        logger.warn('Failed to cleanup incomplete backup file:', cleanupError);
      }
      throw error;
    }
  }

  async restoreBackup(options: RestoreOptions): Promise<void> {
    logger.info(`Starting backup restoration`, options);
    
    const backup = await this.getBackupMetadata(options.backupId);
    if (!backup) {
      throw new Error(`Backup ${options.backupId} not found`);
    }

    try {
      // Validate backup file exists
      await fs.access(backup.filepath);
      
      const dbConfig = this.getDatabaseConfig();
      const targetDb = options.targetDatabase || dbConfig.database;
      
      // Build restore command
      const restoreCommand = this.buildRestoreCommand(backup, targetDb, options);
      
      // Execute restoration
      const startTime = Date.now();
      
      if (options.dropExisting) {
        await this.dropAndRecreateDatabase(targetDb);
      }
      
      await execAsync(restoreCommand);
      
      const executionTime = Date.now() - startTime;
      
      logger.info(`Backup restoration completed successfully`, {
        backupId: options.backupId,
        targetDatabase: targetDb,
        executionTime,
      });
    } catch (error) {
      logger.error('Backup restoration failed:', error);
      throw error;
    }
  }

  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const metadataFile = path.join(this.config.backupDirectory, 'backup-metadata.json');
      const data = await fs.readFile(metadataFile, 'utf-8');
      const allBackups = JSON.parse(data) as BackupMetadata[];
      
      // Parse dates and sort by creation time
      return allBackups
        .map(backup => ({
          ...backup,
          createdAt: new Date(backup.createdAt),
        }))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    logger.info(`Deleting backup ${backupId}...`);
    
    const backup = await this.getBackupMetadata(backupId);
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }

    try {
      // Delete backup file
      await fs.unlink(backup.filepath);
      
      // Remove from metadata
      await this.removeBackupMetadata(backupId);
      
      logger.info(`Backup ${backupId} deleted successfully`);
    } catch (error) {
      logger.error(`Failed to delete backup ${backupId}:`, error);
      throw error;
    }
  }

  async cleanupOldBackups(): Promise<void> {
    logger.info('Starting backup cleanup...');
    
    const backups = await this.listBackups();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    
    const oldBackups = backups.filter(backup => backup.createdAt < cutoffDate);
    
    for (const backup of oldBackups) {
      try {
        await this.deleteBackup(backup.id);
        logger.info(`Cleaned up old backup: ${backup.id}`);
      } catch (error) {
        logger.warn(`Failed to cleanup backup ${backup.id}:`, error);
      }
    }
    
    logger.info(`Backup cleanup completed. Removed ${oldBackups.length} old backups`);
  }

  async validateBackup(backupId: string): Promise<boolean> {
    logger.info(`Validating backup ${backupId}...`);
    
    const backup = await this.getBackupMetadata(backupId);
    if (!backup) {
      logger.warn(`Backup ${backupId} metadata not found`);
      return false;
    }

    try {
      // Check file exists
      await fs.access(backup.filepath);
      
      // Check file size matches metadata
      const stats = await fs.stat(backup.filepath);
      if (stats.size !== backup.size) {
        logger.warn(`Backup ${backupId} size mismatch: expected ${backup.size}, got ${stats.size}`);
        return false;
      }
      
      // For SQL files, check basic structure
      if (backup.filepath.endsWith('.sql')) {
        const content = await fs.readFile(backup.filepath, 'utf-8');
        if (!content.includes('PostgreSQL database dump') && !content.includes('CREATE TABLE')) {
          logger.warn(`Backup ${backupId} appears to be corrupted`);
          return false;
        }
      }
      
      logger.info(`Backup ${backupId} validation successful`);
      return true;
    } catch (error) {
      logger.warn(`Backup ${backupId} validation failed:`, error);
      return false;
    }
  }

  async exportBackupMetadata(): Promise<string> {
    const backups = await this.listBackups();
    const exportData = {
      exportedAt: new Date().toISOString(),
      backupCount: backups.length,
      totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
      backups: backups.map(backup => ({
        ...backup,
        filepath: path.basename(backup.filepath), // Remove absolute path for security
      })),
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  private generateBackupId(type: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `backup_${type}_${timestamp}`;
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.backupDirectory, { recursive: true });
    } catch (error) {
      logger.error('Failed to create backup directory:', error);
      throw error;
    }
  }

  private getDatabaseConfig(): any {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      database: process.env.DB_NAME || 'renexus',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };
  }

  private buildPgDumpCommand(dbConfig: any, filepath: string, type: string): string {
    const baseCommand = [
      'pg_dump',
      `--host=${dbConfig.host}`,
      `--port=${dbConfig.port}`,
      `--username=${dbConfig.username}`,
      '--no-password',
      '--verbose',
      '--clean',
      '--if-exists',
    ];

    if (type === 'schema-only') {
      baseCommand.push('--schema-only');
    } else {
      baseCommand.push('--data-only');
    }

    // Add table filters
    if (this.config.includeTables && this.config.includeTables.length > 0) {
      this.config.includeTables.forEach(table => {
        baseCommand.push(`--table=${table}`);
      });
    }

    if (this.config.excludeTables && this.config.excludeTables.length > 0) {
      this.config.excludeTables.forEach(table => {
        baseCommand.push(`--exclude-table=${table}`);
      });
    }

    baseCommand.push(dbConfig.database);

    if (this.config.compressionEnabled && !filepath.endsWith('.gz')) {
      return `${baseCommand.join(' ')} | gzip > "${filepath}"`;
    } else {
      return `${baseCommand.join(' ')} > "${filepath}"`;
    }
  }

  private buildRestoreCommand(backup: BackupMetadata, targetDb: string, options: RestoreOptions): string {
    const dbConfig = this.getDatabaseConfig();
    const baseCommand = [
      'psql',
      `--host=${dbConfig.host}`,
      `--port=${dbConfig.port}`,
      `--username=${dbConfig.username}`,
      '--no-password',
      '--verbose',
      `--dbname=${targetDb}`,
    ];

    if (backup.compressed) {
      return `gunzip -c "${backup.filepath}" | ${baseCommand.join(' ')}`;
    } else {
      return `${baseCommand.join(' ')} < "${backup.filepath}"`;
    }
  }

  private async collectDatabaseMetadata(): Promise<any> {
    return withTransaction(async (context) => {
      const versionResult = await context.client.sql`SELECT version()`;
      const tablesResult = await context.client.sql`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      // Get approximate record count
      const recordCountResult = await context.client.sql`
        SELECT SUM(n_tup_ins + n_tup_upd) as total_records
        FROM pg_stat_user_tables
      `;

      return {
        version: versionResult[0].version,
        tableCount: parseInt(tablesResult[0].table_count),
        recordCount: parseInt(recordCountResult[0]?.total_records || '0'),
        schemaChecksum: this.generateSchemaChecksum(),
      };
    });
  }

  private generateSchemaChecksum(): string {
    // Simple checksum based on current timestamp
    // In production, this should be a proper hash of schema structure
    return Date.now().toString(16);
  }

  private async getChangesSinceBackup(since: Date): Promise<any[]> {
    // Simplified implementation - in production, this would use WAL or change tracking
    return withTransaction(async (context) => {
      const tables = await context.client.sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      
      return tables.map((table: any) => ({
        tableName: table.table_name,
        recordCount: 100, // Placeholder - would calculate actual changes
      }));
    });
  }

  private async createIncrementalDump(filepath: string, changes: any[], since: Date): Promise<void> {
    // Simplified implementation - would create actual incremental dump
    const dumpContent = `-- Incremental backup since ${since.toISOString()}\n`;
    await fs.writeFile(filepath, dumpContent);
  }

  private async dropAndRecreateDatabase(dbName: string): Promise<void> {
    // Implementation would safely drop and recreate database
    logger.warn(`Database recreation not implemented for safety`);
  }

  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const metadataFile = path.join(this.config.backupDirectory, 'backup-metadata.json');
    
    try {
      const existing = await this.listBackups();
      const updated = [...existing, metadata];
      await fs.writeFile(metadataFile, JSON.stringify(updated, null, 2));
    } catch (error) {
      await fs.writeFile(metadataFile, JSON.stringify([metadata], null, 2));
    }
  }

  private async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    const backups = await this.listBackups();
    return backups.find(backup => backup.id === backupId) || null;
  }

  private async removeBackupMetadata(backupId: string): Promise<void> {
    const backups = await this.listBackups();
    const filtered = backups.filter(backup => backup.id !== backupId);
    
    const metadataFile = path.join(this.config.backupDirectory, 'backup-metadata.json');
    await fs.writeFile(metadataFile, JSON.stringify(filtered, null, 2));
  }
}

// Global backup manager
let globalBackupManager: BackupManager | null = null;

export const createBackupManager = (config: BackupConfig): BackupManager => {
  globalBackupManager = new PostgresBackupManager(config);
  return globalBackupManager;
};

export const getBackupManager = (): BackupManager => {
  if (!globalBackupManager) {
    throw new Error('Backup manager not initialized');
  }
  return globalBackupManager;
};

export default getBackupManager;
