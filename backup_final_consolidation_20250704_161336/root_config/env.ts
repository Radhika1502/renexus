/**
 * Environment configuration for the Renexus application
 */

// Define the environment variables with their types
interface Env {
  NODE_ENV: string;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ORIGIN: string;
  STORAGE_PATH: string;
  LOG_LEVEL: string;
}

// Default values for development
const defaultEnv: Env = {
  NODE_ENV: 'development',
  PORT: 3000,
  DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/renexus',
  JWT_SECRET: 'development-secret-key-change-in-production',
  JWT_EXPIRES_IN: '1d',
  CORS_ORIGIN: '*',
  STORAGE_PATH: './storage',
  LOG_LEVEL: 'debug',
};

// Load environment variables with fallbacks to defaults
export const env: Env = {
  NODE_ENV: process.env.NODE_ENV || defaultEnv.NODE_ENV,
  PORT: parseInt(process.env.PORT || String(defaultEnv.PORT), 10),
  DATABASE_URL: process.env.DATABASE_URL || defaultEnv.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || defaultEnv.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || defaultEnv.JWT_EXPIRES_IN,
  CORS_ORIGIN: process.env.CORS_ORIGIN || defaultEnv.CORS_ORIGIN,
  STORAGE_PATH: process.env.STORAGE_PATH || defaultEnv.STORAGE_PATH,
  LOG_LEVEL: process.env.LOG_LEVEL || defaultEnv.LOG_LEVEL,
};
