export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  estimatedHours?: number;
  projectId: string;
  assigneeId?: string;
  parentTaskId?: string;
  updatedAt: Date;
  createdAt: Date;
  completedAt?: Date;
  project?: Project;
  timeLogs?: TimeLog[];
  subtasks?: Task[];
  assignees?: TaskAssignee[];
  createdFromTemplate?: boolean;
}

export interface TimeLog {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  taskId: string;
  task?: Task;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  tasks?: Task[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  skills?: string[];
  assignedTasks?: Task[];
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  assignedAt: Date;
  user?: User;
  task?: Task;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}
