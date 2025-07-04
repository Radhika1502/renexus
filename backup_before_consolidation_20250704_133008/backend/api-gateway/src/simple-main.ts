import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DashboardModule } from './features/dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import * as cors from 'cors';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      cache: true,
      expandVariables: true,
    }),
    DatabaseModule,
    DashboardModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: []
})
export class SimpleAppModule {}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('🚀 Starting Renexus API Server (Simple Mode)...');
    
    const app = await NestFactory.create(SimpleAppModule, {
      logger: ['error', 'warn', 'log'],
    });
    
    // Configure CORS
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
      forbidNonWhitelisted: false,
    }));
    
    const PORT = parseInt(process.env.PORT || '3001', 10);
    
    await app.listen(PORT, '0.0.0.0');
    
    logger.log(`✅ Server started successfully!`);
    logger.log(`📡 REST API: http://localhost:${PORT}/api`);
    logger.log(`🔍 Health Check: http://localhost:${PORT}/health`);
    logger.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap(); 