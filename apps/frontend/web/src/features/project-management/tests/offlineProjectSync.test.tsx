/**
 * Offline Project Sync Tests
 * 
 * Unit tests for the offline-aware project management components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProjectListWithOfflineSupport from '../components/ProjectListWithOfflineSupport';
import { offlineProjectService } from '../../../services/projects/offlineProjectService';
import { useOfflineSync } from '../../../hooks/useOfflineSync';

// Mock the offlineProjectService
jest.mock('../../../services/projects/offlineProjectService', () => ({
  offlineProjectService: {
    getAllProjects: jest.fn(),
    getProjectById: jest.fn(),
    createProject: jest.fn(),
    updateProject: jest.fn(),
    deleteProject: jest.fn(),
    syncOfflineProjects: jest.fn()
  }
}));

// Mock the useOfflineSync hook
jest.mock('../../../hooks/useOfflineSync', () => ({
  useOfflineSync: jest.fn()
}));

describe('ProjectListWithOfflineSupport', () => {
  // Sample project data for testing
  const mockProjects = [
    {
      id: '1',
      name: 'Project Alpha',
      description: 'This is project alpha',
      status: 'active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      teamMembers: ['John Doe', 'Jane Smith'],
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z'
    },
    {
      id: 'temp_123',
      name: 'Offline Project',
      description: 'This project was created offline',
      status: 'active',
      startDate: '2025-02-01',
      teamMembers: ['Bob Johnson'],
      createdAt: '2025-02-01T00:00:00Z',
      updatedAt: '2025-02-01T00:00:00Z'
    }
  ];

  // Setup for each test
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      },
      writable: true
    });
    
    // Default mock implementations
    (offlineProjectService.getAllProjects as jest.Mock).mockResolvedValue(mockProjects);
    (useOfflineSync as jest.Mock).mockReturnValue({
      isOnline: true,
      isSyncing: false,
      syncNow: jest.fn()
    });
  });

  test('renders project list when online', async () => {
    // Setup
    (useOfflineSync as jest.Mock).mockReturnValue({
      isOnline: true,
      isSyncing: false,
      syncNow: jest.fn()
    });

    // Render component
    render(<ProjectListWithOfflineSupport />);

    // Wait for projects to load
    await waitFor(() => {
      expect(offlineProjectService.getAllProjects).toHaveBeenCalled();
    });

    // Verify projects are displayed
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Offline Project')).toBeInTheDocument();
    expect(screen.getByText('This is project alpha')).toBeInTheDocument();
    
    // Verify pending sync indicator for temp project
    expect(screen.getByText('Pending Sync')).toBeInTheDocument();
    
    // Verify no offline indicator is shown
    expect(screen.queryByText('Offline')).not.toBeInTheDocument();
  });

  test('displays offline indicator when offline', async () => {
    // Setup
    (useOfflineSync as jest.Mock).mockReturnValue({
      isOnline: false,
      isSyncing: false,
      syncNow: jest.fn()
    });

    // Render component
    render(<ProjectListWithOfflineSupport />);

    // Wait for projects to load
    await waitFor(() => {
      expect(offlineProjectService.getAllProjects).toHaveBeenCalled();
    });

    // Verify offline indicator is shown
    expect(screen.getByText('Offline')).toBeInTheDocument();
    
    // Verify sync button is available
    expect(screen.getByText('Sync Now')).toBeInTheDocument();
  });

  test('creates a new project', async () => {
    // Setup
    const newProject = {
      id: '3',
      name: 'New Project',
      description: 'This is a new project',
      status: 'active',
      startDate: '2025-03-01',
      teamMembers: [],
      createdAt: '2025-03-01T00:00:00Z',
      updatedAt: '2025-03-01T00:00:00Z'
    };
    
    (offlineProjectService.createProject as jest.Mock).mockResolvedValue(newProject);

    // Render component
    render(<ProjectListWithOfflineSupport />);

    // Wait for projects to load
    await waitFor(() => {
      expect(offlineProjectService.getAllProjects).toHaveBeenCalled();
    });

    // Open create dialog
    fireEvent.click(screen.getByText('New Project'));

    // Fill form
    fireEvent.change(screen.getByLabelText('Project Name'), { 
      target: { value: 'New Project' } 
    });
    
    fireEvent.change(screen.getByLabelText('Description'), { 
      target: { value: 'This is a new project' } 
    });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    // Verify project creation was called
    await waitFor(() => {
      expect(offlineProjectService.createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Project',
          description: 'This is a new project'
        })
      );
    });

    // Verify projects are reloaded
    expect(offlineProjectService.getAllProjects).toHaveBeenCalledTimes(2);
  });

  test('edits an existing project', async () => {
    // Render component
    render(<ProjectListWithOfflineSupport />);

    // Wait for projects to load
    await waitFor(() => {
      expect(offlineProjectService.getAllProjects).toHaveBeenCalled();
    });

    // Find and click edit button for first project
    const editButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(editButtons[0]); // First edit button

    // Verify edit dialog is open with project data
    expect(screen.getByDisplayValue('Project Alpha')).toBeInTheDocument();
    
    // Change project name
    fireEvent.change(screen.getByLabelText('Project Name'), { 
      target: { value: 'Updated Project Alpha' } 
    });

    // Submit form
    fireEvent.click(screen.getByText('Update'));

    // Verify project update was called
    await waitFor(() => {
      expect(offlineProjectService.updateProject).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          name: 'Updated Project Alpha'
        })
      );
    });

    // Verify projects are reloaded
    expect(offlineProjectService.getAllProjects).toHaveBeenCalledTimes(2);
  });

  test('deletes a project', async () => {
    // Mock window.confirm to return true
    window.confirm = jest.fn().mockImplementation(() => true);

    // Render component
    render(<ProjectListWithOfflineSupport />);

    // Wait for projects to load
    await waitFor(() => {
      expect(offlineProjectService.getAllProjects).toHaveBeenCalled();
    });

    // Find and click delete button for first project
    const deleteButtons = screen.getAllByRole('button', { name: '' });
    fireEvent.click(deleteButtons[1]); // First delete button

    // Verify project deletion was called
    await waitFor(() => {
      expect(offlineProjectService.deleteProject).toHaveBeenCalledWith('1');
    });

    // Verify projects are reloaded
    expect(offlineProjectService.getAllProjects).toHaveBeenCalledTimes(2);
  });

  test('handles project selection', async () => {
    // Setup
    const onProjectSelect = jest.fn();

    // Render component with onProjectSelect prop
    render(<ProjectListWithOfflineSupport onProjectSelect={onProjectSelect} />);

    // Wait for projects to load
    await waitFor(() => {
      expect(offlineProjectService.getAllProjects).toHaveBeenCalled();
    });

    // Find and click on a project card
    const projectCards = screen.getAllByText(/Project/);
    fireEvent.click(projectCards[0]);

    // Verify onProjectSelect was called with correct ID
    expect(onProjectSelect).toHaveBeenCalledWith('1');
  });

  test('handles offline project creation', async () => {
    // Setup
    (useOfflineSync as jest.Mock).mockReturnValue({
      isOnline: false,
      isSyncing: false,
      syncNow: jest.fn()
    });
    
    const tempProject = {
      id: 'temp_456',
      name: 'New Offline Project',
      description: 'Created while offline',
      status: 'active',
      startDate: '2025-03-01',
      teamMembers: [],
      createdAt: '2025-03-01T00:00:00Z',
      updatedAt: '2025-03-01T00:00:00Z'
    };
    
    (offlineProjectService.createProject as jest.Mock).mockResolvedValue(tempProject);

    // Render component
    render(<ProjectListWithOfflineSupport />);

    // Wait for projects to load
    await waitFor(() => {
      expect(offlineProjectService.getAllProjects).toHaveBeenCalled();
    });

    // Open create dialog
    fireEvent.click(screen.getByText('New Project'));

    // Fill form
    fireEvent.change(screen.getByLabelText('Project Name'), { 
      target: { value: 'New Offline Project' } 
    });
    
    fireEvent.change(screen.getByLabelText('Description'), { 
      target: { value: 'Created while offline' } 
    });

    // Submit form
    fireEvent.click(screen.getByText('Create'));

    // Verify project creation was called
    await waitFor(() => {
      expect(offlineProjectService.createProject).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Offline Project',
          description: 'Created while offline'
        })
      );
    });

    // Verify projects are reloaded
    expect(offlineProjectService.getAllProjects).toHaveBeenCalledTimes(2);
  });

  test('triggers sync when sync button is clicked', async () => {
    // Setup
    const syncNowMock = jest.fn();
    (useOfflineSync as jest.Mock).mockReturnValue({
      isOnline: false,
      isSyncing: false,
      syncNow: syncNowMock
    });

    // Render component
    render(<ProjectListWithOfflineSupport />);

    // Wait for projects to load
    await waitFor(() => {
      expect(offlineProjectService.getAllProjects).toHaveBeenCalled();
    });

    // Click sync button
    fireEvent.click(screen.getByText('Sync Now'));

    // Verify syncNow was called
    expect(syncNowMock).toHaveBeenCalled();
    
    // Verify projects are reloaded
    expect(offlineProjectService.getAllProjects).toHaveBeenCalledTimes(2);
  });

  test('shows loading state', async () => {
    // Setup - delay the promise resolution
    (offlineProjectService.getAllProjects as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockProjects), 100))
    );

    // Render component
    render(<ProjectListWithOfflineSupport />);

    // Verify loading indicator is shown
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Wait for projects to load
    await waitFor(() => {
      expect(offlineProjectService.getAllProjects).toHaveBeenCalled();
    });

    // Verify loading indicator is gone
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  test('shows error state', async () => {
    // Setup
    (offlineProjectService.getAllProjects as jest.Mock).mockRejectedValue(
      new Error('Failed to load projects')
    );

    // Render component
    render(<ProjectListWithOfflineSupport />);

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to load projects')).toBeInTheDocument();
    });
  });
});
