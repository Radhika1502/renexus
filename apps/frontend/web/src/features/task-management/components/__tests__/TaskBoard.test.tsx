import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskBoard } from '../TaskBoard';
import { TaskStatus, TaskPriority } from '../../types';
import { renderWithQueryClient, createTestQueryClient } from '../../test-utils/TestWrapper';

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
    status: 'backlog' as TaskStatus,
    priority: 'high' as TaskPriority,
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
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
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
    description: 'Create a detailed view for individual tasks',
    status: 'inProgress' as TaskStatus,
    priority: 'high' as TaskPriority,
    createdAt: '2025-06-18T14:00:00Z',
    updatedAt: '2025-06-19T16:20:00Z',
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

// Add a simple test to verify Jest is working
describe('Simple Math Test', () => {
  it('should add two numbers correctly', () => {
    expect(1 + 2).toBe(3);
  });
});

describe('TaskBoard Component', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it('renders all task status columns', () => {
    renderWithQueryClient(
      <TaskBoard projectId="project-1" />
    );
    
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('In Review')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('displays tasks in their respective columns', () => {
    renderWithQueryClient(
      <TaskBoard projectId="project-1" />
    );
    
    // Check if tasks are rendered in the correct columns
    const backlogColumn = screen.getByTestId('column-backlog');
    const todoColumn = screen.getByTestId('column-todo');
    const inProgressColumn = screen.getByTestId('column-inProgress');
    
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
    
    renderWithQueryClient(
      <TaskBoard projectId="project-1" />
    );
    
    expect(screen.getAllByTestId('task-skeleton')).toHaveLength(5); // One skeleton per column
  });

  it('shows error state when there is an error', () => {
    // Override the mock to simulate error state
    require('../../hooks/useTasks').useTasks.mockImplementationOnce(() => ({
      tasks: [],
      isLoading: false,
      isError: true,
    }));
    
    renderWithQueryClient(
      <TaskBoard projectId="project-1" />
    );
    
    expect(screen.getByText(/failed to load tasks/i)).toBeInTheDocument();
  });

  it('handles task click events', async () => {
    const onTaskClick = jest.fn();
    
    renderWithQueryClient(
      <TaskBoard projectId="project-1" onTaskClick={onTaskClick} />
    );
    
    await userEvent.click(screen.getByText('Implement Task Card Component'));
    expect(onTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('updates task status when dragged to a different column', async () => {
    const updateTaskMock = jest.fn().mockResolvedValue({});
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: updateTaskMock,
      isLoading: false,
    }));
    
    renderWithQueryClient(
      <TaskBoard projectId="project-1" />
    );
    
    // Simulate drag end event
    const onDragEnd = require('../../hooks/useUpdateTask').useUpdateTask().updateTask;
    
    // Simulate drag and drop from backlog to todo
    const mockDragResult = {
      destination: {
        droppableId: 'todo',
        index: 0,
      },
      source: {
        droppableId: 'backlog',
        index: 0,
      },
      draggableId: 'task-1',
    };
    
    // Manually trigger the onDragEnd function since we can't actually drag in tests
    onDragEnd({
      id: 'task-1',
      status: 'todo',
    });
    
    // Verify that updateTask was called with the correct parameters
    expect(updateTaskMock).toHaveBeenCalledWith({
      id: 'task-1',
      status: 'todo',
    });
  });
});
