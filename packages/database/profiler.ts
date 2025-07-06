import { logger } from './logger';

export interface QueryProfile {
  id: string;
  query: string;
  params?: any[];
  startTime: Date;
  endTime?: Date;
  executionTime?: number;
  rowsAffected?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  error?: Error;
  stackTrace?: string;
}

export interface ProfilerStats {
  totalQueries: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  slowQueries: QueryProfile[];
  errorQueries: QueryProfile[];
  memoryUsage: NodeJS.MemoryUsage;
}

export interface DatabaseProfiler {
  startProfile(query: string, params?: any[]): QueryProfile;
  endProfile(profile: QueryProfile, result?: any, error?: Error): void;
  getStats(): ProfilerStats;
  getSlowQueries(threshold?: number): QueryProfile[];
  clearStats(): void;
  exportStats(): string;
}

class PostgresProfiler implements DatabaseProfiler {
  private profiles: Map<string, QueryProfile> = new Map();
  private completedProfiles: QueryProfile[] = [];
  private slowQueryThreshold: number = 100; // 100ms default
  private maxProfileHistory: number = 1000;
  private isEnabled: boolean = true;

  constructor(options?: {
    slowQueryThreshold?: number;
    maxProfileHistory?: number;
    enabled?: boolean;
  }) {
    this.slowQueryThreshold = options?.slowQueryThreshold || 100;
    this.maxProfileHistory = options?.maxProfileHistory || 1000;
    this.isEnabled = options?.enabled !== false;
  }

  startProfile(query: string, params?: any[]): QueryProfile {
    if (!this.isEnabled) {
      return this.createDummyProfile();
    }

    const profile: QueryProfile = {
      id: this.generateProfileId(),
      query: this.sanitizeQuery(query),
      params: this.sanitizeParams(params),
      startTime: new Date(),
      memoryUsage: process.memoryUsage(),
      stackTrace: this.captureStackTrace(),
    };

    this.profiles.set(profile.id, profile);
    
    logger.debug(`Query profile started: ${profile.id}`, {
      query: profile.query,
      params: profile.params,
    });

    return profile;
  }

  endProfile(profile: QueryProfile, result?: any, error?: Error): void {
    if (!this.isEnabled || !profile.id) {
      return;
    }

    const storedProfile = this.profiles.get(profile.id);
    if (!storedProfile) {
      logger.warn(`Profile not found: ${profile.id}`);
      return;
    }

    // Update profile with end data
    storedProfile.endTime = new Date();
    storedProfile.executionTime = storedProfile.endTime.getTime() - storedProfile.startTime.getTime();
    storedProfile.error = error;

    // Extract rows affected from result
    if (result && typeof result === 'object') {
      if (Array.isArray(result)) {
        storedProfile.rowsAffected = result.length;
      } else if (result.rowCount !== undefined) {
        storedProfile.rowsAffected = result.rowCount;
      }
    }

    // Move to completed profiles
    this.profiles.delete(profile.id);
    this.completedProfiles.push(storedProfile);

    // Maintain history limit
    if (this.completedProfiles.length > this.maxProfileHistory) {
      this.completedProfiles.shift();
    }

    // Log slow queries
    if (storedProfile.executionTime >= this.slowQueryThreshold) {
      logger.warn(`Slow query detected: ${storedProfile.executionTime}ms`, {
        id: storedProfile.id,
        query: storedProfile.query,
        params: storedProfile.params,
        executionTime: storedProfile.executionTime,
      });
    }

    // Log errors
    if (error) {
      logger.error(`Query error: ${profile.id}`, {
        query: storedProfile.query,
        params: storedProfile.params,
        error: error.message,
        executionTime: storedProfile.executionTime,
      });
    }

    logger.debug(`Query profile completed: ${profile.id}`, {
      executionTime: storedProfile.executionTime,
      rowsAffected: storedProfile.rowsAffected,
      error: error?.message,
    });
  }

  getStats(): ProfilerStats {
    const totalQueries = this.completedProfiles.length;
    const totalExecutionTime = this.completedProfiles.reduce(
      (sum, profile) => sum + (profile.executionTime || 0),
      0
    );
    const averageExecutionTime = totalQueries > 0 ? totalExecutionTime / totalQueries : 0;

    const slowQueries = this.completedProfiles.filter(
      profile => (profile.executionTime || 0) >= this.slowQueryThreshold
    );

    const errorQueries = this.completedProfiles.filter(
      profile => profile.error !== undefined
    );

    return {
      totalQueries,
      totalExecutionTime,
      averageExecutionTime,
      slowQueries,
      errorQueries,
      memoryUsage: process.memoryUsage(),
    };
  }

  getSlowQueries(threshold?: number): QueryProfile[] {
    const queryThreshold = threshold || this.slowQueryThreshold;
    return this.completedProfiles
      .filter(profile => (profile.executionTime || 0) >= queryThreshold)
      .sort((a, b) => (b.executionTime || 0) - (a.executionTime || 0));
  }

  clearStats(): void {
    this.completedProfiles = [];
    this.profiles.clear();
    logger.info('Profiler stats cleared');
  }

  exportStats(): string {
    const stats = this.getStats();
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalQueries: stats.totalQueries,
        totalExecutionTime: stats.totalExecutionTime,
        averageExecutionTime: stats.averageExecutionTime,
        slowQueriesCount: stats.slowQueries.length,
        errorQueriesCount: stats.errorQueries.length,
      },
      memoryUsage: stats.memoryUsage,
      slowQueries: stats.slowQueries.map(this.serializeProfile),
      errorQueries: stats.errorQueries.map(this.serializeProfile),
      recentQueries: this.completedProfiles
        .slice(-50)
        .map(this.serializeProfile),
    };

    return JSON.stringify(exportData, null, 2);
  }

  private createDummyProfile(): QueryProfile {
    return {
      id: '',
      query: '',
      startTime: new Date(),
    };
  }

  private generateProfileId(): string {
    return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeQuery(query: string): string {
    // Remove extra whitespace and limit length for logging
    return query.replace(/\s+/g, ' ').trim().substring(0, 500);
  }

  private sanitizeParams(params?: any[]): any[] | undefined {
    if (!params) return undefined;
    
    // Sanitize sensitive data in parameters
    return params.map(param => {
      if (typeof param === 'string' && param.length > 100) {
        return `${param.substring(0, 100)}...`;
      }
      return param;
    });
  }

  private captureStackTrace(): string {
    const stack = new Error().stack;
    if (!stack) return '';
    
    // Remove profiler internal calls from stack trace
    const lines = stack.split('\n');
    const relevantLines = lines.filter(line => 
      !line.includes('profiler.ts') && 
      !line.includes('at Object.')
    );
    
    return relevantLines.slice(0, 5).join('\n');
  }

  private serializeProfile(profile: QueryProfile): any {
    return {
      id: profile.id,
      query: profile.query,
      params: profile.params,
      startTime: profile.startTime.toISOString(),
      endTime: profile.endTime?.toISOString(),
      executionTime: profile.executionTime,
      rowsAffected: profile.rowsAffected,
      error: profile.error?.message,
      stackTrace: profile.stackTrace,
    };
  }
}

// Enhanced SQL wrapper with profiling
export class ProfiledSQL {
  private profiler: DatabaseProfiler;
  private originalSQL: any;

  constructor(sql: any, profiler: DatabaseProfiler) {
    this.originalSQL = sql;
    this.profiler = profiler;
    
    // Create proxy to intercept SQL calls
    return new Proxy(this, {
      get: (target, prop) => {
        if (prop === 'profiledQuery') {
          return target.profiledQuery.bind(target);
        }
        return target.originalSQL[prop];
      },
      apply: (target, thisArg, args) => {
        return target.profiledQuery(args[0], args.slice(1));
      }
    });
  }

  async profiledQuery(query: string, params?: any[]): Promise<any> {
    const profile = this.profiler.startProfile(query, params);
    
    try {
      const result = await this.originalSQL(query, ...params || []);
      this.profiler.endProfile(profile, result);
      return result;
    } catch (error) {
      this.profiler.endProfile(profile, undefined, error as Error);
      throw error;
    }
  }
}

// Global profiler instance
let globalProfiler: DatabaseProfiler | null = null;

export const createProfiler = (options?: {
  slowQueryThreshold?: number;
  maxProfileHistory?: number;
  enabled?: boolean;
}): DatabaseProfiler => {
  if (!globalProfiler) {
    globalProfiler = new PostgresProfiler(options);
  }
  return globalProfiler;
};

export const getProfiler = (): DatabaseProfiler => {
  if (!globalProfiler) {
    globalProfiler = createProfiler();
  }
  return globalProfiler;
};

// Helper function to wrap SQL with profiling
export const withProfiling = (sql: any): any => {
  const profiler = getProfiler();
  return new ProfiledSQL(sql, profiler);
};

export default getProfiler;
