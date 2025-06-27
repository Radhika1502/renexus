import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { WorkflowAutomationService } from './workflow-automation.service';
import { Project } from '../../types/models';

@Controller('projects')
export class WorkflowAutomationController {
  constructor(
    private prisma: PrismaService,
    private workflowService: WorkflowAutomationService
  ) {}

  @Get(':projectId/suggestions')
  async getTaskSuggestions(@Param('projectId') projectId: string) {
    const project = await this.prisma.$queryRaw<Project[]>`
      SELECT p.*, 
        (SELECT json_agg(t.*) FROM "Task" t WHERE t."projectId" = p.id) as tasks
      FROM "Project" p
      WHERE p.id = ${projectId}
      LIMIT 1
    `;
    
    const projectData = project?.[0];

    if (!projectData) {
      return [];
    }

    return this.workflowService.generateSuggestions(projectData);
  }

  @Post('suggestions/:suggestionId/apply')
  async applySuggestion(
    @Param('suggestionId') suggestionId: string,
    @Body() body: { accept: boolean }
  ) {
    if (body.accept) {
      await this.workflowService.applySuggestion(suggestionId);
    } else {
      await this.workflowService.dismissSuggestion(suggestionId);
    }
    
    return { success: true };
  }
}
