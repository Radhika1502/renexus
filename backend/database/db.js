/**
 * Database connection module
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Determine environment
const isTest = process.env.NODE_ENV === 'test';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: isTest ? process.env.TEST_DB_NAME || 'renexus_test' : process.env.DB_NAME || 'renexus',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait for a connection
};

// Create a new pool instance
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Database interface
const db = {
  /**
   * Execute a SQL query
   * @param {string} text - SQL query text
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} - Query result
   */
  async execute(text, params = []) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  },

  /**
   * Execute a transaction
   * @param {Function} callback - Transaction callback
   * @returns {Promise<any>} - Transaction result
   */
  async transaction(callback) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Close the database connection pool
   * @returns {Promise<void>}
   */
  async close() {
    await pool.end();
  },

  /**
   * Get a client from the pool
   * @returns {Promise<Object>} - Database client
   */
  async getClient() {
    return await pool.connect();
  },
};

module.exports = { db, pool };
