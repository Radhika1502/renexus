import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskTimeTracking } from '../TaskTimeTracking';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
jest.mock('../../hooks/useUpdateTask', () => ({
  useUpdateTask: jest.fn(() => ({
    updateTask: jest.fn().mockResolvedValue({}),
    isLoading: false,
  })),
}));

// Mock the current date for consistent testing
const mockDate = new Date('2025-06-25T12:00:00Z');
global.Date = jest.fn(() => mockDate) as any;
global.Date.now = jest.fn(() => mockDate.getTime());

// Sample task data for testing
const mockTask = {
  id: 'task-1',
  title: 'Implement Time Tracking Component',
  timeTracking: {
    originalEstimate: 480, // 8 hours in minutes
    remainingEstimate: 240, // 4 hours in minutes
    timeSpent: 240, // 4 hours in minutes
    logs: [
      {
        id: 'log-1',
        userId: 'user-1',
        userName: 'John Doe',
        startTime: '2025-06-24T09:00:00Z',
        endTime: '2025-06-24T11:00:00Z',
        duration: 120, // 2 hours in minutes
        description: 'Initial implementation',
      },
      {
        id: 'log-2',
        userId: 'user-1',
        userName: 'John Doe',
        startTime: '2025-06-24T14:00:00Z',
        endTime: '2025-06-24T16:00:00Z',
        duration: 120, // 2 hours in minutes
        description: 'Added progress bar and time formatting',
      },
    ],
  },
};

describe('TaskTimeTracking Component', () => {
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

  it('renders time tracking information correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Check if time information is displayed
    expect(screen.getByText('4h spent')).toBeInTheDocument();
    expect(screen.getByText('4h remaining')).toBeInTheDocument();
    expect(screen.getByText('8h estimated')).toBeInTheDocument();
  });

  it('displays the progress bar with correct percentage', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Progress should be 50% (4h spent out of 8h estimated)
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('shows time log entries', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Check if time logs are displayed
    expect(screen.getByText('Initial implementation')).toBeInTheDocument();
    expect(screen.getByText('Added progress bar and time formatting')).toBeInTheDocument();
  });

  it('opens the log time dialog when "Log Time" button is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Click the "Log Time" button
    await userEvent.click(screen.getByText('Log Time'));
    
    // Check if the dialog is displayed
    expect(screen.getByText('Log Time Manually')).toBeInTheDocument();
    expect(screen.getByLabelText('Duration (hours)')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('calls updateTask when time is logged manually', async () => {
    const mockUpdateTask = jest.fn().mockResolvedValue({});
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: mockUpdateTask,
      isLoading: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Open the log time dialog
    await userEvent.click(screen.getByText('Log Time'));
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText('Duration (hours)'), '2');
    await userEvent.type(screen.getByLabelText('Description'), 'Implemented unit tests');
    
    // Submit the form
    await userEvent.click(screen.getByText('Save'));
    
    // Check if updateTask was called with the correct data
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      timeTracking: {
        ...mockTask.timeTracking,
        timeSpent: 360, // 4h + 2h = 6h = 360 minutes
        remainingEstimate: 120, // 8h - 6h = 2h = 120 minutes
        logs: [
          ...mockTask.timeTracking.logs,
          expect.objectContaining({
            userId: 'user-1',
            duration: 120, // 2h = 120 minutes
            description: 'Implemented unit tests',
          }),
        ],
      },
    });
  });

  it('shows the start timer button when no timer is running', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Start Timer')).toBeInTheDocument();
  });

  it('shows the stop timer button when timer is running', () => {
    const taskWithRunningTimer = {
      ...mockTask,
      timeTracking: {
        ...mockTask.timeTracking,
        activeTimers: [
          {
            userId: 'user-1',
            startTime: '2025-06-25T11:00:00Z', // 1 hour ago
          },
        ],
      },
    };
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={taskWithRunningTimer} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Stop Timer')).toBeInTheDocument();
    expect(screen.getByText('01:00:00')).toBeInTheDocument(); // 1 hour elapsed
  });

  it('calls updateTask when timer is started', async () => {
    const mockUpdateTask = jest.fn().mockResolvedValue({});
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: mockUpdateTask,
      isLoading: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Click the "Start Timer" button
    await userEvent.click(screen.getByText('Start Timer'));
    
    // Check if updateTask was called with the correct data
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      timeTracking: {
        ...mockTask.timeTracking,
        activeTimers: [
          expect.objectContaining({
            userId: 'user-1',
            startTime: mockDate.toISOString(),
          }),
        ],
      },
    });
  });

  it('calls updateTask when timer is stopped', async () => {
    const mockUpdateTask = jest.fn().mockResolvedValue({});
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: mockUpdateTask,
      isLoading: false,
    }));
    
    const taskWithRunningTimer = {
      ...mockTask,
      timeTracking: {
        ...mockTask.timeTracking,
        activeTimers: [
          {
            userId: 'user-1',
            startTime: '2025-06-25T11:00:00Z', // 1 hour ago
          },
        ],
      },
    };
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={taskWithRunningTimer} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Click the "Stop Timer" button
    await userEvent.click(screen.getByText('Stop Timer'));
    
    // Check if updateTask was called with the correct data
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      timeTracking: {
        ...taskWithRunningTimer.timeTracking,
        timeSpent: 300, // 4h + 1h = 5h = 300 minutes
        remainingEstimate: 180, // 8h - 5h = 3h = 180 minutes
        activeTimers: [],
        logs: [
          ...taskWithRunningTimer.timeTracking.logs,
          expect.objectContaining({
            userId: 'user-1',
            startTime: '2025-06-25T11:00:00Z',
            endTime: mockDate.toISOString(),
            duration: 60, // 1h = 60 minutes
          }),
        ],
      },
    });
  });
});
