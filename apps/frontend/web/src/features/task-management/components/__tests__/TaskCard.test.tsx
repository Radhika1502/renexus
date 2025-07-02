import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from '../TaskCard';
import { TaskStatus, TaskPriority } from '../../types';

// Mock the router hooks
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Sample task data for testing
const mockTask = {
  id: 'task-1',
  title: 'Implement Task Card Component',
  description: 'Create a reusable task card component for the task board',
  status: TaskStatus.IN_PROGRESS,
  priority: TaskPriority.HIGH,
  createdAt: '2025-06-20T10:00:00Z',
  updatedAt: '2025-06-21T14:30:00Z',
  dueDate: '2025-06-30T23:59:59Z',
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
  labels: [
    { id: 'label-1', name: 'Frontend', color: '#0ea5e9' },
    { id: 'label-2', name: 'UI', color: '#8b5cf6' },
  ],
  attachments: 2,
  comments: 5,
};

describe('TaskCard Component', () => {
  it('renders the task title correctly', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('Implement Task Card Component')).toBeInTheDocument();
  });

  it('displays the correct priority indicator', () => {
    render(<TaskCard task={mockTask} />);
    // Check for high priority indicator (could be an icon or text)
    const priorityElement = screen.getByTitle(/high priority/i);
    expect(priorityElement).toBeInTheDocument();
  });

  it('shows the due date in the correct format', () => {
    render(<TaskCard task={mockTask} />);
    // The exact format might vary based on your implementation
    expect(screen.getByText(/Jun 30/)).toBeInTheDocument();
  });

  it('displays the assignee avatar', () => {
    render(<TaskCard task={mockTask} />);
    const assigneeAvatar = screen.getByAltText('John Doe');
    expect(assigneeAvatar).toBeInTheDocument();
  });

  it('shows the correct number of comments and attachments', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('5')).toBeInTheDocument(); // Comments count
    expect(screen.getByText('2')).toBeInTheDocument(); // Attachments count
  });

  it('displays all task labels', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('UI')).toBeInTheDocument();
  });

  it('calls onClick handler when the card is clicked', async () => {
    const mockOnClick = jest.fn();
    render(<TaskCard task={mockTask} onClick={mockOnClick} />);
    
    await userEvent.click(screen.getByText('Implement Task Card Component'));
    expect(mockOnClick).toHaveBeenCalledWith(mockTask);
  });

  it('applies the dragging class when isDragging prop is true', () => {
    const { container } = render(<TaskCard task={mockTask} isDragging={true} />);
    // The exact class name might vary based on your implementation
    expect(container.firstChild).toHaveClass('opacity-50');
  });

  it('renders a compact version when isCompact prop is true', () => {
    const { container } = render(<TaskCard task={mockTask} isCompact={true} />);
    // The exact implementation of compact mode might vary
    expect(container.firstChild).toHaveClass('compact');
  });
});
