import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowAutomationService } from './workflow-automation.service';
import { PrismaService } from '@renexus/shared';
import { Task, Project, TeamMember } from '@renexus/shared';

// Mock data
const mockProject: Project = {
  id: 'project-1',
  name: 'Test Project',
  description: 'Test Description',
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Test Task 1',
    description: 'Test Description',
    status: 'TODO',
    priority: 'MEDIUM',
    projectId: 'project-1',
    assigneeId: null,
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    timeLogs: []
  } as any,
  {
    id: 'task-2',
    title: 'Test Task 2',
    description: 'Test Description',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    projectId: 'project-1',
    assigneeId: 'user-1',
    dueDate: new Date(Date.now() + 86400000), // Tomorrow
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
    timeLogs: [{ duration: 2 }]
  } as any
];

const mockTeamMembers: TeamMember[] = [
  {
    userId: 'user-1',
    user: {
      id: 'user-1',
      name: 'Test User 1',
      email: 'test1@example.com'
    },
    projectId: 'project-1',
    role: 'DEVELOPER',
    assignedTasks: []
  } as any
];

describe('WorkflowAutomationService', () => {
  let service: WorkflowAutomationService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowAutomationService,
        {
          provide: PrismaService,
          useValue: {
            task: {
              findMany: jest.fn().mockResolvedValue(mockTasks),
              update: jest.fn(),
              create: jest.fn()
            },
            teamMember: {
              findMany: jest.fn().mockResolvedValue(mockTeamMembers)
            },
            workflowRule: {
              findMany: jest.fn().mockResolvedValue([]),
              count: jest.fn().mockResolvedValue(0),
              groupBy: jest.fn().mockResolvedValue([])
            },
            workflowExecution: {
              findFirst: jest.fn().mockResolvedValue(null)
            }
          }
        }
      ]
    }).compile();

    service = module.get<WorkflowAutomationService>(WorkflowAutomationService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSuggestions', () => {
    it('should generate suggestions for unassigned tasks', async () => {
      const suggestions = await service.generateSuggestions(mockProject);
      const unassignedSuggestions = suggestions.filter(s => s.type === 'ASSIGNMENT');
      
      expect(unassignedSuggestions.length).toBeGreaterThan(0);
      expect(unassignedSuggestions[0].taskId).toBe('task-1');
      expect(unassignedSuggestions[0].suggestedAction).toContain('Test User 1');
    });

    it('should generate suggestions for stalled tasks', async () => {
      const suggestions = await service.generateSuggestions(mockProject);
      const stalledSuggestions = suggestions.filter(s => s.type === 'PRIORITIZATION');
      
      expect(stalledSuggestions.length).toBeGreaterThan(0);
      expect(stalledSuggestions[0].taskId).toBe('task-2');
      expect(stalledSuggestions[0].priority).toBe('HIGH');
    });
  });

  describe('applyAutomationRules', () => {
    it('should apply rules when conditions are met', async () => {
      const task = { ...mockTasks[0], status: 'TODO' };
      
      // Mock the rule evaluation
      jest.spyOn(service as any, 'evaluateConditions').mockResolvedValue(true);
      
      await service.applyAutomationRules(task as any);
      
      // Verify that the action was executed
      expect(prisma.task.update).toHaveBeenCalled();
    });
  });

  describe('getAutomationStats', () => {
    it('should return automation statistics', async () => {
      const stats = await service.getAutomationStats();
      
      expect(stats).toBeDefined();
      expect(stats.totalRules).toBeDefined();
      expect(stats.activeRules).toBeDefined();
      expect(stats.lastExecution).toBeNull();
    });
  });
});
