import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TaskAnalyticsModule } from './features/task-analytics/task-analytics.module';
import { TeamAnalyticsModule } from './features/team-analytics/team-analytics.module';
import { WorkflowAutomationModule } from './features/workflow-automation/workflow-automation.module';
import { HealthModule } from './health/health.module';
import { AppCacheModule } from './cache/cache.module';
import { SecurityMiddleware } from './security/security.middleware';
import { PrismaService } from './prisma.service';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    // Load environment variables with validation and debug logging
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      cache: true,
      debug: process.env.NODE_ENV === 'development',
      expandVariables: true,
    }),
    
    // Database module for global database access
    DatabaseModule,
    
    // Feature modules
    TaskAnalyticsModule, 
    TeamAnalyticsModule, 
    WorkflowAutomationModule,
    
    // Core modules
    HealthModule,
    AppCacheModule
  ],
  providers: [],
  exports: []
})
export class AppModule implements NestModule {
  // Apply global middleware
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*');
  }
}
