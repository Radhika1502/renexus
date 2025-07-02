import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TaskListWithOfflineSupport from '../components/TaskListWithOfflineSupport';
import * as offlineTaskService from '../../../services/tasks/offlineTaskService';
import { useOfflineSync } from '../../../hooks/useOfflineSync';

// Mock the task service
jest.mock('../../../services/tasks/offlineTaskService');
const mockOfflineTaskService = offlineTaskService as jest.Mocked<typeof offlineTaskService>;

// Mock the offline sync hook
jest.mock('../../../hooks/useOfflineSync');
const mockUseOfflineSync = useOfflineSync as jest.MockedFunction<typeof useOfflineSync>;

describe('TaskListWithOfflineSupport', () => {
  // Default mock implementations
  beforeEach(() => {
    // Mock task data
    const mockTasks = [
      { id: '1', title: 'Task 1', status: 'todo', projectId: 'project1', createdAt: '2025-07-01' },
      { id: '2', title: 'Task 2', status: 'in_progress', projectId: 'project1', createdAt: '2025-07-01' }
    ];
    
    // Mock task service functions
    mockOfflineTaskService.fetchTasks.mockResolvedValue(mockTasks);
    mockOfflineTaskService.createTask.mockImplementation((task) => 
      Promise.resolve({ ...task, id: 'new-task-id' })
    );
    mockOfflineTaskService.updateTaskStatus.mockImplementation((id, status) => 
      Promise.resolve({ id, title: `Task ${id}`, status, projectId: 'project1', createdAt: '2025-07-01' })
    );
    mockOfflineTaskService.deleteTask.mockResolvedValue(undefined);
    
    // Mock offline sync hook
    mockUseOfflineSync.mockReturnValue({
      isOnline: true,
      hasPendingChanges: false,
      pendingChangesCount: 0,
      isSyncing: false,
      lastSyncResult: null,
      storeData: jest.fn(),
      getData: jest.fn(),
      addChange: jest.fn(),
      syncChanges: jest.fn().mockResolvedValue(true),
      clearCache: jest.fn()
    });
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders task list when online', async () => {
    render(<TaskListWithOfflineSupport />);
    
    // Check loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });
    
    // Verify task service was called
    expect(mockOfflineTaskService.fetchTasks).toHaveBeenCalledTimes(1);
  });
  
  test('creates new task when online', async () => {
    render(<TaskListWithOfflineSupport />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
    
    // Add a new task
    const input = screen.getByPlaceholderText('Add a new task...');
    fireEvent.change(input, { target: { value: 'New Task' } });
    
    const addButton = screen.getByText('Add Task');
    fireEvent.click(addButton);
    
    // Verify task service was called
    expect(mockOfflineTaskService.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Task',
        status: 'todo'
      })
    );
  });
  
  test('updates task status when online', async () => {
    render(<TaskListWithOfflineSupport />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
    
    // Find the status dropdown for Task 1
    const statusDropdowns = screen.getAllByRole('combobox');
    fireEvent.change(statusDropdowns[0], { target: { value: 'in_progress' } });
    
    // Verify task service was called
    expect(mockOfflineTaskService.updateTaskStatus).toHaveBeenCalledWith('1', 'in_progress');
  });
  
  test('deletes task when online', async () => {
    render(<TaskListWithOfflineSupport />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });
    
    // Find delete buttons
    const deleteButtons = screen.getAllByRole('button');
    const deleteTask1Button = deleteButtons.find(button => 
      button.parentElement?.textContent?.includes('Task 1')
    );
    
    // Delete Task 1
    if (deleteTask1Button) {
      fireEvent.click(deleteTask1Button);
    }
    
    // Verify task service was called
    expect(mockOfflineTaskService.deleteTask).toHaveBeenCalledWith('1');
  });
  
  test('handles offline mode correctly', async () => {
    // Mock offline state
    mockUseOfflineSync.mockReturnValue({
      isOnline: false,
      hasPendingChanges: true,
      pendingChangesCount: 2,
      isSyncing: false,
      lastSyncResult: null,
      storeData: jest.fn(),
      getData: jest.fn().mockReturnValue([
        { id: '1', title: 'Task 1', status: 'todo', projectId: 'project1', createdAt: '2025-07-01' },
        { id: '2', title: 'Task 2', status: 'in_progress', projectId: 'project1', createdAt: '2025-07-01' }
      ]),
      addChange: jest.fn(),
      syncChanges: jest.fn().mockResolvedValue(true),
      clearCache: jest.fn()
    });
    
    // Mock task service to fail (simulate offline)
    mockOfflineTaskService.fetchTasks.mockRejectedValue(new Error('Network error'));
    
    render(<TaskListWithOfflineSupport />);
    
    // Should show offline indicator
    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('2 pending')).toBeInTheDocument();
    });
    
    // Should still show tasks from cache
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    
    // Should show error message
    expect(screen.getByText(/Failed to load tasks/i)).toBeInTheDocument();
  });
  
  test('syncs changes when back online', async () => {
    // First mock offline state
    const mockStoreData = jest.fn();
    const mockGetData = jest.fn().mockReturnValue([
      { id: '1', title: 'Task 1', status: 'todo', projectId: 'project1', createdAt: '2025-07-01' },
      { id: '2', title: 'Task 2', status: 'in_progress', projectId: 'project1', createdAt: '2025-07-01' }
    ]);
    const mockSyncChanges = jest.fn().mockResolvedValue(true);
    
    mockUseOfflineSync.mockReturnValue({
      isOnline: false,
      hasPendingChanges: true,
      pendingChangesCount: 2,
      isSyncing: false,
      lastSyncResult: null,
      storeData: mockStoreData,
      getData: mockGetData,
      addChange: jest.fn(),
      syncChanges: mockSyncChanges,
      clearCache: jest.fn()
    });
    
    const { rerender } = render(<TaskListWithOfflineSupport />);
    
    // Now mock coming back online
    mockUseOfflineSync.mockReturnValue({
      isOnline: true,
      hasPendingChanges: true,
      pendingChangesCount: 2,
      isSyncing: false,
      lastSyncResult: null,
      storeData: mockStoreData,
      getData: mockGetData,
      addChange: jest.fn(),
      syncChanges: mockSyncChanges,
      clearCache: jest.fn()
    });
    
    rerender(<TaskListWithOfflineSupport />);
    
    // Should show sync button
    const syncButton = screen.getByText('Sync Now');
    fireEvent.click(syncButton);
    
    // Verify sync was called
    expect(mockSyncChanges).toHaveBeenCalledTimes(1);
  });
});
