import { WebSocketServer } from './websocket';
import { TaskService } from './task';
import { ProjectService } from './project';
import { NotificationService } from './notification';

export class WebSocketEventHandler {
  constructor(
    private wss: WebSocketServer,
    private taskService: TaskService,
    private projectService: ProjectService,
    private notificationService: NotificationService
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Task events
    this.taskService.on('task:created', (task) => {
      this.wss.broadcast('task:created', task, this.getTaskSubscribers(task));
    });

    this.taskService.on('task:updated', (task) => {
      this.wss.broadcast('task:updated', task, this.getTaskSubscribers(task));
    });

    this.taskService.on('task:deleted', (task) => {
      this.wss.broadcast('task:deleted', task, this.getTaskSubscribers(task));
    });

    this.taskService.on('task:comment:added', (data) => {
      this.wss.broadcast('task:comment:added', data, this.getTaskSubscribers(data.task));
    });

    // Project events
    this.projectService.on('project:updated', (project) => {
      this.wss.broadcast('project:updated', project, this.getProjectSubscribers(project));
    });

    this.projectService.on('project:member:added', (data) => {
      this.wss.broadcast('project:member:added', data, this.getProjectSubscribers(data.project));
    });

    this.projectService.on('project:member:removed', (data) => {
      this.wss.broadcast('project:member:removed', data, this.getProjectSubscribers(data.project));
    });

    // Notification events
    this.notificationService.on('notification:created', (notification) => {
      this.wss.broadcast('notification:created', notification, [notification.userId]);
    });

    // Handle collaborative editing
    this.wss.on('task:edit:start', ({ userId, data }) => {
      this.wss.broadcast('task:edit:started', { userId, taskId: data.taskId }, 
        this.getTaskSubscribers(data));
    });

    this.wss.on('task:edit:end', ({ userId, data }) => {
      this.wss.broadcast('task:edit:ended', { userId, taskId: data.taskId }, 
        this.getTaskSubscribers(data));
    });
  }

  private getTaskSubscribers(task: any): string[] {
    // Get all users who should receive updates about this task
    // This includes:
    // - Task assignee
    // - Project members
    // - Task watchers
    const subscribers = new Set<string>();

    if (task.assigneeId) {
      subscribers.add(task.assigneeId);
    }

    if (task.createdById) {
      subscribers.add(task.createdById);
    }

    // Add project members (in a real implementation, fetch from project service)
    const projectMembers = this.projectService.getProjectMembers(task.projectId);
    projectMembers.forEach((member) => subscribers.add(member.userId));

    return Array.from(subscribers);
  }

  private getProjectSubscribers(project: any): string[] {
    // Get all project members who should receive project updates
    return this.projectService.getProjectMembers(project.id)
      .map((member) => member.userId);
  }
} 