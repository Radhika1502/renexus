import { Pool } from 'pg';
import { logger } from '../utils/logger';

export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer;
  private pool: Pool;

  private constructor(pool: Pool) {
    this.pool = pool;
  }

  static getInstance(pool: Pool): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer(pool);
    }
    return DatabaseOptimizer.instance;
  }

  // Create indexes for better query performance
  async createIndexes(): Promise<void> {
    try {
      // Task indexes
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
        CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
        CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
        CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
        CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
        CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at);
      `);

      // Project indexes
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
        CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
        CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
        CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);
        CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
        CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
      `);

      // Project members indexes
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
        CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
        CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members(role);
      `);

      // Notification indexes
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
        CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
        CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
      `);

      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.error('Failed to create database indexes:', error);
      throw error;
    }
  }

  // Analyze tables for query optimization
  async analyzeTables(): Promise<void> {
    try {
      await this.pool.query('ANALYZE tasks;');
      await this.pool.query('ANALYZE projects;');
      await this.pool.query('ANALYZE project_members;');
      await this.pool.query('ANALYZE notifications;');
      logger.info('Database tables analyzed successfully');
    } catch (error) {
      logger.error('Failed to analyze database tables:', error);
      throw error;
    }
  }

  // Vacuum tables to reclaim storage and update statistics
  async vacuumTables(): Promise<void> {
    try {
      await this.pool.query('VACUUM ANALYZE tasks;');
      await this.pool.query('VACUUM ANALYZE projects;');
      await this.pool.query('VACUUM ANALYZE project_members;');
      await this.pool.query('VACUUM ANALYZE notifications;');
      logger.info('Database tables vacuumed successfully');
    } catch (error) {
      logger.error('Failed to vacuum database tables:', error);
      throw error;
    }
  }

  // Create materialized views for common queries
  async createMaterializedViews(): Promise<void> {
    try {
      // Project statistics view
      await this.pool.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_project_statistics AS
        SELECT
          p.id AS project_id,
          p.name AS project_name,
          COUNT(t.id) AS total_tasks,
          COUNT(CASE WHEN t.status = 'completed' THEN 1 END) AS completed_tasks,
          AVG(t.progress) AS avg_progress,
          SUM(t.time_spent) AS total_time_spent,
          COUNT(DISTINCT t.assignee_id) AS total_assignees
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        GROUP BY p.id, p.name;

        CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_project_statistics_project_id
        ON mv_project_statistics(project_id);
      `);

      // User workload view
      await this.pool.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_user_workload AS
        SELECT
          u.id AS user_id,
          u.name AS user_name,
          COUNT(t.id) AS assigned_tasks,
          COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) AS tasks_in_progress,
          COUNT(CASE WHEN t.due_date < NOW() AND t.status != 'completed' THEN 1 END) AS overdue_tasks,
          SUM(t.time_estimate) AS total_estimated_time,
          SUM(t.time_spent) AS total_time_spent
        FROM users u
        LEFT JOIN tasks t ON t.assignee_id = u.id
        GROUP BY u.id, u.name;

        CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_user_workload_user_id
        ON mv_user_workload(user_id);
      `);

      logger.info('Materialized views created successfully');
    } catch (error) {
      logger.error('Failed to create materialized views:', error);
      throw error;
    }
  }

  // Refresh materialized views
  async refreshMaterializedViews(): Promise<void> {
    try {
      await this.pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_project_statistics;');
      await this.pool.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_workload;');
      logger.info('Materialized views refreshed successfully');
    } catch (error) {
      logger.error('Failed to refresh materialized views:', error);
      throw error;
    }
  }

  // Create partitions for large tables
  async createPartitions(): Promise<void> {
    try {
      // Partition tasks table by created_at
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS tasks_partitioned (
          LIKE tasks INCLUDING ALL
        ) PARTITION BY RANGE (created_at);

        CREATE TABLE IF NOT EXISTS tasks_y2024m01 PARTITION OF tasks_partitioned
        FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

        CREATE TABLE IF NOT EXISTS tasks_y2024m02 PARTITION OF tasks_partitioned
        FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

        CREATE TABLE IF NOT EXISTS tasks_y2024m03 PARTITION OF tasks_partitioned
        FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
      `);

      // Partition notifications table by created_at
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS notifications_partitioned (
          LIKE notifications INCLUDING ALL
        ) PARTITION BY RANGE (created_at);

        CREATE TABLE IF NOT EXISTS notifications_y2024m01 PARTITION OF notifications_partitioned
        FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

        CREATE TABLE IF NOT EXISTS notifications_y2024m02 PARTITION OF notifications_partitioned
        FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

        CREATE TABLE IF NOT EXISTS notifications_y2024m03 PARTITION OF notifications_partitioned
        FOR VALUES FROM ('2024-03-01') TO ('2024-04-01');
      `);

      logger.info('Table partitions created successfully');
    } catch (error) {
      logger.error('Failed to create table partitions:', error);
      throw error;
    }
  }

  // Set up table maintenance
  async setupTableMaintenance(): Promise<void> {
    try {
      // Create maintenance function
      await this.pool.query(`
        CREATE OR REPLACE FUNCTION maintain_tables() RETURNS void AS $$
        BEGIN
          -- Vacuum and analyze tables
          VACUUM ANALYZE tasks;
          VACUUM ANALYZE projects;
          VACUUM ANALYZE project_members;
          VACUUM ANALYZE notifications;

          -- Refresh materialized views
          REFRESH MATERIALIZED VIEW CONCURRENTLY mv_project_statistics;
          REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_workload;
        END;
        $$ LANGUAGE plpgsql;
      `);

      // Schedule maintenance (requires pg_cron extension)
      await this.pool.query(`
        SELECT cron.schedule('0 0 * * *', 'SELECT maintain_tables();');
      `);

      logger.info('Table maintenance scheduled successfully');
    } catch (error) {
      logger.error('Failed to set up table maintenance:', error);
      throw error;
    }
  }

  // Monitor query performance
  async monitorQueryPerformance(): Promise<void> {
    try {
      // Enable query statistics collection
      await this.pool.query('ALTER SYSTEM SET track_activities = on;');
      await this.pool.query('ALTER SYSTEM SET track_counts = on;');
      await this.pool.query('ALTER SYSTEM SET track_io_timing = on;');
      await this.pool.query('ALTER SYSTEM SET track_functions = all;');

      // Create performance monitoring view
      await this.pool.query(`
        CREATE OR REPLACE VIEW v_query_stats AS
        SELECT
          query,
          calls,
          total_time,
          min_time,
          max_time,
          mean_time,
          rows
        FROM pg_stat_statements
        ORDER BY total_time DESC;
      `);

      logger.info('Query performance monitoring enabled');
    } catch (error) {
      logger.error('Failed to set up query performance monitoring:', error);
      throw error;
    }
  }
} 