import { DatabaseProfiler, createProfiler } from './profiler';
import { BackupManager, createBackupManager, BackupConfig } from './backup-utils';
import { DatabaseTestUtils, createTestUtils, TestDatabaseConfig } from './test-utils';
import { HealthMonitor, createHealthMonitor, HealthCheckConfig } from './health-monitor';
import { logger } from './logger';

export interface DatabaseUtilsConfig {
  backup?: BackupConfig;
  health?: HealthCheckConfig;
  test?: TestDatabaseConfig;
  profiler?: {
    slowQueryThreshold?: number;
    maxProfileHistory?: number;
    enabled?: boolean;
  };
}

export interface DatabaseUtils {
  profiler: DatabaseProfiler;
  backup: BackupManager;
  test: DatabaseTestUtils;
  health: HealthMonitor;
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  getStatus(): {
    profiler: {
      totalQueries: number;
      slowQueries: number;
      errorQueries: number;
    };
    backup: {
      lastBackupTime?: Date;
      totalBackups: number;
      backupSize: number;
    };
    health: {
      isHealthy: boolean;
      latency: number;
      errors: number;
    };
  };
}

class PostgresDatabaseUtils implements DatabaseUtils {
  public profiler: DatabaseProfiler;
  public backup: BackupManager;
  public test: DatabaseTestUtils;
  public health: HealthMonitor;

  constructor(config: DatabaseUtilsConfig) {
    this.profiler = createProfiler(config.profiler);
    this.backup = createBackupManager(config.backup || {
      backupDirectory: './backups',
      retentionDays: 30,
      compressionEnabled: true,
      encryptionEnabled: false,
    });
    this.test = createTestUtils(config.test || {
      baseConfig: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'renexus',
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
      },
      isolationLevel: 'transaction',
      cleanupStrategy: 'rollback',
      seedData: true,
    });
    this.health = createHealthMonitor(config.health);
  }

  async initialize(): Promise<void> {
    logger.info('Initializing database utilities...');

    try {
      // Start health monitoring
      this.health.start();

      // Schedule daily backup
      this.scheduleDailyBackup();

      logger.info('Database utilities initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database utilities:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down database utilities...');

    try {
      // Stop health monitoring
      this.health.stop();

      // Export profiler stats before shutdown
      const profilerStats = this.profiler.exportStats();
      await this.backup.createFullBackup();

      logger.info('Database utilities shut down successfully');
    } catch (error) {
      logger.error('Error during database utilities shutdown:', error);
      throw error;
    }
  }

  getStatus(): {
    profiler: { totalQueries: number; slowQueries: number; errorQueries: number };
    backup: { lastBackupTime?: Date; totalBackups: number; backupSize: number };
    health: { isHealthy: boolean; latency: number; errors: number };
  } {
    const profilerStats = this.profiler.getStats();
    const healthStatus = this.health.getStatus();

    return {
      profiler: {
        totalQueries: profilerStats.totalQueries,
        slowQueries: profilerStats.slowQueries.length,
        errorQueries: profilerStats.errorQueries.length,
      },
      backup: {
        lastBackupTime: undefined, // Will be populated when backup is created
        totalBackups: 0, // Will be populated from backup metadata
        backupSize: 0, // Will be populated from backup metadata
      },
      health: {
        isHealthy: healthStatus.isHealthy,
        latency: healthStatus.latency.last,
        errors: healthStatus.errors.count,
      },
    };
  }

  private scheduleDailyBackup(): void {
    const now = new Date();
    const nextBackup = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      2, // 2 AM
      0,
      0
    );
    const timeUntilBackup = nextBackup.getTime() - now.getTime();

    setTimeout(async () => {
      try {
        await this.backup.createFullBackup();
        this.scheduleDailyBackup(); // Schedule next backup
      } catch (error) {
        logger.error('Scheduled backup failed:', error);
        this.scheduleDailyBackup(); // Retry tomorrow
      }
    }, timeUntilBackup);

    logger.info(`Next backup scheduled for ${nextBackup.toISOString()}`);
  }
}

let globalUtils: DatabaseUtils | undefined;

export const createDatabaseUtils = (config: DatabaseUtilsConfig): DatabaseUtils => {
  if (!globalUtils) {
    globalUtils = new PostgresDatabaseUtils(config);
  }
  return globalUtils;
};

export const getDatabaseUtils = (): DatabaseUtils => {
  if (!globalUtils) {
    globalUtils = createDatabaseUtils({});
  }
  return globalUtils;
}; 