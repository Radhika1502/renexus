import { Module } from '@nestjs/common';
import { WorkflowAutomationController } from './workflow-automation.controller';
import { WorkflowAutomationService } from './workflow-automation.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [WorkflowAutomationController],
  providers: [WorkflowAutomationService, PrismaService],
  exports: [WorkflowAutomationService]
})
export class WorkflowAutomationModule {}
