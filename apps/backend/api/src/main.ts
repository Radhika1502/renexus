// Print clear indication script is running
process.stdout.write('\x1Bc'); // Clear console
console.log('🚀 Starting Renexus API Server...');

// NestJS imports
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { PrismaService } from './prisma.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import WebSocketServer from './websocket/WebSocketServer';

// Additional imports
import * as cors from 'cors';
import * as helmet from 'helmet';
import express, { json, urlencoded } from 'express';
import { createServer } from 'http';
import * as fs from 'fs';
import * as path from 'path';

// Force stdout to flush to ensure logs appear immediately
require('process').stdout._handle.setBlocking(true);

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('Initializing application...');
    
    // Display environment information
    const env = process.env.NODE_ENV || 'development';
    logger.log(`Environment: ${env}`);
    
    // Log important environment variables (without sensitive data)
    logger.log(`Database URL: ${process.env.DATABASE_URL ? 'configured' : 'not configured'}`);
    logger.log(`Port: ${process.env.PORT || 3001}`);
    
    // Add uncaught exception handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
    
    // Add unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
    logger.log(`Node.js Version: ${process.version}`);
    logger.log(`Platform: ${process.platform} ${process.arch}`);
    
    // Verify environment file
    const envPath = path.join(process.cwd(), '.env');
    const envExists = fs.existsSync(envPath);
    logger.log(`Environment file (.env): ${envExists ? 'Found' : 'Not found'}`);
    
    if (envExists) {
      // Log environment variables (redacted for security)
      const envFile = fs.readFileSync(envPath, 'utf8');
      const envVars = envFile.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      logger.log(`Loaded ${envVars.length} environment variables`);
    }
    
    // Create NestJS application
    logger.log('Creating NestJS application...');
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
      abortOnError: false,
    });
    
    // Get Prisma service for enabling shutdown hooks
    const prismaService = app.get(PrismaService);
    await prismaService.enableShutdownHooks(app);
    
    // Configure Express
    logger.log('Configuring Express middleware...');
    app.use(helmet.default());
    app.use(json({ limit: '10mb' }));
    app.use(urlencoded({ extended: true, limit: '10mb' }));
    
    // CORS configuration
    const corsOptions = {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    };
    app.enableCors(corsOptions);
    
    // Global validation pipe
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    
    // Create HTTP server for WebSockets
    const httpServer = createServer(app.getHttpAdapter().getInstance());
    
    // Initialize WebSocket server
    logger.log('Initializing WebSocket server...');
    const wsServer = new WebSocketServer(httpServer);
    // The WebSocket server is already initialized in the constructor
    
    // Get port from environment
    const PORT = parseInt(process.env.PORT || '3001', 10);
    
    // Start HTTP server
    await new Promise<void>((resolve, reject) => {
      httpServer.listen(PORT, '0.0.0.0', () => {
        logger.log(`HTTP server listening on port ${PORT}`);
        resolve();
      }).on('error', (err) => {
        logger.error(`Failed to start HTTP server: ${err.message}`);
        reject(err);
      });
    });
    
    // Log application bootstrap success
    logger.log('\n✅ Application successfully started!');
    logger.log(`📡 REST API: http://localhost:${PORT}/api`);
    logger.log(`🔍 Health Check: http://localhost:${PORT}/api/health`);
    logger.log(`🔌 WebSocket Server: ws://localhost:${PORT}`);
    
    // Keep the application running
    process.on('SIGINT', async () => {
      logger.log('SIGINT signal received. Shutting down...');
      await app.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.log('SIGTERM signal received. Shutting down...');
      await app.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('\n❌ Fatal error during bootstrap:', error);
    process.exit(1);
  }
}

// Ensure bootstrap logs are output
bootstrap().catch(error => {
  console.error('Fatal error during bootstrap:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
