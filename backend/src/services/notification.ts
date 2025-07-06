import { EventEmitter } from 'events';
import { WebSocketServer } from './websocket';
import { PrismaClient } from '@prisma/client';

interface NotificationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export class NotificationService extends EventEmitter {
  constructor(
    private prisma: PrismaClient,
    private wss: WebSocketServer
  ) {
    super();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Listen for various events that should trigger notifications
    this.on('task:assigned', this.handleTaskAssigned.bind(this));
    this.on('task:completed', this.handleTaskCompleted.bind(this));
    this.on('task:commented', this.handleTaskCommented.bind(this));
    this.on('project:member:added', this.handleProjectMemberAdded.bind(this));
    this.on('mention:created', this.handleMention.bind(this));
  }

  public async createNotification(data: Omit<NotificationData, 'id' | 'createdAt' | 'isRead'>) {
    const notification = await this.prisma.notification.create({
      data: {
        ...data,
        isRead: false,
      },
    });

    // Emit event for real-time updates
    this.emit('notification:created', notification);

    // Send real-time notification
    this.wss.broadcast('notification:new', notification, [notification.userId]);

    return notification;
  }

  public async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });

    this.wss.broadcast('notification:updated', notification, [userId]);
    return notification;
  }

  public async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    this.wss.broadcast('notification:all_read', null, [userId]);
  }

  public async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  public async getUserNotifications(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ) {
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({
        where: { userId },
      }),
    ]);

    return {
      notifications,
      total,
      page,
      pageSize,
      hasMore: total > page * pageSize,
    };
  }

  private async handleTaskAssigned(data: { taskId: string; assigneeId: string; assignerName: string }) {
    await this.createNotification({
      userId: data.assigneeId,
      type: 'task:assigned',
      title: 'New Task Assignment',
      message: `${data.assignerName} assigned you a task`,
      data: { taskId: data.taskId },
    });
  }

  private async handleTaskCompleted(data: { taskId: string; completedById: string; creatorId: string }) {
    await this.createNotification({
      userId: data.creatorId,
      type: 'task:completed',
      title: 'Task Completed',
      message: 'Your task has been marked as completed',
      data: { taskId: data.taskId },
    });
  }

  private async handleTaskCommented(data: { taskId: string; commenterId: string; assigneeId: string }) {
    if (data.assigneeId !== data.commenterId) {
      await this.createNotification({
        userId: data.assigneeId,
        type: 'task:commented',
        title: 'New Comment',
        message: 'Someone commented on your task',
        data: { taskId: data.taskId },
      });
    }
  }

  private async handleProjectMemberAdded(data: { projectId: string; userId: string; addedBy: string }) {
    await this.createNotification({
      userId: data.userId,
      type: 'project:member:added',
      title: 'Added to Project',
      message: `You were added to a project by ${data.addedBy}`,
      data: { projectId: data.projectId },
    });
  }

  private async handleMention(data: { userId: string; sourceType: string; sourceId: string; mentionedBy: string }) {
    await this.createNotification({
      userId: data.userId,
      type: 'mention:created',
      title: 'New Mention',
      message: `${data.mentionedBy} mentioned you`,
      data: {
        sourceType: data.sourceType,
        sourceId: data.sourceId,
      },
    });
  }
} 