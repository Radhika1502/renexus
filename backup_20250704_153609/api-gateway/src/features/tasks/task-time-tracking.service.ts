import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaskTimeTrackingService {
  constructor(private prisma: PrismaService) {}

  async getTimeEntries(taskId: string) {
    // Check if task exists
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return this.prisma.timeLog.findMany({
      where: { taskId },
      orderBy: { startTime: 'desc' },
    });
  }

  async createTimeEntry(
    taskId: string, 
    userId: string, 
    userName: string, 
    data: { 
      startTime: Date,
      endTime: Date,
      duration: number,
      notes?: string,
    },
  ) {
    // Validate the time entry
    if (data.endTime && new Date(data.startTime) > new Date(data.endTime)) {
      throw new BadRequestException('Start time cannot be after end time');
    }

    // Check if task exists
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Use type assertion for the create operation
    return this.prisma.timeLog.create({
      data: {
        taskId,
        userId,
        userName,
        startTime: data.startTime,
        endTime: data.endTime || null,
        duration: data.duration || null,
        notes: data.notes || null,
      } as any,
    });
  }

  async startTimer(taskId: string, userId: string, userName: string, startTime: Date) {
    // Check if task exists
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Check if there's already an active timer for this user
    // Use type assertion for the query to handle userId field
    const activeTimer = await this.prisma.timeLog.findFirst({
      where: {
        userId,
        endTime: null,
      } as any,
    });

    if (activeTimer) {
      throw new BadRequestException('You already have an active timer running');
    }

    // Create a new time entry with no end time
    return this.prisma.timeLog.create({
      data: {
        taskId,
        userId,
        userName,
        startTime,
        // Explicitly set null values for nullable fields
        endTime: null,
        duration: null,
      } as any,
    });
  }

  async stopTimer(
    taskId: string, 
    userId: string, 
    endTime: Date, 
    duration: number,
    notes?: string,
  ) {
    // Find the active timer
    const activeTimer = await this.prisma.timeLog.findFirst({
      where: {
        taskId,
        userId,
        endTime: null,
      } as any,
    });

    if (!activeTimer) {
      throw new NotFoundException('No active timer found');
    }

    // Update the time entry
    return this.prisma.timeLog.update({
      where: { id: activeTimer.id },
      data: {
        endTime,
        duration,
        notes: notes || undefined,
      } as Prisma.TimeLogUpdateInput,
    });
  }

  async getActiveTimer(userId: string) {
    return this.prisma.timeLog.findFirst({
      where: {
        userId,
        endTime: null,
      } as any,
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async deleteTimeEntry(id: string) {
    try {
      return await this.prisma.timeLog.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Time entry with ID ${id} not found`);
      }
      throw error;
    }
  }

  async getTotalTimeForTask(taskId: string) {
    const result = await this.prisma.timeLog.aggregate({
      where: {
        taskId,
      },
      _sum: {
        duration: true,
      },
    });

    return (result._sum && result._sum.duration) || 0;
  }

  async getUserTimeEntries(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    // Build the filter with optional date range
    const where: any = { userId };
    
    if (startDate || endDate) {
      where.startTime = {};
      
      if (startDate) {
        where.startTime.gte = startDate;
      }
      
      if (endDate) {
        where.startTime.lte = endDate;
      }
    }
    
    return this.prisma.timeLog.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async generateTaskTimeReport(taskId: string) {
    // Check if task exists
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        description: true,
        projectId: true,
      },
    });
    
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Get all time entries for this task
    const timeEntries = await this.prisma.timeLog.findMany({
      where: { taskId },
      orderBy: { startTime: 'asc' },
    });

    // Calculate total duration
    const totalDuration = timeEntries.reduce((sum, entry) => {
      return sum + (entry.duration || 0);
    }, 0);

    // Group by user
    const userSummary = timeEntries.reduce((acc, entry: any) => {
      const userId = entry.userId;
      if (!acc[userId]) {
        acc[userId] = {
          userId,
          userName: entry.userName,
          totalDuration: 0,
          entryCount: 0,
        };
      }
      
      acc[userId].totalDuration += entry.duration || 0;
      acc[userId].entryCount += 1;
      
      return acc;
    }, {} as Record<string, { userId: string; userName: string; totalDuration: number; entryCount: number }>);

    return {
      task,
      summary: {
        totalDuration,
        entryCount: timeEntries.length,
        users: Object.values(userSummary),
      },
      entries: timeEntries,
    };
  }

  async generateUserTimeReport(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    // Build the filter with optional date range
    const where: any = { userId };
    
    if (startDate || endDate) {
      where.startTime = {};
      
      if (startDate) {
        where.startTime.gte = startDate;
      }
      
      if (endDate) {
        where.startTime.lte = endDate;
      }
    }
    
    // Get all time entries for this user
    const timeEntries = await this.prisma.timeLog.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            projectId: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Check if we have any entries
    if (timeEntries.length === 0) {
      return {
        userId,
        startDate,
        endDate,
        summary: {
          totalDuration: 0,
          entryCount: 0,
          byTask: [],
          byProject: [],
        },
        entries: [],
      };
    }

    // Calculate total duration
    const totalDuration = timeEntries.reduce((sum, entry) => {
      return sum + (entry.duration || 0);
    }, 0);

    // Group by task
    const taskSummary = timeEntries.reduce((acc, entry) => {
      const taskId = entry.taskId;
      if (!acc[taskId]) {
        acc[taskId] = {
          taskId,
          taskTitle: entry.task?.title || 'Unknown',
          totalDuration: 0,
          entryCount: 0,
        };
      }
      
      acc[taskId].totalDuration += entry.duration || 0;
      acc[taskId].entryCount += 1;
      
      return acc;
    }, {} as Record<string, { taskId: string; taskTitle: string; totalDuration: number; entryCount: number }>);

    // Group by project
    const projectSummary = timeEntries.reduce((acc, entry) => {
      const projectId = entry.task?.projectId || 'unknown';
      if (!acc[projectId]) {
        acc[projectId] = {
          projectId,
          totalDuration: 0,
          entryCount: 0,
        };
      }
      
      acc[projectId].totalDuration += entry.duration || 0;
      acc[projectId].entryCount += 1;
      
      return acc;
    }, {} as Record<string, { projectId: string; totalDuration: number; entryCount: number }>);

    return {
      userId,
      userName: (timeEntries[0] as any).userName,
      startDate,
      endDate,
      summary: {
        totalDuration,
        entryCount: timeEntries.length,
        byTask: Object.values(taskSummary),
        byProject: Object.values(projectSummary),
      },
      entries: timeEntries,
    };
  }
}
