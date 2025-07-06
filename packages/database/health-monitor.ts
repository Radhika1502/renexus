import { getDatabaseClient } from './client';
import { logger } from './logger';
import { EventEmitter } from 'events';

export interface HealthStatus {
  isHealthy: boolean;
  connectionPool: {
    total: number;
    active: number;
    idle: number;
    waiting: number;
  };
  latency: {
    last: number;
    avg1m: number;
    avg5m: number;
    avg15m: number;
  };
  errors: {
    count: number;
    lastError?: Error;
    lastErrorTime?: Date;
  };
  uptime: number;
  lastChecked: Date;
}

export interface HealthCheckConfig {
  checkInterval?: number; // milliseconds
  timeout?: number; // milliseconds
  thresholds?: {
    maxLatency?: number; // milliseconds
    maxErrorRate?: number; // errors per minute
    maxPoolUtilization?: number; // percentage (0-1)
  };
}

export interface HealthMonitor {
  start(): void;
  stop(): void;
  getStatus(): HealthStatus;
  onStatusChange(listener: (status: HealthStatus) => void): void;
  checkHealth(): Promise<HealthStatus>;
}

class PostgresHealthMonitor extends EventEmitter implements HealthMonitor {
  private client = getDatabaseClient();
  private config: Required<HealthCheckConfig>;
  private status: HealthStatus;
  private checkInterval?: NodeJS.Timeout;
  private latencyHistory: number[] = [];
  private startTime: number;

  constructor(config?: HealthCheckConfig) {
    super();
    this.config = {
      checkInterval: config?.checkInterval || 30000, // 30 seconds
      timeout: config?.timeout || 5000, // 5 seconds
      thresholds: {
        maxLatency: config?.thresholds?.maxLatency || 1000, // 1 second
        maxErrorRate: config?.thresholds?.maxErrorRate || 5, // 5 errors/minute
        maxPoolUtilization: config?.thresholds?.maxPoolUtilization || 0.8, // 80%
      },
    };

    this.startTime = Date.now();
    this.status = this.getInitialStatus();
  }

  private getInitialStatus(): HealthStatus {
    return {
      isHealthy: true,
      connectionPool: {
        total: 0,
        active: 0,
        idle: 0,
        waiting: 0,
      },
      latency: {
        last: 0,
        avg1m: 0,
        avg5m: 0,
        avg15m: 0,
      },
      errors: {
        count: 0,
      },
      uptime: 0,
      lastChecked: new Date(),
    };
  }

  start(): void {
    if (this.checkInterval) {
      return;
    }

    logger.info('Starting database health monitoring');
    this.checkInterval = setInterval(() => {
      this.checkHealth().catch(error => {
        logger.error('Health check failed:', error);
      });
    }, this.config.checkInterval);

    // Run initial check
    this.checkHealth().catch(error => {
      logger.error('Initial health check failed:', error);
    });
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
      logger.info('Database health monitoring stopped');
    }
  }

  getStatus(): HealthStatus {
    return { ...this.status };
  }

  onStatusChange(listener: (status: HealthStatus) => void): void {
    this.on('statusChange', listener);
  }

  async checkHealth(): Promise<HealthStatus> {
    const startCheck = Date.now();
    let isHealthy = true;
    let latency = 0;

    try {
      // Check basic connectivity
      await Promise.race([
        this.client.sql`SELECT 1`,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), this.config.timeout)
        ),
      ]);

      latency = Date.now() - startCheck;
      this.latencyHistory.push(latency);

      // Keep last hour of latency history
      const maxHistory = Math.ceil(3600000 / this.config.checkInterval);
      if (this.latencyHistory.length > maxHistory) {
        this.latencyHistory.shift();
      }

      // Get pool statistics
      const poolStats = await this.getPoolStats();

      // Update status
      const prevStatus = this.status;
      this.status = {
        isHealthy,
        connectionPool: poolStats,
        latency: {
          last: latency,
          avg1m: this.calculateAverageLatency(1),
          avg5m: this.calculateAverageLatency(5),
          avg15m: this.calculateAverageLatency(15),
        },
        errors: {
          ...prevStatus.errors,
        },
        uptime: Math.floor((Date.now() - this.startTime) / 1000),
        lastChecked: new Date(),
      };

      // Check thresholds
      const maxLatency = this.config.thresholds?.maxLatency ?? 1000;
      if (latency > maxLatency) {
        isHealthy = false;
        logger.warn(`High database latency detected: ${latency}ms`);
      }

      const maxPoolUtilization = this.config.thresholds?.maxPoolUtilization ?? 0.8;
      const poolUtilization = poolStats.active / poolStats.total;
      if (poolUtilization > maxPoolUtilization) {
        isHealthy = false;
        logger.warn(`High pool utilization: ${Math.round(poolUtilization * 100)}%`);
      }

      this.status.isHealthy = isHealthy;

    } catch (error) {
      isHealthy = false;
      this.status.isHealthy = false;
      this.status.errors.count++;
      this.status.errors.lastError = error as Error;
      this.status.errors.lastErrorTime = new Date();

      logger.error('Database health check failed:', error);
    }

    // Emit status change event
    this.emit('statusChange', this.getStatus());
    return this.getStatus();
  }

  private async getPoolStats() {
    const query = this.client.sql`
      SELECT count(*) as total,
             count(*) FILTER (WHERE state = 'active') as active,
             count(*) FILTER (WHERE state = 'idle') as idle,
             count(*) FILTER (WHERE state = 'waiting') as waiting
      FROM pg_stat_activity 
      WHERE application_name = ${'renexus'}
    `;

    const stats = await query;
    return {
      total: Number(stats[0]?.total) || 0,
      active: Number(stats[0]?.active) || 0,
      idle: Number(stats[0]?.idle) || 0,
      waiting: Number(stats[0]?.waiting) || 0,
    };
  }

  private calculateAverageLatency(minutes: number): number {
    const samples = Math.ceil((minutes * 60000) / this.config.checkInterval);
    const relevantHistory = this.latencyHistory.slice(-samples);
    
    if (relevantHistory.length === 0) return 0;
    
    return Math.round(
      relevantHistory.reduce((sum, val) => sum + val, 0) / relevantHistory.length
    );
  }
}

export const createHealthMonitor = (config?: HealthCheckConfig): HealthMonitor => {
  return new PostgresHealthMonitor(config);
};

let globalMonitor: HealthMonitor | undefined;

export const getHealthMonitor = (): HealthMonitor => {
  if (!globalMonitor) {
    globalMonitor = createHealthMonitor();
  }
  return globalMonitor;
}; 