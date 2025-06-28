import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskDependencies } from '../TaskDependencies';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
jest.mock('../../hooks/useUpdateTask', () => ({
  useUpdateTask: jest.fn(() => ({
    updateTask: jest.fn().mockResolvedValue({}),
    isLoading: false,
  })),
}));

jest.mock('../../hooks/useTasks', () => ({
  useTasks: jest.fn(() => ({
    tasks: mockProjectTasks,
    isLoading: false,
    isError: false,
  })),
}));

// Sample task data for testing
const mockTask = {
  id: 'task-1',
  title: 'Implement Task Dependencies Component',
  description: 'Create a component for managing task dependencies',
  projectId: 'project-1',
  dependencies: ['task-2', 'task-3'],
  parentTaskId: 'task-4',
  relatedTasks: ['task-5'],
};

// Sample project tasks data for testing
const mockProjectTasks = [
  {
    id: 'task-1',
    title: 'Implement Task Dependencies Component',
    description: 'Create a component for managing task dependencies',
    projectId: 'project-1',
  },
  {
    id: 'task-2',
    title: 'Design Task Dependencies UI',
    description: 'Create mockups for the task dependencies UI',
    projectId: 'project-1',
  },
  {
    id: 'task-3',
    title: 'Create Task Dependencies API',
    description: 'Implement backend API for task dependencies',
    projectId: 'project-1',
  },
  {
    id: 'task-4',
    title: 'Task Management Epic',
    description: 'Epic for all task management features',
    projectId: 'project-1',
  },
  {
    id: 'task-5',
    title: 'Task Dependencies Documentation',
    description: 'Write documentation for task dependencies',
    projectId: 'project-1',
  },
  {
    id: 'task-6',
    title: 'Task Dependencies Testing',
    description: 'Write tests for task dependencies',
    projectId: 'project-1',
  },
];

describe('TaskDependencies Component', () => {
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

  it('renders dependencies section with correct title', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDependencies task={mockTask} />
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Dependencies')).toBeInTheDocument();
    expect(screen.getByText('Parent Task')).toBeInTheDocument();
    expect(screen.getByText('Related Tasks')).toBeInTheDocument();
  });

  it('displays existing dependencies correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDependencies task={mockTask} />
      </QueryClientProvider>
    );
    
    // Check if dependency tasks are displayed
    expect(screen.getByText('Design Task Dependencies UI')).toBeInTheDocument();
    expect(screen.getByText('Create Task Dependencies API')).toBeInTheDocument();
  });

  it('displays parent task correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDependencies task={mockTask} />
      </QueryClientProvider>
    );
    
    // Check if parent task is displayed
    expect(screen.getByText('Task Management Epic')).toBeInTheDocument();
  });

  it('displays related tasks correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDependencies task={mockTask} />
      </QueryClientProvider>
    );
    
    // Check if related tasks are displayed
    expect(screen.getByText('Task Dependencies Documentation')).toBeInTheDocument();
  });

  it('shows loading state when project tasks are loading', () => {
    // Override the mock to simulate loading state
    require('../../hooks/useTasks').useTasks.mockImplementationOnce(() => ({
      tasks: [],
      isLoading: true,
      isError: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDependencies task={mockTask} />
      </QueryClientProvider>
    );
    
    expect(screen.getAllByTestId('dependency-loading')).toHaveLength(3); // One for each section
  });

  it('shows error state when project tasks fail to load', () => {
    // Override the mock to simulate error state
    require('../../hooks/useTasks').useTasks.mockImplementationOnce(() => ({
      tasks: [],
      isLoading: false,
      isError: true,
      error: new Error('Failed to load tasks'),
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDependencies task={mockTask} />
      </QueryClientProvider>
    );
    
    expect(screen.getAllByText(/failed to load tasks/i)).toHaveLength(3); // One for each section
  });

  it('opens add dependency dialog when add button is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDependencies task={mockTask} />
      </QueryClientProvider>
    );
    
    // Click the add dependency button
    await userEvent.click(screen.getByLabelText('Add dependency'));
    
    // Check if the dialog is displayed
    expect(screen.getByText('Add Dependency')).toBeInTheDocument();
    
    // Check if available tasks are displayed (excluding current task and existing dependencies)
    expect(screen.getByText('Task Dependencies Testing')).toBeInTheDocument();
    expect(screen.queryByText('Design Task Dependencies UI')).not.toBeInTheDocument(); // Already a dependency
  });

  it('calls updateTask when a dependency is added', async () => {
    const mockUpdateTask = jest.fn().mockResolvedValue({});
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: mockUpdateTask,
      isLoading: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDependencies task={mockTask} />
      </QueryClientProvider>
    );
    
    // Click the add dependency button
    await userEvent.click(screen.getByLabelText('Add dependency'));
    
    // Select a task
    await userEvent.click(screen.getByText('Task Dependencies Testing'));
    
    // Click the add button
    await userEvent.click(screen.getByText('Add'));
    
    // Check if updateTask was called with the correct data
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      dependencies: ['task-2', 'task-3', 'task-6'],
    });
  });

  it('calls updateTask when a dependency is removed', async () => {
    const mockUpdateTask = jest.fn().mockResolvedValue({});
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: mockUpdateTask,
      isLoading: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDependencies task={mockTask} />
      </QueryClientProvider>
    );
    
    // Click the remove button for the first dependency
    await userEvent.click(screen.getAllByLabelText('Remove dependency')[0]);
    
    // Check if updateTask was called with the correct data
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      dependencies: ['task-3'],
    });
  });

  it('calls updateTask when parent task is changed', async () => {
    const mockUpdateTask = jest.fn().mockResolvedValue({});
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: mockUpdateTask,
      isLoading: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDependencies task={mockTask} />
      </QueryClientProvider>
    );
    
    // Click the change parent task button
    await userEvent.click(screen.getByLabelText('Change parent task'));
    
    // Select a different parent task
    await userEvent.click(screen.getByText('Task Dependencies Documentation'));
    
    // Check if updateTask was called with the correct data
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      parentTaskId: 'task-5',
    });
  });

  it('calls updateTask when parent task is removed', async () => {
    const mockUpdateTask = jest.fn().mockResolvedValue({});
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: mockUpdateTask,
      isLoading: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDependencies task={mockTask} />
      </QueryClientProvider>
    );
    
    // Click the remove parent task button
    await userEvent.click(screen.getByLabelText('Remove parent task'));
    
    // Check if updateTask was called with the correct data
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      parentTaskId: null,
    });
  });

  it('calls updateTask when a related task is added', async () => {
    const mockUpdateTask = jest.fn().mockResolvedValue({});
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: mockUpdateTask,
      isLoading: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDependencies task={mockTask} />
      </QueryClientProvider>
    );
    
    // Click the add related task button
    await userEvent.click(screen.getByLabelText('Add related task'));
    
    // Select a task
    await userEvent.click(screen.getByText('Task Dependencies Testing'));
    
    // Click the add button
    await userEvent.click(screen.getByText('Add'));
    
    // Check if updateTask was called with the correct data
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      relatedTasks: ['task-5', 'task-6'],
    });
  });

  it('calls updateTask when a related task is removed', async () => {
    const mockUpdateTask = jest.fn().mockResolvedValue({});
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: mockUpdateTask,
      isLoading: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDependencies task={mockTask} />
      </QueryClientProvider>
    );
    
    // Click the remove button for the related task
    await userEvent.click(screen.getByLabelText('Remove related task'));
    
    // Check if updateTask was called with the correct data
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      relatedTasks: [],
    });
  });

  it('shows empty state when there are no dependencies', () => {
    const taskWithNoDependencies = {
      ...mockTask,
      dependencies: [],
      parentTaskId: null,
      relatedTasks: [],
    };
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDependencies task={taskWithNoDependencies} />
      </QueryClientProvider>
    );
    
    expect(screen.getByText('No dependencies')).toBeInTheDocument();
    expect(screen.getByText('No parent task')).toBeInTheDocument();
    expect(screen.getByText('No related tasks')).toBeInTheDocument();
  });

  it('disables add dependency button when all tasks are already dependencies', () => {
    // Create a task that already has all other tasks as dependencies
    const taskWithAllDependencies = {
      ...mockTask,
      dependencies: ['task-2', 'task-3', 'task-4', 'task-5', 'task-6'],
    };
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskDependencies task={taskWithAllDependencies} />
      </QueryClientProvider>
    );
    
    // The add dependency button should be disabled
    const addButton = screen.getByLabelText('Add dependency');
    expect(addButton).toBeDisabled();
  });
});
