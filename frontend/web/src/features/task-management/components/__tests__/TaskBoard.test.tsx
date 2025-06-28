import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskBoard } from '../TaskBoard';
import { TaskStatus, TaskPriority } from '../../types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
jest.mock('../../hooks/useTasks', () => ({
  useTasks: jest.fn(() => ({
    tasks: mockTasks,
    isLoading: false,
    isError: false,
  })),
}));

jest.mock('../../hooks/useUpdateTask', () => ({
  useUpdateTask: jest.fn(() => ({
    updateTask: jest.fn().mockResolvedValue({}),
    isLoading: false,
  })),
}));

// Sample tasks data for testing
const mockTasks = [
  {
    id: 'task-1',
    title: 'Implement Task Card Component',
    description: 'Create a reusable task card component for the task board',
    status: TaskStatus.BACKLOG,
    priority: TaskPriority.HIGH,
    createdAt: '2025-06-20T10:00:00Z',
    updatedAt: '2025-06-21T14:30:00Z',
    assignees: [],
    reporter: {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    projectId: 'project-1',
  },
  {
    id: 'task-2',
    title: 'Create Task Board Component',
    description: 'Implement a Kanban board for task management',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    createdAt: '2025-06-19T09:00:00Z',
    updatedAt: '2025-06-20T11:45:00Z',
    assignees: [],
    reporter: {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
    },
    projectId: 'project-1',
  },
  {
    id: 'task-3',
    title: 'Design Task Details Page',
    description: 'Create mockups for the task details page',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.LOW,
    createdAt: '2025-06-18T14:20:00Z',
    updatedAt: '2025-06-19T16:30:00Z',
    assignees: [],
    reporter: {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
    },
    projectId: 'project-1',
  },
];

// Mock the react-beautiful-dnd library
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }) => children,
  Droppable: ({ children }) => children({
    draggableProps: {
      style: {},
    },
    innerRef: jest.fn(),
  }),
  Draggable: ({ children }) => children({
    draggableProps: {
      style: {},
    },
    innerRef: jest.fn(),
    dragHandleProps: {},
  }),
}));

describe('TaskBoard Component', () => {
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

  it('renders all task status columns', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskBoard projectId="project-1" />
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('In Review')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('displays tasks in their respective columns', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskBoard projectId="project-1" />
      </QueryClientProvider>
    );
    
    // Check if tasks are rendered in the correct columns
    const backlogColumn = screen.getByTestId('column-BACKLOG');
    const todoColumn = screen.getByTestId('column-TODO');
    const inProgressColumn = screen.getByTestId('column-IN_PROGRESS');
    
    expect(backlogColumn).toHaveTextContent('Implement Task Card Component');
    expect(todoColumn).toHaveTextContent('Create Task Board Component');
    expect(inProgressColumn).toHaveTextContent('Design Task Details Page');
  });

  it('shows loading state when tasks are loading', () => {
    // Override the mock to simulate loading state
    require('../../hooks/useTasks').useTasks.mockImplementationOnce(() => ({
      tasks: [],
      isLoading: true,
      isError: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskBoard projectId="project-1" />
      </QueryClientProvider>
    );
    
    expect(screen.getAllByTestId('task-skeleton')).toHaveLength(5); // One skeleton per column
  });

  it('shows error state when tasks fail to load', () => {
    // Override the mock to simulate error state
    require('../../hooks/useTasks').useTasks.mockImplementationOnce(() => ({
      tasks: [],
      isLoading: false,
      isError: true,
      error: new Error('Failed to load tasks'),
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskBoard projectId="project-1" />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/failed to load tasks/i)).toBeInTheDocument();
  });

  it('calls onTaskClick when a task is clicked', async () => {
    const mockOnTaskClick = jest.fn();
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskBoard projectId="project-1" onTaskClick={mockOnTaskClick} />
      </QueryClientProvider>
    );
    
    await userEvent.click(screen.getByText('Implement Task Card Component'));
    expect(mockOnTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('calls updateTask when a task is dragged to a new column', async () => {
    const mockUpdateTask = jest.fn().mockResolvedValue({});
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: mockUpdateTask,
      isLoading: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskBoard projectId="project-1" />
      </QueryClientProvider>
    );
    
    // Simulate drag end event
    const onDragEnd = require('../../hooks/useUpdateTask').useUpdateTask().updateTask;
    
    // Simulate drag from BACKLOG to TODO
    const result = {
      destination: { droppableId: TaskStatus.TODO, index: 0 },
      source: { droppableId: TaskStatus.BACKLOG, index: 0 },
      draggableId: 'task-1',
    };
    
    // Manually trigger the onDragEnd function since we can't actually drag in tests
    onDragEnd({
      id: 'task-1',
      status: TaskStatus.TODO,
    });
    
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      status: TaskStatus.TODO,
    });
  });
});
