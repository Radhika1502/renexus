import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowAutomationService } from './workflow-automation.service';
import { PrismaService } from '../../prisma.service';
import { Task, Project, TeamMember } from '../../types/models';
import { TaskSuggestion } from './types';

// Mock data
const mockProject: Project = {
  id: 'project-1',
  title: 'Test Project',
  description: 'A test project',
  createdAt: new Date(),
  updatedAt: new Date(),
  tasks: [
    {
      id: 'task-1',
      title: 'Unassigned Task',
      description: 'This task needs assignment',
      status: 'TODO',
      projectId: 'project-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      assigneeId: null,
      timeLogs: []
    },
    {
      id: 'task-2',
      title: 'Stalled Task',
      description: 'This task is stalled',
      status: 'IN_PROGRESS',
      projectId: 'project-1',
      createdAt: new Date(),
      updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      assigneeId: 'user-1',
      timeLogs: []
    },
    {
      id: 'task-3',
      title: 'Parent Task',
      description: 'This task has subtasks',
      status: 'IN_PROGRESS',
      projectId: 'project-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      assigneeId: 'user-2',
      timeLogs: []
    }
  ]
};

const mockTeamMembers: TeamMember[] = [
  {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'DEVELOPER',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'DESIGNER',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockSubtasks: Task[] = [
  {
    id: 'subtask-1',
    title: 'Subtask 1',
    description: 'First subtask',
    status: 'COMPLETED',
    projectId: 'project-1',
    parentTaskId: 'task-3',
    createdAt: new Date(),
    updatedAt: new Date(),
    assigneeId: 'user-2',
    timeLogs: []
  },
  {
    id: 'subtask-2',
    title: 'Subtask 2',
    description: 'Second subtask',
    status: 'COMPLETED',
    projectId: 'project-1',
    parentTaskId: 'task-3',
    createdAt: new Date(),
    updatedAt: new Date(),
    assigneeId: 'user-2',
    timeLogs: []
  }
];

// Mock PrismaService
const mockPrismaService = {
  $queryRaw: jest.fn().mockImplementation((query) => {
    if (query.includes('subtasks')) {
      return Promise.resolve(mockSubtasks);
    }
    if (query.includes('team_members')) {
      return Promise.resolve(mockTeamMembers);
    }
    return Promise.resolve([]);
  }),
  task: {
    update: jest.fn().mockImplementation((data) => {
      return Promise.resolve({ ...mockProject.tasks.find(t => t.id === data.where.id), ...data.data });
    })
  }
};

describe('WorkflowAutomationService', () => {
  let service: WorkflowAutomationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowAutomationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        }
      ],
    }).compile();

    service = module.get<WorkflowAutomationService>(WorkflowAutomationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSuggestions', () => {
    it('should generate assignment suggestions for unassigned tasks', async () => {
      // Mock findBestAssignee to return a team member
      jest.spyOn(service, 'findBestAssignee').mockResolvedValue(mockTeamMembers[0]);
      
      const suggestions = await service.generateSuggestions(mockProject);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.type === 'ASSIGNMENT' && s.taskId === 'task-1')).toBeTruthy();
    });

    it('should generate prioritization suggestions for stalled tasks', async () => {
      const suggestions = await service.generateSuggestions(mockProject);
      
      expect(suggestions.some(s => s.type === 'PRIORITIZATION' && s.taskId === 'task-2')).toBeTruthy();
    });

    it('should generate status change suggestions when all subtasks are completed', async () => {
      const suggestions = await service.generateSuggestions(mockProject);
      
      expect(suggestions.some(s => s.type === 'STATUS_CHANGE' && s.taskId === 'task-3')).toBeTruthy();
    });

    it('should return empty array if project has no tasks', async () => {
      const emptyProject = { ...mockProject, tasks: [] };
      const suggestions = await service.generateSuggestions(emptyProject);
      
      expect(suggestions).toEqual([]);
    });
  });

  describe('applySuggestion', () => {
    it('should apply assignment suggestion', async () => {
      const suggestion: TaskSuggestion = {
        id: 'suggestion-1',
        type: 'ASSIGNMENT',
        taskId: 'task-1',
        suggestion: 'Assign to John Doe',
        reason: 'John has the right skills',
        data: { assigneeId: 'user-1' }
      };
      
      await service.applySuggestion(suggestion.id);
      
      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { assigneeId: 'user-1' }
      });
    });

    it('should apply status change suggestion', async () => {
      const suggestion: TaskSuggestion = {
        id: 'suggestion-2',
        type: 'STATUS_CHANGE',
        taskId: 'task-3',
        suggestion: 'Mark as completed',
        reason: 'All subtasks are completed',
        data: { status: 'COMPLETED' }
      };
      
      await service.applySuggestion(suggestion.id);
      
      expect(mockPrismaService.task.update).toHaveBeenCalledWith({
        where: { id: 'task-3' },
        data: { status: 'COMPLETED' }
      });
    });
  });

  describe('findBestAssignee', () => {
    it('should find the best assignee based on workload and expertise', async () => {
      // Mock the necessary queries
      jest.spyOn(service, 'calculateTeamMemberWorkload').mockResolvedValue([
        { member: mockTeamMembers[0], score: 5 },
        { member: mockTeamMembers[1], score: 10 }
      ]);
      
      const task = mockProject.tasks[0];
      const bestAssignee = await service.findBestAssignee(task, mockProject.id);
      
      expect(bestAssignee).toEqual(mockTeamMembers[0]);
    });

    it('should return null if no team members are available', async () => {
      // Mock empty team members
      jest.spyOn(service, 'calculateTeamMemberWorkload').mockResolvedValue([]);
      
      const task = mockProject.tasks[0];
      const bestAssignee = await service.findBestAssignee(task, mockProject.id);
      
      expect(bestAssignee).toBeNull();
    });
  });

  describe('dismissSuggestion', () => {
    it('should dismiss a suggestion', async () => {
      // This is a simple method that doesn't need complex testing
      // Just ensure it doesn't throw an error
      await expect(service.dismissSuggestion('suggestion-1')).resolves.not.toThrow();
    });
  });
});
