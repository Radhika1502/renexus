import { Task, User } from '../../types/task';
import { Project } from '../../types/project';
import { Notification } from '../../types/notification';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://ui-avatars.com/api/?name=John+Doe',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: 'https://ui-avatars.com/api/?name=Jane+Smith',
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    avatar: 'https://ui-avatars.com/api/?name=Bob+Johnson',
  },
];

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Implement User Authentication',
    description: 'Add user authentication using JWT tokens and implement secure password hashing.',
    status: 'in-progress',
    priority: 'high',
    dueDate: '2024-03-25',
    assignedTo: '1',
    projectId: '1',
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
    createdBy: '2',
    tags: ['security', 'backend'],
    comments: [
      {
        id: '1',
        taskId: '1',
        userId: '2',
        user: mockUsers[1],
        content: 'I suggest using bcrypt for password hashing.',
        createdAt: '2024-03-10T11:00:00Z',
      },
    ],
  },
  {
    id: '2',
    title: 'Design Dashboard Layout',
    description: 'Create a responsive dashboard layout using Material-UI components.',
    status: 'todo',
    priority: 'medium',
    dueDate: '2024-03-20',
    assignedTo: '2',
    projectId: '1',
    createdAt: '2024-03-10T09:00:00Z',
    updatedAt: '2024-03-10T09:00:00Z',
    createdBy: '1',
    tags: ['frontend', 'ui'],
    comments: [],
  },
];

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Task Management System',
    description: 'A modern task management system with real-time updates',
    startDate: '2024-03-01',
    endDate: '2024-06-30',
    status: 'active',
    priority: 'high',
    progress: 35,
    createdAt: '2024-03-01T08:00:00Z',
    updatedAt: '2024-03-10T15:00:00Z',
    createdBy: '1',
    teamMembers: ['1', '2', '3'],
  },
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    type: 'task',
    title: 'New Task Assigned',
    message: 'You have been assigned to implement user authentication',
    isRead: false,
    createdAt: '2024-03-10T10:00:00Z',
  },
]; 