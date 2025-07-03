import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { format, subDays } from 'date-fns';

// Define DateRange type since we couldn't find the actual file
type DateRange = '7d' | '30d' | '90d' | 'custom';

// Define TaskStatus and TaskPriority enums directly if imports are not working
enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Define types for task with relations
type TaskWithRelations = Prisma.TaskGetPayload<{
  include: {
    assignee: true;
    timeLogs: {
      select: {
        id: true;
        duration: true;
        startTime: true;
        endTime: true;
      };
    };
    comments: {
      select: {
        id: true;
        content: true;
        createdAt: true;
        userId: true;
      };
    };
  };
}>;

// Define type for time log data
type TimeLog = {
  id: string;
  duration: number | null;
  startTime: Date | null;
  endTime: Date | null;
};

// Define type for assignee statistics
type AssigneeStats = {
  userId: string | null;
  userName: string | null;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  timeSpent: number;
};

// Define type for task status counts
type TaskStatusCount = {
  status: string;
  count: number;
};

// Define type for task priority counts
type TaskPriorityCount = {
  priority: string;
  count: number;
};

// Define type for daily task statistics
type DailyTaskStats = {
  date: string;
  created: number;
  completed: number;
  inProgress: number;
};

// Define type for recent activity
type RecentActivity = {
  id: string;
  title: string;
  status: string;
  updatedAt: Date;
  assignee: {
    id: string;
    name: string | null;
  } | null;
};

@Injectable()
export class ReportingService {
  constructor(private prisma: PrismaService) {}

  private getDateRange(timeRange: DateRange): { start: Date; end: Date } {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '90d':
        return { start: subDays(now, 90), end: now };
      default:
        return { start: subDays(now, 7), end: now };
    }
  }

  async getTaskCompletionReport(filters: { 
    projectId: string; 
    timeRange?: DateRange; 
    startDate?: Date; 
    endDate?: Date; 
    userIds?: string[]; 
    statuses?: string[] 
  }) {
    const { projectId, timeRange = '7d', startDate, endDate, userIds, statuses } = filters;
    
    // Validate date range for custom range
    if (timeRange === 'custom' && (!startDate || !endDate)) {
      throw new BadRequestException('Both startDate and endDate are required for custom date range');
    }
    
    if (timeRange === 'custom' && startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const range = timeRange === 'custom' && startDate && endDate 
      ? { start: new Date(startDate), end: new Date(endDate) }
      : this.getDateRange(timeRange);

    // Build the query with proper typing
    const query: Prisma.TaskFindManyArgs = {
      where: {
        projectId,
        createdAt: { gte: range.start, lte: range.end },
        ...(userIds?.length ? { assigneeId: { in: userIds } } : {}),
        ...(statuses?.length ? { 
          status: { 
            in: statuses as TaskStatus[] 
          } 
        } : {}),
      },
      include: {
        assignee: true,
        timeLogs: true,
        comments: true,
      },
    };

    const tasks = await this.prisma.task.findMany(query) as TaskWithRelations[];

    // Process tasks and generate report
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE).length;
    const inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    const notStartedTasks = tasks.filter(task => task.status === TaskStatus.TODO).length;
    
    // Calculate total time spent
    const totalTimeSpent = tasks.reduce((sum: number, task: TaskWithRelations) => {
      const taskTime = task.timeLogs.reduce((taskSum: number, log: TimeLog) => 
        taskSum + (log.duration || 0), 0);
      return sum + taskTime;
    }, 0);

    // Calculate average time per task
    const averageTimePerTask = totalTasks > 0 ? Math.round(totalTimeSpent / totalTasks) : 0;
    
    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Group tasks by status
    const byStatus: TaskStatusCount[] = Object.values(TaskStatus).map((status: TaskStatus) => ({
      status: status,
      count: tasks.filter(task => task.status === status).length
    }));

    // Group tasks by priority
    const byPriority: TaskPriorityCount[] = Object.values(TaskPriority).map((priority: TaskPriority) => ({
      priority: priority,
      count: tasks.filter(task => task.priority === priority).length
    }));

    // Group tasks by assignee
    const byAssignee: AssigneeStats[] = [];
    const assigneeMap = new Map<string, AssigneeStats>();

    tasks.forEach((task: TaskWithRelations) => {
      const assigneeId = task.assigneeId || 'unassigned';
      const assigneeName = task.assignee?.name || 'Unassigned';
      
      if (!assigneeMap.has(assigneeId)) {
        assigneeMap.set(assigneeId, {
          userId: assigneeId === 'unassigned' ? null : assigneeId,
          userName: assigneeName,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          timeSpent: 0
        });
      }
      
      const assignee = assigneeMap.get(assigneeId)!;
      assignee.totalTasks++;
      
      if (task.status === TaskStatus.DONE) {
        assignee.completedTasks++;
      } else if (task.status === TaskStatus.IN_PROGRESS) {
        assignee.inProgressTasks++;
      }
      
      // Calculate time spent for this task
      const taskTime = task.timeLogs.reduce(
        (sum: number, log: TimeLog) => sum + (log.duration || 0), 
        0
      );
      assignee.timeSpent += taskTime;
    });

    // Convert map to array
    byAssignee.push(...assigneeMap.values());

    // Group tasks by day
    const byDay: DailyTaskStats[] = [];
    const dayMap = new Map<string, { created: number; completed: number; inProgress: number }>();
    
    // Initialize dates in range
    const currentDate = new Date(range.start);
    while (currentDate <= range.end) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      dayMap.set(dateStr, { created: 0, completed: 0, inProgress: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Process tasks
    tasks.forEach((task: TaskWithRelations) => {
      const createdDate = format(task.createdAt, 'yyyy-MM-dd');
      
      // Count created tasks
      const dayStats = dayMap.get(createdDate);
      if (dayStats) {
        dayStats.created++;
      }
      
      // Count completed tasks if task is done
      if (task.status === TaskStatus.DONE) {
        const completedDate = format(task.updatedAt, 'yyyy-MM-dd');
        const completedDayStats = dayMap.get(completedDate);
        if (completedDayStats) {
          completedDayStats.completed++;
        }
      }
      
      // Count in-progress tasks if task is in progress
      if (task.status === TaskStatus.IN_PROGRESS) {
        const inProgressDate = format(new Date(), 'yyyy-MM-dd');
        const inProgressDayStats = dayMap.get(inProgressDate);
        if (inProgressDayStats) {
          inProgressDayStats.inProgress++;
        }
      }
    });

    // Convert map to array
    dayMap.forEach((stats, date) => {
      byDay.push({
        date,
        ...stats
      });
    });

    // Sort by date
    byDay.sort((a, b) => a.date.localeCompare(b.date));

    // Get recent activity (last 5 updated tasks)
    const recentActivity: RecentActivity[] = [...tasks]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 5)
      .map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        updatedAt: task.updatedAt,
        assignee: task.assignee ? {
          id: task.assignee.id,
          name: task.assignee.name
        } : null
      }));

    return {
      summary: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        notStartedTasks,
        totalTimeSpent,
        averageTimePerTask,
        completionRate
      },
      byStatus,
      byPriority,
      byAssignee,
      byDay,
      dateRange: {
        start: range.start.toISOString(),
        end: range.end.toISOString()
      },
      recentActivity
    };
  }

  async getWorkloadReport(projectId: string) {
    // Define type for user with details
    type UserWithDetails = {
      id: string;
      name: string | null;
      email: string | null;
    };

    // Get all users assigned to tasks in the project
    const userAssignments = await this.prisma.task.findMany({
      where: { projectId },
      distinct: ['assigneeId'],
      include: {
        assignee: true
      }
    });
    
    const users = userAssignments
      .map((task: { assignee: UserWithDetails | null }) => task.assignee)
      .filter((user: UserWithDetails | null): user is UserWithDetails => user !== null);

    // Define type for task count result
    type TaskCountResult = {
      assigneeId: string | null;
      _count: number;
    };
    
    // Get task counts per user
    const userTaskCounts = await this.prisma.task.groupBy({
      by: ['assigneeId'],
      where: { projectId },
      _count: true
    }) as TaskCountResult[];

    // Create a map of user ID to task count
    const userTaskCountMap = userTaskCounts.reduce<Record<string, number>>((acc: Record<string, number>, item: TaskCountResult) => {
      const assigneeId = item.assigneeId;
      if (assigneeId) {
        acc[assigneeId] = item._count;
      }
      return acc;
    }, {});

    // Define type for task with workload details
    type TaskWithWorkloadDetails = Prisma.TaskGetPayload<{
      include: {
        assignee: true;
        timeLogs: true;
      };
    }>;

    // Get all tasks for the project with time logs
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: true,
        timeLogs: true,
      },
    }) as TaskWithWorkloadDetails[];

    return users.map((user: UserWithDetails) => {
      const userTasks = tasks.filter((task: TaskWithWorkloadDetails) => task.assignee?.id === user.id);
      const totalTasks = userTasks.length;
      
      const completed = userTasks.filter((task: TaskWithWorkloadDetails) => task.status === TaskStatus.DONE);
      const inProgress = userTasks.filter((task: TaskWithWorkloadDetails) => task.status === TaskStatus.IN_PROGRESS);
      const notStarted = userTasks.filter((task: TaskWithWorkloadDetails) => task.status === TaskStatus.TODO);
      
      const timeSpent = userTasks.reduce(
        (sum: number, task: TaskWithWorkloadDetails) => {
          const taskTime = task.timeLogs.reduce(
            (taskSum: number, log: { duration: number | null }) => taskSum + (log.duration || 0), 
            0
          );
          return sum + taskTime;
        },
        0
      );

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        totalTasks,
        completedTasks: completed.length,
        inProgressTasks: inProgress.length,
        notStartedTasks: notStarted.length,
        completionRate: totalTasks ? (completed.length / totalTasks) * 100 : 0,
        timeSpent: timeSpent / 3600 // Convert to hours
      };
    });
  }

  async getTaskStatusReport(projectId: string) {
    // Define the type for task with specific includes
    type TaskWithStatusDetails = Prisma.TaskGetPayload<{
      include: {
        assignee: true;
        column: true;
        labels: true;
      };
    }>;

    // Fetch tasks with proper typing
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: true,
        column: true,
        labels: true,
      },
    }) as TaskWithStatusDetails[];

    // Group by status with type safety
    const byStatus: Record<string, TaskWithStatusDetails[]> = {};
    for (const task of tasks) {
      const status = task.status;
      if (!byStatus[status]) {
        byStatus[status] = [];
      }
      byStatus[status].push(task);
    }

    // Group by priority with type safety
    const byPriority: Record<string, TaskWithStatusDetails[]> = {};
    for (const task of tasks) {
      const priority = task.priority;
      if (!byPriority[priority]) {
        byPriority[priority] = [];
      }
      byPriority[priority].push(task);
    }
    
    // Format the response with proper types
    const statusSummary: Record<string, number> = {};
    for (const [status, statusTasks] of Object.entries(byStatus)) {
      statusSummary[status] = statusTasks.length;
    }
    
    const prioritySummary: Record<string, number> = {};
    for (const [priority, priorityTasks] of Object.entries(byPriority)) {
      prioritySummary[priority] = priorityTasks.length;
    }
    
    // Group by assignee with type safety
    const byAssignee: Record<string, { user: { id: string; name: string | null; email: string | null }; tasks: TaskWithStatusDetails[] }> = {};
    for (const task of tasks) {
      if (task.assignee) {
        const userId = task.assignee.id;
        if (!byAssignee[userId]) {
          byAssignee[userId] = {
            user: task.assignee,
            tasks: [],
          };
        }
        byAssignee[userId].tasks.push(task);
      }
    }
    
    // Prepare status report data
    const statusReport = Object.entries(byStatus).map(([status, tasks]: [string, TaskWithStatusDetails[]]) => {
      return {
        status,
        count: tasks.length,
        percentage: Math.round((tasks.length / totalTasks) * 100)
      };
    });
    
    // Prepare priority report data
    const priorityReport = Object.entries(byPriority).map(([priority, tasks]: [string, TaskWithStatusDetails[]]) => {
      return {
        priority,
        count: tasks.length,
        percentage: Math.round((tasks.length / totalTasks) * 100)
      };
    });
    
    // Prepare assignee report data
    const assigneeReport = Object.entries(byAssignee).map(([userId, data]: [string, { user: { id: string; name: string | null; email: string | null }; tasks: TaskWithStatusDetails[] }]) => {
      // Create status breakdown with type safety
      const statusBreakdown: Record<string, number> = {};
      for (const status of Object.values(TaskStatus)) {
        statusBreakdown[status] = data.tasks.filter((t: TaskWithStatusDetails) => t.status === status).length;
      }

      return {
        user: data.user,
        taskCount: data.tasks.length,
        statusBreakdown
      };
    });
    
    const totalTasks = tasks.length;
    
    return {
      totalTasks,
      byStatus: statusReport,
      byPriority: priorityReport,
      byAssignee: assigneeReport,
      statusSummary,
      prioritySummary,
    };
  }
}
