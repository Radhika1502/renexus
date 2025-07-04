import { Module } from '@nestjs/common';
import { TeamAnalyticsController } from './team-analytics.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [TeamAnalyticsController],
  providers: [PrismaService]
})
export class TeamAnalyticsModule {}
