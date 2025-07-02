/**
 * Integration tests for Migration Scripts
 * Using real database connections and actual implementations
 */

// @ts-nocheck
import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { testDb } from '../setup/test-db';

describe('Migration Scripts Integration Tests', () => {
  let migrationFiles = [];
  const migrationsDir = path.resolve(__dirname, '../../database/migrations');
  
  beforeAll(async () => {
    // Ensure test environment
    if (!process.env.NODE_ENV === 'test') {
      process.env.NODE_ENV = 'test';
      console.log('Forcing NODE_ENV to "test"');
    }
    
    // Load migration files
    if (fs.existsSync(migrationsDir)) {
      migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort((a, b) => a.localeCompare(b));
    }
  });
  
  afterAll(async () => {
    // Note: Database connections are closed in jest-teardown.js
  });

  describe('Migration Files', () => {
    it('should have migration files in the migrations directory', () => {
      expect(fs.existsSync(migrationsDir)).toBe(true);
      expect(migrationFiles.length).toBeGreaterThan(0);
    });
    
    it('should have migration files with correct naming format', () => {
      const migrationFilePattern = /^V\d+__[\w-]+\.sql$/;
      
      for (const file of migrationFiles) {
        expect(migrationFilePattern.test(file)).toBe(true);
      }
    });
  });

  describe('Database Schema', () => {
    it('should have all required tables created in the database', async () => {
      // List of essential tables that should exist after migrations
      const requiredTables = [
        'projects',
        'users',
        'tasks',
        'time_logs',
        'projects_users',
        'migrations'
      ];
      
      // Query the real database for tables
      const result = await testDb.execute(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      const existingTables = result.rows.map(row => row.table_name);
      
      // Check all required tables exist
      for (const table of requiredTables) {
        expect(existingTables).toContain(table);
      }
    });
    
    it('should have foreign key constraints properly defined', async () => {
      // Get foreign keys from the real database
      const result = await testDb.execute(`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM
          information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
      `);
      
      // Essential foreign key relationships that should exist
      const requiredRelationships = [
        { table: 'tasks', column: 'project_id', foreignTable: 'projects' },
        { table: 'tasks', column: 'assigned_to', foreignTable: 'users' },
        { table: 'time_logs', column: 'task_id', foreignTable: 'tasks' },
        { table: 'time_logs', column: 'user_id', foreignTable: 'users' },
        { table: 'projects_users', column: 'project_id', foreignTable: 'projects' },
        { table: 'projects_users', column: 'user_id', foreignTable: 'users' }
      ];
      
      // Check each required relationship exists
      for (const rel of requiredRelationships) {
        const exists = result.rows.some(row => 
          row.table_name === rel.table && 
          row.column_name === rel.column && 
          row.foreign_table_name === rel.foreignTable
        );
        expect(exists).toBe(true, 
          `Foreign key from ${rel.table}.${rel.column} to ${rel.foreignTable} should exist`
        );
      }
    });
    
    it('should have indexes on frequently queried columns', async () => {
      // Query the real database for indexes
      const result = await testDb.execute(`
        SELECT
          t.relname AS table_name,
          i.relname AS index_name,
          array_agg(a.attname) AS column_names
        FROM
          pg_class t,
          pg_class i,
          pg_index ix,
          pg_attribute a
        WHERE
          t.oid = ix.indrelid
          AND i.oid = ix.indexrelid
          AND a.attrelid = t.oid
          AND a.attnum = ANY(ix.indkey)
          AND t.relkind = 'r'
        GROUP BY
          t.relname,
          i.relname
        ORDER BY
          t.relname,
          i.relname;
      `);
      
      // Essential indexes that should exist for performance
      const requiredIndexes = [
        { table: 'projects', columns: ['tenant_id'] },
        { table: 'tasks', columns: ['project_id'] },
        { table: 'tasks', columns: ['assigned_to'] },
        { table: 'time_logs', columns: ['task_id'] },
        { table: 'time_logs', columns: ['user_id'] }
      ];
      
      // Check each required index exists (or is covered by another index)
      for (const idx of requiredIndexes) {
        const foundIndex = result.rows.find(row => {
          if (row.table_name !== idx.table) return false;
          
          // Check if all required columns are in this index
          return idx.columns.every(col => row.column_names.includes(col));
        });
        
        expect(foundIndex).toBeDefined(
          `Index for ${idx.table} on columns ${idx.columns.join(', ')} should exist`
        );
      }
    });
  });

  describe('Migration Execution', () => {
    it('should record migrations in the migrations table', async () => {
      // Query the migrations table in the real database
      const result = await testDb.execute('SELECT script_name FROM migrations ORDER BY applied_at');
      
      expect(result.rows.length).toBeGreaterThan(0);
      
      // All migration files should have a corresponding record in the migrations table
      for (const file of migrationFiles) {
        const migrated = result.rows.some(row => row.script_name === file);
        expect(migrated).toBe(true, `Migration ${file} should be recorded in the migrations table`);
      }
    });
    
    it('should execute migrations in order', async () => {
      // Query the migrations table to check the order
      const result = await testDb.execute('SELECT script_name FROM migrations ORDER BY applied_at');
      
      const appliedMigrations = result.rows.map(row => row.script_name);
      
      // The sorted list of migration files should match the order they were applied
      const sortedMigrations = [...migrationFiles].sort((a, b) => {
        // Extract version numbers (V1, V2, etc.) and compare numerically
        const versionA = parseInt(a.split('__')[0].substring(1));
        const versionB = parseInt(b.split('__')[0].substring(1));
        return versionA - versionB;
      });
      
      // The migrations should have been executed in the correct order
      sortedMigrations.forEach((migFile, idx) => {
        // Check each migration was applied and in the right sequence
        expect(appliedMigrations.indexOf(migFile)).not.toBe(-1);
        
        // If this is not the first migration, check it was applied after the previous one
        if (idx > 0) {
          const prevMigIdx = appliedMigrations.indexOf(sortedMigrations[idx-1]);
          const currMigIdx = appliedMigrations.indexOf(migFile);
          expect(currMigIdx).toBeGreaterThan(prevMigIdx);
        }
      });
    });
  });
});
