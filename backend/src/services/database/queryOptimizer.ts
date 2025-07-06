import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
import { createLogger } from '../../utils/logger';

const logger = createLogger('QueryOptimizer');

export class QueryOptimizer {
  private queryStats: Map<string, {
    count: number;
    totalTime: number;
    avgTime: number;
    lastOptimized: Date;
  }> = new Map();

  constructor(private prisma: PrismaClient) {
    this.setupQueryMiddleware();
  }

  private setupQueryMiddleware() {
    this.prisma.$use(async (params, next) => {
      const start = performance.now();
      const result = await next(params);
      const end = performance.now();
      
      const duration = end - start;
      this.recordQueryStats(params, duration);

      return result;
    });
  }

  private recordQueryStats(params: any, duration: number) {
    const queryKey = `${params.model}.${params.action}`;
    const stats = this.queryStats.get(queryKey) || {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      lastOptimized: new Date(0),
    };

    stats.count++;
    stats.totalTime += duration;
    stats.avgTime = stats.totalTime / stats.count;

    this.queryStats.set(queryKey, stats);

    // Log slow queries
    if (duration > 100) {
      logger.warn('Slow query detected', {
        query: queryKey,
        duration,
        params: params.args,
      });
    }
  }

  public getQueryStats() {
    return Array.from(this.queryStats.entries()).map(([query, stats]) => ({
      query,
      ...stats,
    }));
  }

  public optimizeQuery(params: any): any {
    const { model, action, args } = params;

    switch (action) {
      case 'findMany':
        return this.optimizeFindMany(model, args);
      case 'count':
        return this.optimizeCount(model, args);
      case 'aggregate':
        return this.optimizeAggregate(model, args);
      default:
        return args;
    }
  }

  private optimizeFindMany(model: string, args: any): any {
    const optimized = { ...args };

    // Add index hints if available
    if (this.hasIndex(model, args.where)) {
      optimized.indexHints = this.getIndexHints(model, args.where);
    }

    // Optimize includes/selects
    if (args.include) {
      optimized.include = this.optimizeIncludes(args.include);
    }

    // Add cursor-based pagination for better performance
    if (args.skip && !args.cursor) {
      const cursorField = this.getCursorField(model);
      if (cursorField) {
        delete optimized.skip;
        optimized.cursor = {
          [cursorField]: args.skip,
        };
      }
    }

    // Limit result size for better performance
    if (!optimized.take && !optimized.limit) {
      optimized.take = 100;
    }

    return optimized;
  }

  private optimizeCount(model: string, args: any): any {
    const optimized = { ...args };

    // Use estimated count for large tables
    if (this.isLargeTable(model) && !args.where) {
      optimized.approximate = true;
    }

    return optimized;
  }

  private optimizeAggregate(model: string, args: any): any {
    const optimized = { ...args };

    // Use materialized views for complex aggregations
    if (this.hasMaterializedView(model, args)) {
      optimized.useMaterializedView = true;
    }

    return optimized;
  }

  private hasIndex(model: string, where: any): boolean {
    // Check if the query can use an existing index
    // This would be implemented based on your schema
    return false;
  }

  private getIndexHints(model: string, where: any): string[] {
    // Return index hints based on the query
    return [];
  }

  private optimizeIncludes(include: any): any {
    // Optimize nested includes to prevent N+1 queries
    return Object.entries(include).reduce((acc, [key, value]) => {
      if (typeof value === 'object') {
        acc[key] = this.optimizeIncludes(value);
      } else {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
  }

  private getCursorField(model: string): string | null {
    // Return the best field to use for cursor-based pagination
    switch (model) {
      case 'User':
        return 'createdAt';
      case 'Task':
        return 'updatedAt';
      case 'Project':
        return 'createdAt';
      default:
        return null;
    }
  }

  private isLargeTable(model: string): boolean {
    // Define which tables are considered large
    const largeTables = ['Task', 'Notification', 'AuditLog'];
    return largeTables.includes(model);
  }

  private hasMaterializedView(model: string, args: any): boolean {
    // Check if a materialized view exists for this query
    return false;
  }

  public async analyzeQueryPerformance() {
    const stats = this.getQueryStats();
    const slowQueries = stats.filter(stat => stat.avgTime > 100);

    if (slowQueries.length > 0) {
      logger.warn('Slow queries detected', { slowQueries });
    }

    return {
      totalQueries: stats.length,
      slowQueries: slowQueries.length,
      averageQueryTime: stats.reduce((acc, stat) => acc + stat.avgTime, 0) / stats.length,
      queriesByModel: this.groupQueriesByModel(stats),
    };
  }

  private groupQueriesByModel(stats: any[]) {
    return stats.reduce((acc, stat) => {
      const [model] = stat.query.split('.');
      if (!acc[model]) {
        acc[model] = {
          count: 0,
          totalTime: 0,
          avgTime: 0,
        };
      }
      acc[model].count += stat.count;
      acc[model].totalTime += stat.totalTime;
      acc[model].avgTime = acc[model].totalTime / acc[model].count;
      return acc;
    }, {});
  }
} 