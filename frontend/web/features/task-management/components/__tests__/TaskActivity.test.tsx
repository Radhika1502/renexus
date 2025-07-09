import React from 'react';
import { render, screen } from '@testing-library/react';
import { TaskActivity } from '../TaskActivity';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
jest.mock('../../hooks/useTaskActivity', () => ({
  useTaskActivity: jest.fn(() => ({
    data: mockActivityItems,
    isLoading: false,
    isError: false,
  })),
}));

// Sample activity data for testing
const mockActivityItems = [
  {
    id: 'activity-1',
    type: 'create',
    user: {
      id: 'user-1',
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?u=john',
    },
    timestamp: '2025-06-20T10:00:00Z',
    details: {},
  },
  {
    id: 'activity-2',
    type: 'update',
    user: {
      id: 'user-2',
      name: 'Jane Smith',
      avatar: 'https://i.pravatar.cc/150?u=jane',
    },
    timestamp: '2025-06-21T11:30:00Z',
    details: {
      field: 'status',
      oldValue: 'TODO',
      newValue: 'IN_PROGRESS',
    },
  },
  {
    id: 'activity-3',
    type: 'comment',
    user: {
      id: 'user-1',
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?u=john',
    },
    timestamp: '2025-06-21T14:45:00Z',
    details: {
      comment: 'Started working on the implementation',
    },
  },
  {
    id: 'activity-4',
    type: 'attachment',
    user: {
      id: 'user-3',
      name: 'Alex Johnson',
      avatar: 'https://i.pravatar.cc/150?u=alex',
    },
    timestamp: '2025-06-22T09:15:00Z',
    details: {
      attachment: {
        id: 'attachment-1',
        name: 'design-mockup.png',
        type: 'image/png',
      },
    },
  },
  {
    id: 'activity-5',
    type: 'assignee',
    user: {
      id: 'user-2',
      name: 'Jane Smith',
      avatar: 'https://i.pravatar.cc/150?u=jane',
    },
    timestamp: '2025-06-22T10:30:00Z',
    details: {
      oldValue: '',
      newValue: 'John Doe',
    },
  },
];

describe('TaskActivity Component', () => {
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

  it('renders the activity timeline with grouped dates', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskActivity taskId="task-1" />
      </QueryClientProvider>
    );
    
    // Check if date groups are displayed
    expect(screen.getByText('June 20, 2025')).toBeInTheDocument();
    expect(screen.getByText('June 21, 2025')).toBeInTheDocument();
    expect(screen.getByText('June 22, 2025')).toBeInTheDocument();
  });

  it('displays different activity types with appropriate icons', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskActivity taskId="task-1" />
      </QueryClientProvider>
    );
    
    // Check for activity type icons
    const createIcon = screen.getByTestId('activity-icon-create');
    const updateIcon = screen.getByTestId('activity-icon-update');
    const commentIcon = screen.getByTestId('activity-icon-comment');
    const attachmentIcon = screen.getByTestId('activity-icon-attachment');
    const assigneeIcon = screen.getByTestId('activity-icon-assignee');
    
    expect(createIcon).toBeInTheDocument();
    expect(updateIcon).toBeInTheDocument();
    expect(commentIcon).toBeInTheDocument();
    expect(attachmentIcon).toBeInTheDocument();
    expect(assigneeIcon).toBeInTheDocument();
  });

  it('shows user information for each activity', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskActivity taskId="task-1" />
      </QueryClientProvider>
    );
    
    // Check if user names are displayed
    expect(screen.getAllByText('John Doe')).toHaveLength(2);
    expect(screen.getAllByText('Jane Smith')).toHaveLength(2);
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    
    // Check if user avatars are displayed
    const avatars = screen.getAllByRole('img');
    expect(avatars.length).toBeGreaterThanOrEqual(5); // At least one avatar per activity
  });

  it('formats activity descriptions correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskActivity taskId="task-1" />
      </QueryClientProvider>
    );
    
    // Check for specific activity descriptions
    expect(screen.getByText('created this task')).toBeInTheDocument();
    expect(screen.getByText('changed status from TODO to IN_PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('commented: Started working on the implementation')).toBeInTheDocument();
    expect(screen.getByText('added attachment design-mockup.png')).toBeInTheDocument();
    expect(screen.getByText('assigned this task to John Doe')).toBeInTheDocument();
  });

  it('shows loading state when activity is loading', () => {
    // Override the mock to simulate loading state
    require('../../hooks/useTaskActivity').useTaskActivity.mockImplementationOnce(() => ({
      data: undefined,
      isLoading: true,
      isError: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskActivity taskId="task-1" />
      </QueryClientProvider>
    );
    
    expect(screen.getByTestId('activity-loading')).toBeInTheDocument();
  });

  it('shows error state when activity fails to load', () => {
    // Override the mock to simulate error state
    require('../../hooks/useTaskActivity').useTaskActivity.mockImplementationOnce(() => ({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load activity'),
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskActivity taskId="task-1" />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/failed to load activity/i)).toBeInTheDocument();
  });

  it('displays empty state when there is no activity', () => {
    // Override the mock to return empty data
    require('../../hooks/useTaskActivity').useTaskActivity.mockImplementationOnce(() => ({
      data: [],
      isLoading: false,
      isError: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskActivity taskId="task-1" />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/no activity found/i)).toBeInTheDocument();
  });

  it('formats timestamps correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskActivity taskId="task-1" />
      </QueryClientProvider>
    );
    
    // Check for formatted timestamps (implementation-dependent)
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
    expect(screen.getByText('11:30 AM')).toBeInTheDocument();
    expect(screen.getByText('2:45 PM')).toBeInTheDocument();
    expect(screen.getByText('9:15 AM')).toBeInTheDocument();
    expect(screen.getByText('10:30 AM')).toBeInTheDocument();
  });
});
