import { NotificationService } from '../../services/notification';
import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  createTestUser,
  mockWebSocket 
} from '../setup';
import { PrismaClient } from '@prisma/client';

describe('NotificationService', () => {
  let prisma: PrismaClient;
  let notificationService: NotificationService;
  let mockWs: ReturnType<typeof mockWebSocket>;

  beforeAll(async () => {
    prisma = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase(prisma);
  });

  beforeEach(() => {
    mockWs = mockWebSocket();
    notificationService = new NotificationService(prisma, mockWs);
  });

  describe('createNotification', () => {
    it('should create a notification and broadcast it', async () => {
      const user = await createTestUser(prisma);
      
      const notificationData = {
        userId: user.id,
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test notification',
      };

      const notification = await notificationService.createNotification(notificationData);

      expect(notification).toMatchObject({
        ...notificationData,
        isRead: false,
      });

      expect(mockWs.broadcast).toHaveBeenCalledWith(
        'notification:new',
        expect.objectContaining(notificationData),
        [user.id]
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const user = await createTestUser(prisma);
      
      const notification = await notificationService.createNotification({
        userId: user.id,
        type: 'test',
        title: 'Test Notification',
        message: 'This is a test notification',
      });

      const updatedNotification = await notificationService.markAsRead(notification.id, user.id);

      expect(updatedNotification.isRead).toBe(true);
      expect(mockWs.broadcast).toHaveBeenCalledWith(
        'notification:updated',
        expect.objectContaining({ id: notification.id, isRead: true }),
        [user.id]
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const user = await createTestUser(prisma);
      
      // Create multiple notifications
      await Promise.all([
        notificationService.createNotification({
          userId: user.id,
          type: 'test1',
          title: 'Test 1',
          message: 'Test notification 1',
        }),
        notificationService.createNotification({
          userId: user.id,
          type: 'test2',
          title: 'Test 2',
          message: 'Test notification 2',
        }),
      ]);

      await notificationService.markAllAsRead(user.id);

      const unreadCount = await notificationService.getUnreadCount(user.id);
      expect(unreadCount).toBe(0);
      expect(mockWs.broadcast).toHaveBeenCalledWith(
        'notification:all_read',
        null,
        [user.id]
      );
    });
  });

  describe('getUserNotifications', () => {
    it('should return paginated notifications', async () => {
      const user = await createTestUser(prisma);
      
      // Create multiple notifications
      const notifications = await Promise.all(
        Array.from({ length: 25 }, (_, i) => 
          notificationService.createNotification({
            userId: user.id,
            type: `test${i}`,
            title: `Test ${i}`,
            message: `Test notification ${i}`,
          })
        )
      );

      const result = await notificationService.getUserNotifications(user.id, 1, 20);

      expect(result.notifications).toHaveLength(20);
      expect(result.total).toBe(25);
      expect(result.hasMore).toBe(true);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });
  });

  describe('Event handlers', () => {
    it('should create notification on task assignment', async () => {
      const user = await createTestUser(prisma);
      
      await notificationService.emit('task:assigned', {
        taskId: 'test-task',
        assigneeId: user.id,
        assignerName: 'Test Assigner',
      });

      const notifications = await notificationService.getUserNotifications(user.id);
      expect(notifications.notifications[0]).toMatchObject({
        type: 'task:assigned',
        title: 'New Task Assignment',
        userId: user.id,
      });
    });

    it('should create notification on task completion', async () => {
      const user = await createTestUser(prisma);
      
      await notificationService.emit('task:completed', {
        taskId: 'test-task',
        completedById: 'other-user',
        creatorId: user.id,
      });

      const notifications = await notificationService.getUserNotifications(user.id);
      expect(notifications.notifications[0]).toMatchObject({
        type: 'task:completed',
        title: 'Task Completed',
        userId: user.id,
      });
    });
  });
}); 