import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { useNotifications } from '../../hooks/useNotifications';
import { useWebSocket } from '../../hooks/useWebSocket';

// Mock the hooks
jest.mock('../../hooks/useNotifications');
jest.mock('../../hooks/useWebSocket');

const mockNotifications = [
  {
    id: '1',
    type: 'task:assigned',
    title: 'New Task',
    message: 'You have been assigned a new task',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'task:completed',
    title: 'Task Completed',
    message: 'A task has been completed',
    isRead: true,
    createdAt: new Date().toISOString(),
  },
];

const mockUseNotifications = useNotifications as jest.Mock;
const mockUseWebSocket = useWebSocket as jest.Mock;

describe('NotificationCenter', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      total: mockNotifications.length,
      hasMore: false,
      isLoading: false,
      error: null,
      unreadCount: 1,
      markAsRead: { mutate: jest.fn() },
      markAllAsRead: { mutate: jest.fn() },
    });

    mockUseWebSocket.mockReturnValue({
      useSubscription: jest.fn(),
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <NotificationCenter />
      </QueryClientProvider>
    );
  };

  it('renders notification badge with correct unread count', () => {
    renderComponent();
    const badge = screen.getByLabelText('1 unread notifications');
    expect(badge).toBeInTheDocument();
  });

  it('opens notification menu on click', () => {
    renderComponent();
    const button = screen.getByLabelText('1 unread notifications');
    fireEvent.click(button);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('New Task')).toBeInTheDocument();
    expect(screen.getByText('Task Completed')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      total: 0,
      hasMore: false,
      isLoading: true,
      error: null,
      unreadCount: 0,
      markAsRead: { mutate: jest.fn() },
      markAllAsRead: { mutate: jest.fn() },
    });

    renderComponent();
    const button = screen.getByLabelText('0 unread notifications');
    fireEvent.click(button);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays error state', () => {
    mockUseNotifications.mockReturnValue({
      notifications: [],
      total: 0,
      hasMore: false,
      isLoading: false,
      error: new Error('Failed to load notifications'),
      unreadCount: 0,
      markAsRead: { mutate: jest.fn() },
      markAllAsRead: { mutate: jest.fn() },
    });

    renderComponent();
    const button = screen.getByLabelText('0 unread notifications');
    fireEvent.click(button);

    expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
  });

  it('marks notification as read on click', async () => {
    const markAsRead = jest.fn();
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      total: mockNotifications.length,
      hasMore: false,
      isLoading: false,
      error: null,
      unreadCount: 1,
      markAsRead: { mutate: markAsRead },
      markAllAsRead: { mutate: jest.fn() },
    });

    renderComponent();
    const button = screen.getByLabelText('1 unread notifications');
    fireEvent.click(button);

    const notification = screen.getByText('New Task');
    fireEvent.click(notification);

    expect(markAsRead).toHaveBeenCalledWith('1');
  });

  it('marks all notifications as read', async () => {
    const markAllAsRead = jest.fn();
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      total: mockNotifications.length,
      hasMore: false,
      isLoading: false,
      error: null,
      unreadCount: 1,
      markAsRead: { mutate: jest.fn() },
      markAllAsRead: { mutate: markAllAsRead },
    });

    renderComponent();
    const button = screen.getByLabelText('1 unread notifications');
    fireEvent.click(button);

    const markAllButton = screen.getByText('Mark all as read');
    fireEvent.click(markAllButton);

    expect(markAllAsRead).toHaveBeenCalled();
  });

  it('loads more notifications when scrolling', async () => {
    const mockSetPage = jest.fn();
    mockUseNotifications.mockReturnValue({
      notifications: mockNotifications,
      total: 100,
      hasMore: true,
      isLoading: false,
      error: null,
      unreadCount: 1,
      markAsRead: { mutate: jest.fn() },
      markAllAsRead: { mutate: jest.fn() },
      setPage: mockSetPage,
    });

    renderComponent();
    const button = screen.getByLabelText('1 unread notifications');
    fireEvent.click(button);

    const loadMoreButton = screen.getByText('Load more');
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(mockSetPage).toHaveBeenCalled();
    });
  });
}); 