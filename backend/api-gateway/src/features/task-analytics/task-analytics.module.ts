import { Module, CacheModule } from '@nestjs/common';
import { TaskAnalyticsController } from './task-analytics.controller';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60, // Cache items for 60 seconds
      max: 100, // Maximum number of items in cache
    }),
  ],
  controllers: [TaskAnalyticsController],
  providers: [],
  exports: []
})
export class TaskAnalyticsModule {}
