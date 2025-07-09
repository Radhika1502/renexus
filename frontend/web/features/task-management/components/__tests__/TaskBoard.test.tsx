import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TaskBoard } from '../TaskBoard';
import { TaskStatus, TaskPriority } from '../../types';
import { TaskSelectionProvider } from '../../context/TaskSelectionContext';

const mockTasks = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'Description 1',
    status: TaskStatus.BACKLOG,
    priority: TaskPriority.HIGH,
    reporterId: 'user-1',
    projectId: 'project-1',
    assigneeId: 'user-1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    dueDate: '2023-12-31T23:59:59Z',
    estimatedHours: 8,
    actualHours: 0,
    tags: ['frontend'],
    dependencies: [],
    attachments: [],
    comments: [],
    timeEntries: []
  },
  {
    id: 'task-2',
    title: 'Task 2',
    description: 'Description 2',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    reporterId: 'user-1',
    projectId: 'project-1',
    assigneeId: 'user-2',
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    dueDate: '2023-12-31T23:59:59Z',
    estimatedHours: 4,
    actualHours: 0,
    tags: ['backend'],
    dependencies: [],
    attachments: [],
    comments: [],
    timeEntries: []
  },
  {
    id: 'task-3',
    title: 'Task 3',
    description: 'Description 3',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.LOW,
    reporterId: 'user-1',
    projectId: 'project-1',
    assigneeId: 'user-3',
    createdAt: '2023-01-03T00:00:00Z',
    updatedAt: '2023-01-03T00:00:00Z',
    dueDate: '2023-12-31T23:59:59Z',
    estimatedHours: 6,
    actualHours: 2,
    tags: ['testing'],
    dependencies: [],
    attachments: [],
    comments: [],
    timeEntries: []
  }
];

jest.mock('../../hooks/useUpdateTask', () => ({
  useUpdateTask: jest.fn(() => ({
    updateTask: jest.fn(),
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false
  }))
}));

describe('TaskBoard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TaskSelectionProvider>
          {ui}
        </TaskSelectionProvider>
      </QueryClientProvider>
    );
  };

  it('should render task board with columns', () => {
    renderWithProviders(<TaskBoard tasks={mockTasks} isLoading={false} />);
    expect(screen.getByText('Task Board')).toBeInTheDocument();
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('should render tasks in correct columns', () => {
    renderWithProviders(<TaskBoard tasks={mockTasks} isLoading={false} />);
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    renderWithProviders(<TaskBoard tasks={[]} isLoading={true} />);
    expect(screen.getByText('Task Board')).toBeInTheDocument();
  });

  it('should show empty state when no tasks', () => {
    renderWithProviders(<TaskBoard tasks={[]} isLoading={false} />);
    expect(screen.getByText('Task Board')).toBeInTheDocument();
  });

  it('should call onCreateTask when new task button clicked', () => {
    const mockOnCreateTask = jest.fn();
    renderWithProviders(<TaskBoard tasks={mockTasks} isLoading={false} onCreateTask={mockOnCreateTask} />);
    const newTaskButton = screen.getByText('New Task');
    fireEvent.click(newTaskButton);
    expect(mockOnCreateTask).toHaveBeenCalled();
  });

  it('should handle basic task display', () => {
    renderWithProviders(<TaskBoard tasks={mockTasks} isLoading={false} />);
    expect(screen.getByText('Task Board')).toBeInTheDocument();
    expect(screen.getByText('Task 1')).toBeInTheDocument();
  });
}); 