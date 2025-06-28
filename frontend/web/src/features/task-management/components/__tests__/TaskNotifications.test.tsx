import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskNotifications } from '../TaskNotifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the hooks
jest.mock('../../hooks/useUpdateTask', () => ({
  useUpdateTask: jest.fn(() => ({
    updateTask: jest.fn().mockResolvedValue({}),
    isLoading: false,
  })),
}));

// Sample task data for testing
const mockTask = {
  id: 'task-1',
  title: 'Implement Task Notifications',
  description: 'Create a component for managing task notification preferences',
  notificationPreferences: [
    {
      userId: 'user-2',
      preferences: {
        type: 'mentions',
        channels: {
          email: true,
          push: false,
          inApp: true,
        },
        reminders: {
          enabled: true,
          beforeDueDate: 24,
        },
      },
    },
  ],
  dueDate: '2025-06-30T23:59:59Z',
};

describe('TaskNotifications Component', () => {
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

  it('renders notification preferences card with title', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskNotifications task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
  });

  it('displays default preferences for a new user', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskNotifications task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Default is "all" notifications
    const allRadio = screen.getByLabelText('All updates');
    expect(allRadio).toBeChecked();
    
    // Default channels are all enabled
    const emailSwitch = screen.getByText('Email notifications').nextSibling;
    const pushSwitch = screen.getByText('Push notifications').nextSibling;
    const inAppSwitch = screen.getByText('In-app notifications').nextSibling;
    
    expect(emailSwitch).toHaveAttribute('aria-checked', 'true');
    expect(pushSwitch).toHaveAttribute('aria-checked', 'true');
    expect(inAppSwitch).toHaveAttribute('aria-checked', 'true');
    
    // Default reminders are enabled with 24h before due date
    const reminderSwitch = screen.getByText('Send reminder before due date').nextSibling;
    expect(reminderSwitch).toHaveAttribute('aria-checked', 'true');
  });

  it('loads existing preferences for a user', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskNotifications task={mockTask} currentUserId="user-2" />
      </QueryClientProvider>
    );
    
    // User has "mentions" notifications
    const mentionsRadio = screen.getByLabelText('Only mentions');
    expect(mentionsRadio).toBeChecked();
    
    // User has email and inApp enabled, push disabled
    const emailSwitch = screen.getByText('Email notifications').nextSibling;
    const pushSwitch = screen.getByText('Push notifications').nextSibling;
    const inAppSwitch = screen.getByText('In-app notifications').nextSibling;
    
    expect(emailSwitch).toHaveAttribute('aria-checked', 'true');
    expect(pushSwitch).toHaveAttribute('aria-checked', 'false');
    expect(inAppSwitch).toHaveAttribute('aria-checked', 'true');
  });

  it('updates notification type when radio buttons are clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskNotifications task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Click on "Only mentions" radio
    await userEvent.click(screen.getByLabelText('Only mentions'));
    
    // The radio should be checked
    expect(screen.getByLabelText('Only mentions')).toBeChecked();
    
    // Save button should be enabled (not saved)
    expect(screen.getByText('Save Preferences')).not.toBeDisabled();
  });

  it('toggles notification channels when switches are clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskNotifications task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Click on email switch to disable it
    await userEvent.click(screen.getByText('Email notifications').nextSibling);
    
    // The switch should be unchecked
    const emailSwitch = screen.getByText('Email notifications').nextSibling;
    expect(emailSwitch).toHaveAttribute('aria-checked', 'false');
    
    // Save button should be enabled (not saved)
    expect(screen.getByText('Save Preferences')).not.toBeDisabled();
  });

  it('toggles reminders when reminder switch is clicked', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskNotifications task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Click on reminder switch to disable it
    await userEvent.click(screen.getByText('Send reminder before due date').nextSibling);
    
    // The switch should be unchecked
    const reminderSwitch = screen.getByText('Send reminder before due date').nextSibling;
    expect(reminderSwitch).toHaveAttribute('aria-checked', 'false');
    
    // The reminder time selector should be hidden
    expect(screen.queryByText('Remind me')).not.toBeInTheDocument();
    
    // Save button should be enabled (not saved)
    expect(screen.getByText('Save Preferences')).not.toBeDisabled();
  });

  it('changes reminder time when a new time is selected', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskNotifications task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Open the select dropdown
    await userEvent.click(screen.getByRole('combobox'));
    
    // Select "3 hours before"
    await userEvent.click(screen.getByText('3 hours before'));
    
    // Save button should be enabled (not saved)
    expect(screen.getByText('Save Preferences')).not.toBeDisabled();
  });

  it('calls updateTask with correct data when preferences are saved', async () => {
    const mockUpdateTask = jest.fn().mockResolvedValue({});
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: mockUpdateTask,
      isLoading: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskNotifications task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Make some changes
    await userEvent.click(screen.getByLabelText('Only mentions'));
    await userEvent.click(screen.getByText('Push notifications').nextSibling);
    
    // Save preferences
    await userEvent.click(screen.getByText('Save Preferences'));
    
    // Check if updateTask was called with the correct data
    expect(mockUpdateTask).toHaveBeenCalledWith({
      id: 'task-1',
      notificationPreferences: [
        {
          userId: 'user-2',
          preferences: {
            type: 'mentions',
            channels: {
              email: true,
              push: false,
              inApp: true,
            },
            reminders: {
              enabled: true,
              beforeDueDate: 24,
            },
          },
        },
        {
          userId: 'user-1',
          preferences: {
            type: 'mentions',
            channels: {
              email: true,
              push: false,
              inApp: true,
            },
            reminders: {
              enabled: true,
              beforeDueDate: 24,
            },
          },
        },
      ],
    });
  });

  it('disables save button when preferences are saved', async () => {
    const mockUpdateTask = jest.fn().mockResolvedValue({});
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: mockUpdateTask,
      isLoading: false,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskNotifications task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Make some changes
    await userEvent.click(screen.getByLabelText('Only mentions'));
    
    // Save preferences
    await userEvent.click(screen.getByText('Save Preferences'));
    
    // Wait for the save to complete
    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalled();
    });
    
    // Save button should be disabled
    expect(screen.getByText('Save Preferences')).toBeDisabled();
  });

  it('hides notification channels when "None" is selected', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskNotifications task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Click on "None" radio
    await userEvent.click(screen.getByLabelText('None'));
    
    // Notification channels section should be hidden
    expect(screen.queryByText('Notification Channels')).not.toBeInTheDocument();
  });

  it('shows loading state when saving preferences', () => {
    // Override the mock to simulate loading state
    require('../../hooks/useUpdateTask').useUpdateTask.mockImplementationOnce(() => ({
      updateTask: jest.fn().mockResolvedValue({}),
      isLoading: true,
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskNotifications task={mockTask} currentUserId="user-1" />
      </QueryClientProvider>
    );
    
    // Make some changes to enable the save button
    userEvent.click(screen.getByLabelText('Only mentions'));
    
    // Check if the save button shows loading state
    const saveButton = screen.getByText('Save Preferences');
    expect(saveButton).toHaveAttribute('aria-busy', 'true');
  });
});
