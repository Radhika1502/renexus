import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TaskAnalyticsController } from './task-analytics.controller';
import { TaskAnalyticsService } from './task-analytics.service';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60, // Cache items for 60 seconds
      max: 100, // Maximum number of items in cache
    }),
  ],
  controllers: [TaskAnalyticsController],
  providers: [TaskAnalyticsService, PrismaService],
  exports: [TaskAnalyticsService]
})
export class TaskAnalyticsModule {}
