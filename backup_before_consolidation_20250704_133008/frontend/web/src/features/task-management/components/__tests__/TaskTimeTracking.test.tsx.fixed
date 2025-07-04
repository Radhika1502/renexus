/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskTimeTracking } from '../TaskTimeTracking';
import { QueryClient, QueryClientProvider } from '../../hooks/queryHooks';
import { Task, TaskStatus, TaskPriority, User } from '../../types';
import { TaskWithTimeLog, assertTaskWithTimeLog, TimeLogEntry } from '../../utils/typeUtils';
import '@testing-library/jest-dom';

// Mock the hooks
jest.mock('../../hooks/useUpdateTask', () => ({
  useUpdateTask: jest.fn(() => ({
    updateTask: jest.fn().mockResolvedValue({}),
    isLoading: false,
  })),
}));

// Mock the current date for consistent testing
const mockDate = new Date('2025-06-25T12:00:00Z');
const RealDate = global.Date;
jest.spyOn(global, 'Date').mockImplementation((arg) => {
  return arg ? new RealDate(arg) : mockDate;
});
global.Date.now = jest.fn(() => mockDate.getTime());

// Mock user for testing
const mockUser: User = { 
  id: 'user-1', 
  name: 'John Doe', 
  email: 'john@example.com' 
};

// Create a base task object with minimal required properties
// We'll use type assertion since we're in a test environment
const mockTask = {
  id: 'task-1',
  title: 'Implement Time Tracking Component',
  description: 'Create a component for tracking time on tasks',
  status: 'IN_PROGRESS' as TaskStatus,
  priority: 'HIGH' as TaskPriority,
  createdAt: '2025-06-20T09:00:00Z',
  updatedAt: '2025-06-24T16:00:00Z',
  reporter: mockUser,
  projectId: 'project-1',
  estimatedHours: 8,
  loggedHours: 4
} as unknown as Task; // Use type assertion for testing purposes

// Create timeLog entries to use in tests
const mockTimeLog: TimeLogEntry[] = [
  {
    hours: 2,
    userId: 'user-1',
    date: '2025-06-24T09:00:00Z',
    description: 'Initial implementation',
  },
  {
    hours: 2,
    userId: 'user-1',
    date: '2025-06-24T14:00:00Z',
    description: 'Added progress bar and time formatting',
  },
];

// TaskWithTimeLog is already imported at the top of the file

describe('TaskTimeTracking Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  it('renders time tracking information correctly', () => {
    // Create a task with timeLog property using type assertion
    const taskWithTimeLog = {
      ...mockTask,
      timeLog: mockTimeLog
    } as TaskWithTimeLog;
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={taskWithTimeLog} />
      </QueryClientProvider>
    );
    
    // Check if time information is displayed
    expect(screen.getByText('4h spent')).toBeInTheDocument();
    expect(screen.getByText('4h remaining')).toBeInTheDocument();
    expect(screen.getByText('8h estimated')).toBeInTheDocument();
  });

  it('displays the progress bar with correct percentage', () => {
    // Add timeLog to the task using type assertion helper
    const taskWithTimeLog = assertTaskWithTimeLog({...mockTask, timeLog: mockTimeLog} as TaskWithTimeLog);
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={taskWithTimeLog} />
      </QueryClientProvider>
    );
    
    // Progress should be 50% (4h spent out of 8h estimated)
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('shows time log entries', () => {
    // Add timeLog to the task using type assertion helper
    const taskWithTimeLog = assertTaskWithTimeLog({...mockTask, timeLog: mockTimeLog} as TaskWithTimeLog);
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={taskWithTimeLog} />
      </QueryClientProvider>
    );
    
    // Check if time logs are displayed
    expect(screen.getByText('Initial implementation')).toBeInTheDocument();
    expect(screen.getByText('Added progress bar and time formatting')).toBeInTheDocument();
  });

  it('opens the log time dialog when "Log Time" button is clicked', async () => {
    // Add timeLog to the task using type assertion
    const taskWithTimeLog = assertTaskWithTimeLog({...mockTask, timeLog: mockTimeLog} as TaskWithTimeLog);
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={taskWithTimeLog} />
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
    
    // Create a task with time log entries using type assertion
    const taskWithTimeLog = assertTaskWithTimeLog({...mockTask, timeLog: mockTimeLog} as TaskWithTimeLog);
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={taskWithTimeLog} />
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
      timeLog: [
        expect.objectContaining({
          userId: 'user-1',
          hours: 2, // 2 hours
          description: 'Implemented unit tests',
          date: expect.any(String)
        }),
      ],
      loggedHours: 6 // 4h + 2h = 6h
    });
  });

  it('shows the start timer button when no timer is running', () => {
    // Add timeLog to the task using type assertion
    const taskWithTimeLog = assertTaskWithTimeLog({...mockTask, timeLog: mockTimeLog} as TaskWithTimeLog);
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={taskWithTimeLog} />
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Start Timer')).toBeInTheDocument();
  });

  it('shows the stop timer button when timer is running', () => {
    // Create a task with a running timer
    const runningTimerLog = [...mockTimeLog, {
      userId: 'user-1',
      startTime: '2025-06-25T11:00:00Z', // 1 hour ago
      hours: 0,
      date: '2025-06-25T11:00:00Z',
      description: 'Running timer'
    }];
    
    const taskWithRunningTimer = assertTaskWithTimeLog({...mockTask, timeLog: runningTimerLog} as TaskWithTimeLog);
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={taskWithRunningTimer} />
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
    
    // Create a task with time log entries using type assertion
    const taskWithEmptyTimeLog = assertTaskWithTimeLog({...mockTask, timeLog: []} as TaskWithTimeLog);
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={taskWithEmptyTimeLog} />
      </QueryClientProvider>
    );
    
    // Click the "Start Timer" button
    await userEvent.click(screen.getByText('Start Timer'));
    
    // Check if updateTask was called with the correct data
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      timeLog: [
        expect.objectContaining({
          userId: 'user-1',
          startTime: mockDate.toISOString(),
        }),
      ],
    });
  });

  it('calls updateTask when timer is stopped', async () => {
    const mockUpdateTask = jest.fn().mockResolvedValue({});
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: mockUpdateTask,
      isLoading: false,
    }));
    
    // Create a task with a running timer
    const runningTimerLog = [...mockTimeLog, {
      userId: 'user-1',
      startTime: '2025-06-25T11:00:00Z', // 1 hour ago
      hours: 0,
      date: '2025-06-25T11:00:00Z',
      description: 'Running timer'
    }];
    
    const taskWithRunningTimer = assertTaskWithTimeLog({...mockTask, timeLog: runningTimerLog} as TaskWithTimeLog);
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskTimeTracking task={taskWithRunningTimer} />
      </QueryClientProvider>
    );
    
    // Click the "Stop Timer" button
    await userEvent.click(screen.getByText('Stop Timer'));
    
    // Check if updateTask was called with the correct data
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      timeLog: expect.arrayContaining([
        expect.objectContaining({
          userId: 'user-1',
          hours: 1, // 1 hour
          description: expect.any(String),
          date: expect.any(String)
        })
      ]),
      loggedHours: 5 // 4h + 1h = 5h
    });
  });
});
