import React from 'react';
import { render, screen } from '@testing-library/react';
import { TaskPresence } from '../TaskPresence';
import { UserPresence } from '../../services/websocket';

// Mock the UI components
jest.mock('../../../../components/ui', () => ({
  Avatar: ({ alt, className }: { alt: string; className: string }) => (
    <div data-testid={`avatar-${alt}`} className={className}>
      {alt}
    </div>
  ),
  Tooltip: ({ children, content }: { children: React.ReactNode; content: React.ReactNode }) => (
    <div data-testid="tooltip">
      <div data-testid="tooltip-content">{content}</div>
      {children}
    </div>
  ),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Eye: () => <div data-testid="eye-icon" />,
  Edit: () => <div data-testid="edit-icon" />,
}));

describe('TaskPresence', () => {
  const currentUserId = 'current-user';
  
  const mockUsers: UserPresence[] = [
    {
      userId: 'user-1',
      username: 'User One',
      avatar: '/avatars/user1.jpg',
      taskId: 'task-123',
      action: 'viewing',
      lastActive: new Date().toISOString(),
    },
    {
      userId: 'user-2',
      username: 'User Two',
      avatar: '/avatars/user2.jpg',
      taskId: 'task-123',
      action: 'editing',
      lastActive: new Date().toISOString(),
    },
    {
      userId: currentUserId,
      username: 'Current User',
      avatar: '/avatars/current.jpg',
      taskId: 'task-123',
      action: 'viewing',
      lastActive: new Date().toISOString(),
    },
  ];

  it('renders nothing when no other users are active', () => {
    const { container } = render(
      <TaskPresence activeUsers={[mockUsers[2]]} currentUserId={currentUserId} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders active users with correct icons', () => {
    render(
      <TaskPresence activeUsers={mockUsers} currentUserId={currentUserId} />
    );
    
    // Should show two users (excluding current user)
    expect(screen.getByTestId('avatar-User One')).toBeInTheDocument();
    expect(screen.getByTestId('avatar-User Two')).toBeInTheDocument();
    
    // User Two is editing, should have edit icon
    const userTwoAvatar = screen.getByTestId('avatar-User Two');
    expect(userTwoAvatar.className).toContain('border-amber-500');
    
    // User One is viewing, should have eye icon
    const userOneAvatar = screen.getByTestId('avatar-User One');
    expect(userOneAvatar.className).toContain('border-blue-500');
  });

  it('shows +N indicator when more than 5 users are active', () => {
    // Create 7 users (plus current user)
    const manyUsers = [
      ...mockUsers,
      {
        userId: 'user-3',
        username: 'User Three',
        avatar: '/avatars/user3.jpg',
        taskId: 'task-123',
        action: 'viewing',
        lastActive: new Date().toISOString(),
      },
      {
        userId: 'user-4',
        username: 'User Four',
        avatar: '/avatars/user4.jpg',
        taskId: 'task-123',
        action: 'viewing',
        lastActive: new Date().toISOString(),
      },
      {
        userId: 'user-5',
        username: 'User Five',
        avatar: '/avatars/user5.jpg',
        taskId: 'task-123',
        action: 'viewing',
        lastActive: new Date().toISOString(),
      },
      {
        userId: 'user-6',
        username: 'User Six',
        avatar: '/avatars/user6.jpg',
        taskId: 'task-123',
        action: 'viewing',
        lastActive: new Date().toISOString(),
      },
    ];
    
    render(
      <TaskPresence activeUsers={manyUsers} currentUserId={currentUserId} />
    );
    
    // Should show +2 indicator (7 total users - 1 current user - 5 shown = 1 hidden)
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('sorts users with editors first', () => {
    const { container } = render(
      <TaskPresence activeUsers={mockUsers} currentUserId={currentUserId} />
    );
    
    // First child should be the tooltip containing User Two (editing)
    const firstTooltip = container.firstChild?.firstChild;
    expect(firstTooltip).toContainElement(screen.getByTestId('avatar-User Two'));
  });

  it('has proper accessibility attributes', () => {
    render(
      <TaskPresence activeUsers={mockUsers} currentUserId={currentUserId} />
    );
    
    const container = screen.getByLabelText('Users currently viewing this task');
    expect(container).toBeInTheDocument();
  });
});
