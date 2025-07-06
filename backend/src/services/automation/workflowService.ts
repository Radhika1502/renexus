import { PrismaClient } from '@prisma/client';
import { createLogger } from '../../utils/logger';
import { NotificationService } from '../notification';
import { EventEmitter } from 'events';

const logger = createLogger('WorkflowService');

interface WorkflowRule {
  id: string;
  name: string;
  trigger: {
    type: string;
    conditions: Record<string, any>;
  };
  actions: {
    type: string;
    params: Record<string, any>;
  }[];
}

interface WorkflowEvent {
  type: string;
  data: Record<string, any>;
  timestamp: Date;
}

export class WorkflowService extends EventEmitter {
  private rules: Map<string, WorkflowRule> = new Map();

  constructor(
    private prisma: PrismaClient,
    private notificationService: NotificationService
  ) {
    super();
    this.loadWorkflowRules();
    this.setupEventHandlers();
  }

  private async loadWorkflowRules() {
    try {
      const rules = await this.prisma.workflowRule.findMany();
      rules.forEach(rule => {
        this.rules.set(rule.id, {
          id: rule.id,
          name: rule.name,
          trigger: JSON.parse(rule.trigger),
          actions: JSON.parse(rule.actions),
        });
      });
    } catch (error) {
      logger.error('Failed to load workflow rules', { error });
    }
  }

  private setupEventHandlers() {
    // Task-related events
    this.on('task:created', this.handleTaskCreated.bind(this));
    this.on('task:updated', this.handleTaskUpdated.bind(this));
    this.on('task:completed', this.handleTaskCompleted.bind(this));
    this.on('task:overdue', this.handleTaskOverdue.bind(this));

    // Project-related events
    this.on('project:milestone', this.handleProjectMilestone.bind(this));
    this.on('project:deadline', this.handleProjectDeadline.bind(this));

    // User-related events
    this.on('user:workload', this.handleUserWorkload.bind(this));
    this.on('user:inactive', this.handleUserInactive.bind(this));
  }

  public async createWorkflowRule(rule: Omit<WorkflowRule, 'id'>): Promise<WorkflowRule> {
    try {
      const newRule = await this.prisma.workflowRule.create({
        data: {
          name: rule.name,
          trigger: JSON.stringify(rule.trigger),
          actions: JSON.stringify(rule.actions),
        },
      });

      const workflowRule = {
        id: newRule.id,
        name: newRule.name,
        trigger: JSON.parse(newRule.trigger),
        actions: JSON.parse(newRule.actions),
      };

      this.rules.set(newRule.id, workflowRule);
      return workflowRule;
    } catch (error) {
      logger.error('Failed to create workflow rule', { error, rule });
      throw error;
    }
  }

  public async processEvent(event: WorkflowEvent) {
    logger.info('Processing workflow event', { event });

    for (const rule of this.rules.values()) {
      if (this.matchesTrigger(event, rule.trigger)) {
        await this.executeActions(rule.actions, event);
      }
    }
  }

  private matchesTrigger(event: WorkflowEvent, trigger: WorkflowRule['trigger']): boolean {
    if (event.type !== trigger.type) return false;

    // Check all conditions
    return Object.entries(trigger.conditions).every(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return this.matchesCondition(event.data[key], value);
      }
      return event.data[key] === value;
    });
  }

  private matchesCondition(value: any, condition: any): boolean {
    const operator = Object.keys(condition)[0];
    const target = condition[operator];

    switch (operator) {
      case 'gt':
        return value > target;
      case 'gte':
        return value >= target;
      case 'lt':
        return value < target;
      case 'lte':
        return value <= target;
      case 'contains':
        return value.includes(target);
      case 'in':
        return target.includes(value);
      default:
        return false;
    }
  }

  private async executeActions(actions: WorkflowRule['actions'], event: WorkflowEvent) {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'createTask':
            await this.createAutomatedTask(action.params);
            break;
          case 'sendNotification':
            await this.sendAutomatedNotification(action.params);
            break;
          case 'updateStatus':
            await this.updateTaskStatus(action.params);
            break;
          case 'assignTask':
            await this.assignTask(action.params);
            break;
          case 'scheduleReminder':
            await this.scheduleReminder(action.params);
            break;
          default:
            logger.warn('Unknown action type', { action });
        }
      } catch (error) {
        logger.error('Failed to execute action', { error, action });
      }
    }
  }

  private async createAutomatedTask(params: Record<string, any>) {
    await this.prisma.task.create({
      data: {
        title: params.title,
        description: params.description,
        priority: params.priority,
        projectId: params.projectId,
        createdById: params.userId,
        assigneeId: params.assigneeId,
      },
    });
  }

  private async sendAutomatedNotification(params: Record<string, any>) {
    await this.notificationService.createNotification({
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data,
    });
  }

  private async updateTaskStatus(params: Record<string, any>) {
    await this.prisma.task.update({
      where: { id: params.taskId },
      data: { status: params.status },
    });
  }

  private async assignTask(params: Record<string, any>) {
    await this.prisma.task.update({
      where: { id: params.taskId },
      data: { assigneeId: params.userId },
    });
  }

  private async scheduleReminder(params: Record<string, any>) {
    const delay = new Date(params.date).getTime() - Date.now();
    if (delay > 0) {
      setTimeout(async () => {
        await this.sendAutomatedNotification({
          userId: params.userId,
          type: 'REMINDER',
          title: params.title,
          message: params.message,
        });
      }, delay);
    }
  }

  // Event handlers
  private async handleTaskCreated(data: any) {
    await this.processEvent({
      type: 'task:created',
      data,
      timestamp: new Date(),
    });
  }

  private async handleTaskUpdated(data: any) {
    await this.processEvent({
      type: 'task:updated',
      data,
      timestamp: new Date(),
    });
  }

  private async handleTaskCompleted(data: any) {
    await this.processEvent({
      type: 'task:completed',
      data,
      timestamp: new Date(),
    });
  }

  private async handleTaskOverdue(data: any) {
    await this.processEvent({
      type: 'task:overdue',
      data,
      timestamp: new Date(),
    });
  }

  private async handleProjectMilestone(data: any) {
    await this.processEvent({
      type: 'project:milestone',
      data,
      timestamp: new Date(),
    });
  }

  private async handleProjectDeadline(data: any) {
    await this.processEvent({
      type: 'project:deadline',
      data,
      timestamp: new Date(),
    });
  }

  private async handleUserWorkload(data: any) {
    await this.processEvent({
      type: 'user:workload',
      data,
      timestamp: new Date(),
    });
  }

  private async handleUserInactive(data: any) {
    await this.processEvent({
      type: 'user:inactive',
      data,
      timestamp: new Date(),
    });
  }
} 