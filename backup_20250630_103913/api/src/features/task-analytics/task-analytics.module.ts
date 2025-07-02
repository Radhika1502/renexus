import { Module } from '@nestjs/common';
import { TaskAnalyticsController } from './task-analytics.controller';

@Module({
  controllers: [TaskAnalyticsController]
})
export class TaskAnalyticsModule {}
