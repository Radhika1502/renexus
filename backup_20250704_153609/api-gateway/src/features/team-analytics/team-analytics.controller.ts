import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Controller('teams/:teamId/analytics')
export class TeamAnalyticsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getTeamAnalytics(@Param('teamId') teamId: string) {
    // Get team members
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        users: true
      }
    });

    if (!team) {
      return { error: 'Team not found' };
    }

    // Get all tasks assigned to team members
    const userIds = team.users.map(user => user.id);
    const tasks = await this.prisma.task.findMany({
      where: {
        assigneeId: {
          in: userIds
        }
      },
      include: {
        project: true,
        timeLogs: true
      }
    });

    // Calculate team metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done').length;
    
    // Calculate completion rate
    const completionRate = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0;
    
    // Calculate average time to completion
    let totalCompletionTime = 0;
    let completedTaskCount = 0;
    
    for (const task of tasks) {
      if (task.status === 'done' && task.createdAt && task.updatedAt) {
        const createdDate = new Date(task.createdAt);
        const completedDate = new Date(task.updatedAt);
        const timeToComplete = (completedDate.getTime() - createdDate.getTime()) / (1000 * 3600 * 24); // days
        totalCompletionTime += timeToComplete;
        completedTaskCount++;
      }
    }
    
    const avgCompletionTime = completedTaskCount > 0 
      ? Math.round((totalCompletionTime / completedTaskCount) * 10) / 10
      : 0;
    
    // Calculate member performance
    const memberPerformance = await this.calculateMemberPerformance(teamId);
    
    // Get project distribution
    const projectCounts: Record<string, number> = {};
    tasks.forEach(task => {
      const projectName = task.project?.name || 'Unknown Project';
      projectCounts[projectName] = (projectCounts[projectName] || 0) + 1;
    });
    
    return {
      summary: {
        totalTasks,
        completedTasks,
        completionRate,
        avgCompletionTime
      },
      memberPerformance,
      projectDistribution: Object.entries(projectCounts).map(([projectName, taskCount]) => ({
        projectName,
        taskCount
      }))
    };
  }
  
  private async calculateMemberPerformance(teamId: string) {
    const teamMembers = await this.prisma.user.findMany({
      where: { teamId }
    });
    
    const memberPerformance = [];
    
    for (const member of teamMembers) {
      const assignedTasks = await this.prisma.task.findMany({
        where: { assigneeId: member.id }
      });
      
      memberPerformance.push({
        userId: member.id,
        name: member.name,
        tasksAssigned: assignedTasks.length,
        tasksCompleted: assignedTasks.filter(task => task.status === 'done').length
      });
    }
    
    return memberPerformance;
  }
}
