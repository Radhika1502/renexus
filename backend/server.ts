import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Log environment loading
try {
  console.log('Loading environment variables...');
  console.log('Current working directory:', process.cwd());
  
  // Load environment variables
  const envPath = path.resolve(process.cwd(), '.env');
  console.log('Loading .env file from:', envPath);
  
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    console.error('Error loading .env file:', result.error);
  } else {
    console.log('Environment variables loaded successfully');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '*** (set)' : 'Not set');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  }
} catch (error) {
  console.error('Error initializing environment:', error);
}

// Import routes and middleware after environment is loaded
import apiRoutes from './api/routes';
import { pool } from './database/db';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestLogger } from './services/logging/logger.service';
import { apiRateLimiter } from './middleware/rate-limit.middleware';

// Environment variables are now loaded at the top of the file

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(hpp()); // Prevent HTTP Parameter Pollution attacks

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Parse JSON request body with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded request body
app.use(cookieParser()); // Parse cookies

// Logging middleware
app.use(requestLogger); // Custom request logger

// Rate limiting middleware
app.use(apiRateLimiter); // Apply rate limiting to all routes

// API routes
app.use('/api', apiRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

// Start server
console.log('Testing database connection...');
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Connection string:', process.env.DATABASE_URL ? '*** (set)' : 'Not set');
    console.error('Please check your database configuration in the .env file');
    console.error('Make sure PostgreSQL is running and the database exists');
    process.exit(1);
  }
  
  console.log('✅ Database connection successful! Server time:', res.rows[0].now);
  
  console.log(`\n🚀 Starting Express server on port ${PORT}...`);
  
  // Define server variable at function scope
  let server: ReturnType<typeof app.listen>;
  
  try {
    server = app.listen(PORT, '0.0.0.0', () => {
      const address = server.address();
      const host = typeof address === 'string' ? address : `http://localhost:${PORT}`;
      console.log(`\n✅ Server is running at ${host}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('🛑 Press Ctrl+C to stop the server\n');
      
      // Log all routes
      console.log('🛣️  Available routes:');
      app._router.stack
        .filter((r: any) => r.route)
        .forEach((r: any) => {
          const methods = Object.keys(r.route.methods).map((m: string) => m.toUpperCase()).join(', ');
          console.log(`   ${methods.padEnd(8)} ${r.route.path}`);
        });
    });
    
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') throw error;
      
      // Handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(`Port ${PORT} requires elevated privileges`);
          break;
        case 'EADDRINUSE':
          console.error(`Port ${PORT} is already in use`);
          break;
        default:
          throw error;
      }
      process.exit(1);
    });
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Rejection:', err);
      if (server) {
        server.close(() => process.exit(1));
      } else {
        process.exit(1);
      }
    });
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      if (server) {
        server.close(() => process.exit(1));
      } else {
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM. Shutting down gracefully...');
  try {
    await pool.end();
    console.log('Database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});
