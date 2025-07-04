import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Controller('teams/:teamId/analytics')
export class TeamAnalyticsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getTeamAnalytics(@Param('teamId') teamId: string) {
    // Get all projects for this team
    const projects = await this.prisma.project.findMany({
      where: { teamId },
      include: {
        tasks: true
      }
    });

    // Calculate team metrics
    const totalTasks = projects.reduce(
      (sum, project) => sum + project.tasks.length, 
      0
    );
    
    const completedTasks = projects.reduce(
      (sum, project) => sum + project.tasks.filter(task => task.status === 'COMPLETED').length,
      0
    );
    
    // Calculate completion rate
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;
    
    // Calculate average time to completion
    let totalCompletionTime = 0;
    let completedTaskCount = 0;
    
    for (const project of projects) {
      for (const task of project.tasks) {
        if (task.status === 'COMPLETED' && task.createdAt && task.completedAt) {
          const createdDate = new Date(task.createdAt);
          const completedDate = new Date(task.completedAt);
          const timeToComplete = (completedDate.getTime() - createdDate.getTime()) / (1000 * 3600 * 24); // days
          totalCompletionTime += timeToComplete;
          completedTaskCount++;
        }
      }
    }
    
    const avgCompletionTime = completedTaskCount > 0 
      ? Math.round((totalCompletionTime / completedTaskCount) * 10) / 10
      : 0;
    
    // Calculate member performance
    const memberPerformance = await this.calculateMemberPerformance(teamId);
    
    return {
      summary: {
        totalTasks,
        completedTasks,
        completionRate,
        avgCompletionTime
      },
      memberPerformance,
      projectDistribution: projects.map(project => ({
        projectName: project.name,
        taskCount: project.tasks.length
      }))
    };
  }
  
  private async calculateMemberPerformance(teamId: string) {
    const teamMembers = await this.prisma.user.findMany({
      where: { 
        teamMemberships: {
          some: { teamId }
        }
      },
      include: {
        assignedTasks: true
      }
    });
    
    return teamMembers.map(member => ({
      userId: member.id,
      name: member.name,
      tasksAssigned: member.assignedTasks.length,
      tasksCompleted: member.assignedTasks.filter(task => task.status === 'COMPLETED').length
    }));
  }
}
