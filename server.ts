import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import * as dotenv from 'dotenv';
import apiRoutes from './api/routes';
import { pool } from './database/db';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestLogger } from './services/logging/logger.service';
import { apiRateLimiter } from './middleware/rate-limit.middleware';

// Load environment variables
dotenv.config();

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
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  server.close(async () => {
    console.log('Server closed');
    await pool.end();
    console.log('Database connections closed');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  server.close(async () => {
    console.log('Server closed');
    await pool.end();
    console.log('Database connections closed');
    process.exit(0);
  });
});
