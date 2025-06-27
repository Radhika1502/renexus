import { Controller, Get, Param, UseInterceptors, CacheInterceptor } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Task, TimeLog } from '../../types/models';

@Controller('tasks/:taskId/analytics')
@UseInterceptors(CacheInterceptor)
export class TaskAnalyticsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getTaskAnalytics(@Param('taskId') taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        timeLogs: true,
        project: {
          include: {
            tasks: true
          }
        }
      }
    });

    if (!task) {
      return { error: 'Task not found' };
    }

    // Calculate actual time spent
    const actualHours = task.timeLogs.reduce(
      (sum: number, log: TimeLog) => sum + (log.duration || 0),
      0
    );

    // Calculate completion trends (last 4 weeks) - optimized with a single query
    const now = new Date();
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(now.getDate() - 28);
    
    // Use a single query to get all completed tasks in the last 4 weeks
    const completedTasksData = await this.prisma.$queryRaw<Array<{completed_date: Date, count: BigInt}>>`
      SELECT 
        DATE_TRUNC('week', "updatedAt") as completed_date,
        COUNT(*) as count
      FROM "Task"
      WHERE 
        "projectId" = ${task.projectId} AND
        status = 'COMPLETED' AND
        "updatedAt" >= ${fourWeeksAgo} AND
        "updatedAt" <= ${now}
      GROUP BY DATE_TRUNC('week', "updatedAt")
      ORDER BY completed_date ASC
    `;
    
    // Format the data into weekly trends
    const trends = [];
    for (let i = 3; i >= 0; i--) {
      const startDate = new Date(now);
      startDate.setDate(now.getDate() - 7 * (i + 1));
      
      // Find matching data or default to 0
      const weekData = completedTasksData.find((data: {completed_date: Date, count: BigInt}) => {
        const dataDate = new Date(data.completed_date);
        return dataDate >= startDate && dataDate < new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      });
      
      trends.push({
        date: startDate.toISOString().split('T')[0],
        completed: weekData ? Number(weekData.count) : 0
      });
    }

    return {
      timeSpent: {
        estimated: task.estimatedHours,
        actual: actualHours
      },
      completionTrends: trends
    };
  }
}
