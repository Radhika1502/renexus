import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TaskAnalyticsModule } from './features/task-analytics/task-analytics.module';
import { TeamAnalyticsModule } from './features/team-analytics/team-analytics.module';
import { WorkflowAutomationModule } from './features/workflow-automation/workflow-automation.module';
import { HealthModule } from './health/health.module';
import { AppCacheModule } from './cache/cache.module';
import { SecurityMiddleware } from './security/security.middleware';
import { PrismaService } from './prisma.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TaskAnalyticsModule, 
    TeamAnalyticsModule, 
    WorkflowAutomationModule,
    HealthModule,
    AppCacheModule
  ],
  providers: [PrismaService]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*');
  }
}
