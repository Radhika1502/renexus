import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportingService } from './reporting.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportingService, PrismaService],
  exports: [ReportingService],
})
export class ReportsModule {}
