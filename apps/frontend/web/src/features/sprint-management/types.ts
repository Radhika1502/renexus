export interface Sprint {
  id: string;
  name: string;
  projectId: string;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  goal?: string;
  createdAt: string;
  updatedAt: string;
}

export enum SprintStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface CreateSprintDto {
  name: string;
  projectId: string;
  startDate: string;
  endDate: string;
  goal?: string;
}

export interface UpdateSprintDto {
  name?: string;
  startDate?: string;
  endDate?: string;
  status?: SprintStatus;
  goal?: string;
}

export interface SprintTask {
  id: string;
  sprintId: string;
  taskId: string;
  addedAt: string;
  task: {
    id: string;
    title: string;
    status: string;
    priority: string;
    assigneeId?: string;
    assignee?: {
      id: string;
      name: string;
      avatar?: string;
    };
  };
}

export interface AddTaskToSprintDto {
  taskId: string;
}

export interface SprintStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  completionPercentage: number;
  burndownData: {
    date: string;
    remainingTasks: number;
    idealLine: number;
  }[];
}

export interface SprintVelocity {
  sprintId: string;
  sprintName: string;
  plannedPoints: number;
  completedPoints: number;
}
