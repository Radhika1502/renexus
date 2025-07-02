// Print clear indication script is running
process.stdout.write('\x1Bc'); // Clear console
console.log('🚀 Starting Renexus API Server...');

// NestJS imports
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { PrismaService } from './prisma.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { WebSocketServer } from './websocket/WebSocketServer';

// Additional imports
import * as cors from 'cors';
import * as helmet from 'helmet';
import * as express from 'express';
import { createServer } from 'http';
import * as fs from 'fs';
import * as path from 'path';

// Force stdout to flush to ensure logs appear immediately
require('process').stdout._handle.setBlocking(true);

async function bootstrap() {
  try {
    const logger = new Logger('Bootstrap');
    logger.log('Initializing application...');

    // Display environment information
    logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
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
    app.use(helmet());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    
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
    wsServer.initialize();
    
    // Get port from environment
    const PORT = process.env.PORT || 3001;
    
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
    console.error('\n❌ Failed to start application:', error);
    process.exit(1);
  }
}

// Ensure bootstrap logs are output
try {
  bootstrap().catch(err => {
    console.error('Bootstrap error:', err);
    process.exit(1);
  });
} catch (error) {
  console.error('Critical error starting application:', error);
  process.exit(1);
}
