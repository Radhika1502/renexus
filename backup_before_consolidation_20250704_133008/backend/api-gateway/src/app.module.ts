import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TaskAnalyticsModule } from './features/task-analytics/task-analytics.module';
import { TeamAnalyticsModule } from './features/team-analytics/team-analytics.module';
import { WorkflowAutomationModule } from './features/workflow-automation/workflow-automation.module';
import { TasksModule } from './features/tasks/tasks.module';
import { DashboardModule } from './features/dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { CacheModule } from './cache/cache.module';
import { SecurityMiddleware } from './security/security.middleware';
import { PrismaService } from './prisma.service';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    // Load environment variables with validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      cache: true,
      expandVariables: true,
    }),
    
    // Database module for global database access
    DatabaseModule,
    
    // Feature modules
    TasksModule,
    TaskAnalyticsModule, 
    TeamAnalyticsModule, 
    WorkflowAutomationModule,
    DashboardModule,
    
    // Core modules
    HealthModule,
    CacheModule
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
