import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskDetails } from '../TaskDetails';
import { TaskStatus, TaskPriority } from '../../types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
jest.mock('../../hooks/useTask', () => ({
  useTask: jest.fn(() => ({
    data: mockTask,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  })),
}));

jest.mock('../../hooks/useUpdateTask', () => ({
  useUpdateTask: jest.fn(() => ({
    updateTask: jest.fn().mockResolvedValue({}),
    isLoading: false,
  })),
}));

jest.mock('../../hooks/useTaskComments', () => ({
  useTaskComments: jest.fn(() => ({
    comments: mockComments,
    isLoading: false,
    isError: false,
    addComment: jest.fn().mockResolvedValue({}),
    updateComment: jest.fn().mockResolvedValue({}),
    deleteComment: jest.fn().mockResolvedValue({}),
  })),
}));

jest.mock('../../hooks/useAITaskInsights', () => ({
  useAITaskInsights: jest.fn(() => ({
    data: {
      summary: 'This task involves creating a detailed view component for tasks.',
      estimatedEffort: 'Medium',
      suggestedLabels: ['UI', 'Frontend'],
      similarTasks: [
        { id: 'task-5', title: 'Implement Task Form Component' },
      ],
    },
    isLoading: false,
    isError: false,
  })),
}));

jest.mock('../../../contexts/WebSocketContext', () => ({
  useWebSocket: jest.fn(() => ({
    socket: { addEventListener: jest.fn() },
    sendMessage: jest.fn(),
  })),
}));

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: { id: 'task-1' },
  }),
}));

// Sample task data for testing
const mockTask = {
  id: 'task-1',
  title: 'Implement Task Details Component',
  description: 'Create a detailed view component for tasks with tabs for details, comments, attachments, and activity',
  status: TaskStatus.IN_PROGRESS,
  priority: TaskPriority.HIGH,
  createdAt: '2025-06-20T10:00:00Z',
  updatedAt: '2025-06-21T14:30:00Z',
  dueDate: '2025-06-30T23:59:59Z',
  startDate: '2025-06-22T09:00:00Z',
  assignees: [
    {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'https://i.pravatar.cc/150?u=john',
    },
  ],
  reporter: {
    id: 'user-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    avatar: 'https://i.pravatar.cc/150?u=jane',
  },
  projectId: 'project-1',
  project: {
    id: 'project-1',
    name: 'Renexus Web App',
    key: 'REN',
  },
  labels: [
    { id: 'label-1', name: 'Frontend', color: '#0ea5e9' },
    { id: 'label-2', name: 'UI', color: '#8b5cf6' },
  ],
  attachments: 2,
  comments: 3,
  timeTracking: {
    originalEstimate: 480, // 8 hours in minutes
    remainingEstimate: 240, // 4 hours in minutes
    timeSpent: 240, // 4 hours in minutes
  },
};

// Sample comments data for testing
const mockComments = [
  {
    id: 'comment-1',
    content: 'Let\'s make sure we include all the necessary tabs in this component.',
    author: {
      id: 'user-2',
      name: 'Jane Smith',
      avatar: 'https://i.pravatar.cc/150?u=jane',
    },
    createdAt: '2025-06-21T10:15:00Z',
    updatedAt: '2025-06-21T10:15:00Z',
  },
  {
    id: 'comment-2',
    content: 'I\'ve started working on the details tab implementation.',
    author: {
      id: 'user-1',
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?u=john',
    },
    createdAt: '2025-06-22T09:30:00Z',
    updatedAt: '2025-06-22T09:30:00Z',
  },
  {
    id: 'comment-3',
    content: 'The comments section should support markdown and mentions.',
    author: {
      id: 'user-3',
      name: 'Alex Johnson',
      avatar: 'https://i.pravatar.cc/150?u=alex',
    },
    createdAt: '2025-06-23T14:45:00Z',
    updatedAt: '2025-06-23T14:45:00Z',
  },
];

describe('TaskDetails Component', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  it('renders the task title and description', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetails taskId="task-1" />
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Implement Task Details Component')).toBeInTheDocument();
    expect(screen.getByText('Create a detailed view component for tasks with tabs for details, comments, attachments, and activity')).toBeInTheDocument();
  });

  it('displays all tabs correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetails taskId="task-1" />
      </QueryClientProvider>
    );
    
    expect(screen.getByRole('tab', { name: /details/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /comments/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /attachments/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /activity/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /ai insights/i })).toBeInTheDocument();
  });

  it('shows task metadata including status, priority, and dates', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetails taskId="task-1" />
      </QueryClientProvider>
    );
    
    expect(screen.getByText('In Progress')).toBeInTheDocument(); // Status
    expect(screen.getByText('High')).toBeInTheDocument(); // Priority
    
    // Check for dates in various formats (implementation-dependent)
    const dueDate = screen.getByText(/Jun 30/);
    expect(dueDate).toBeInTheDocument();
    
    const startDate = screen.getByText(/Jun 22/);
    expect(startDate).toBeInTheDocument();
  });

  it('displays assignee and reporter information', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetails taskId="task-1" />
      </QueryClientProvider>
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument(); // Assignee
    expect(screen.getByText('Jane Smith')).toBeInTheDocument(); // Reporter
  });

  it('shows comments when comments tab is selected', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetails taskId="task-1" />
      </QueryClientProvider>
    );
    
    // Click on the comments tab
    await userEvent.click(screen.getByRole('tab', { name: /comments/i }));
    
    // Check if comments are displayed
    expect(screen.getByText('Let\'s make sure we include all the necessary tabs in this component.')).toBeInTheDocument();
    expect(screen.getByText('I\'ve started working on the details tab implementation.')).toBeInTheDocument();
    expect(screen.getByText('The comments section should support markdown and mentions.')).toBeInTheDocument();
  });

  it('shows AI insights when AI insights tab is selected', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetails taskId="task-1" />
      </QueryClientProvider>
    );
    
    // Click on the AI insights tab
    await userEvent.click(screen.getByRole('tab', { name: /ai insights/i }));
    
    // Check if AI insights are displayed
    expect(screen.getByText('This task involves creating a detailed view component for tasks.')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument(); // Estimated effort
    expect(screen.getByText('Implement Task Form Component')).toBeInTheDocument(); // Similar task
  });

  it('shows loading state when task is loading', () => {
    // Override the mock to simulate loading state
    require('../../hooks/useTask').useTask.mockImplementationOnce(() => ({
      data: null,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetails taskId="task-1" />
      </QueryClientProvider>
    );
    
    expect(screen.getByTestId('task-details-skeleton')).toBeInTheDocument();
  });

  it('shows error state when task fails to load', () => {
    // Override the mock to simulate error state
    require('../../hooks/useTask').useTask.mockImplementationOnce(() => ({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load task'),
      refetch: jest.fn(),
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetails taskId="task-1" />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/failed to load task/i)).toBeInTheDocument();
  });

  it('calls updateTask when task status is changed', async () => {
    const mockUpdateTask = jest.fn().mockResolvedValue({});
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: mockUpdateTask,
      isLoading: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetails taskId="task-1" />
      </QueryClientProvider>
    );
    
    // Open the status dropdown
    await userEvent.click(screen.getByText('In Progress'));
    
    // Select a new status
    await userEvent.click(screen.getByText('Done'));
    
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      status: TaskStatus.DONE,
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const mockOnClose = jest.fn();
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDetails taskId="task-1" onClose={mockOnClose} />
      </QueryClientProvider>
    );
    
    // Click the close button
    await userEvent.click(screen.getByLabelText(/close/i));
    
    expect(mockOnClose).toHaveBeenCalled();
  });
});
