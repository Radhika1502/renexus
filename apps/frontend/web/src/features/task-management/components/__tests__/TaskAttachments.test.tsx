/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskAttachments } from '../TaskAttachments';
// Using the local implementation of QueryClient
import { QueryClient, QueryClientProvider } from '../../hooks/queryHooks';
import '@testing-library/jest-dom';
import { Task, TaskStatus, TaskPriority, Attachment } from '../../types';

// Mock attachments for testing
const mockAttachments: Attachment[] = [
  {
    id: 'attachment-1',
    name: 'requirements.pdf',
    size: 1024000,
    type: 'application/pdf',
    uploadedBy: 'user-1',
    uploadedAt: '2025-06-24T10:30:00Z',
    url: 'https://example.com/files/requirements.pdf'
  },
  {
    id: 'attachment-2',
    name: 'mockup.png',
    size: 2048000,
    type: 'image/png',
    uploadedBy: 'user-2',
    uploadedAt: '2025-06-25T09:15:00Z',
    url: 'https://example.com/files/mockup.png'
  }
];

// Mock task for testing
const mockTask: Task = {
  id: 'task-1',
  title: 'Implement Attachment Feature',
  description: 'Add ability to upload and manage attachments',
  status: 'IN_PROGRESS' as TaskStatus,
  priority: 'HIGH' as TaskPriority,
  assigneeId: 'user-1',
  assignee: {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com'
  },
  reporterId: 'user-2',
  projectId: 'project-1',
  labels: [],
  attachments: mockAttachments,
  comments: [],
  createdAt: '2025-06-20T09:00:00Z',
  updatedAt: '2025-06-24T16:00:00Z'
};

// Mock the hooks
jest.mock('../../hooks/useTaskAttachments', () => ({
  useTaskAttachments: jest.fn(() => ({
    attachments: mockAttachments,
    isLoading: false,
    isError: false,
    uploadAttachment: jest.fn().mockResolvedValue({}),
    downloadAttachment: jest.fn().mockResolvedValue({}),
    deleteAttachment: jest.fn().mockResolvedValue({}),
  })),
}));

// End of mock setup

describe('TaskAttachments Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    // Note: The local implementation doesn't support configuration options
  });

  it('renders the list of attachments correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    // Check if all attachments are displayed
    expect(screen.getByText('design-mockup.png')).toBeInTheDocument();
    expect(screen.getByText('requirements.pdf')).toBeInTheDocument();
    expect(screen.getByText('implementation-notes.docx')).toBeInTheDocument();
    
    // Check if file sizes are displayed correctly
    expect(screen.getByText('1.0 MB')).toBeInTheDocument();
    expect(screen.getByText('500.0 KB')).toBeInTheDocument();
    expect(screen.getByText('250.0 KB')).toBeInTheDocument();
  });

  it('displays the correct file type icons', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    // Check for specific file type icons (implementation-dependent)
    const imageIcon = screen.getByTestId('file-icon-image');
    const pdfIcon = screen.getByTestId('file-icon-pdf');
    const docIcon = screen.getByTestId('file-icon-doc');
    
    expect(imageIcon).toBeInTheDocument();
    expect(pdfIcon).toBeInTheDocument();
    expect(docIcon).toBeInTheDocument();
  });

  it('shows loading state when attachments are loading', () => {
    // Override the mock to simulate loading state
    require('../../hooks/useTaskAttachments').useTaskAttachments.mockImplementationOnce(() => ({
      attachments: [],
      isLoading: true,
      isError: false,
      uploadAttachment: jest.fn(),
      downloadAttachment: jest.fn(),
      deleteAttachment: jest.fn(),
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    expect(screen.getByTestId('attachments-loading')).toBeInTheDocument();
  });

  it('shows error state when attachments fail to load', () => {
    // Override the mock to simulate error state
    require('../../hooks/useTaskAttachments').useTaskAttachments.mockImplementationOnce(() => ({
      attachments: [],
      isLoading: false,
      isError: true,
      error: new Error('Failed to load attachments'),
      uploadAttachment: jest.fn(),
      downloadAttachment: jest.fn(),
      deleteAttachment: jest.fn(),
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    expect(screen.getByText(/failed to load attachments/i)).toBeInTheDocument();
  });

  it('calls downloadAttachment when download button is clicked', async () => {
    const mockDownloadAttachment = jest.fn().mockResolvedValue({});
    require('../../hooks/useTaskAttachments').useTaskAttachments.mockImplementationOnce(() => ({
      attachments: mockAttachments,
      isLoading: false,
      isError: false,
      uploadAttachment: jest.fn(),
      downloadAttachment: mockDownloadAttachment,
      deleteAttachment: jest.fn(),
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    // Click the download button for the first attachment
    await userEvent.click(screen.getAllByLabelText(/download/i)[0]);
    
    expect(mockDownloadAttachment).toHaveBeenCalledWith('attachment-1');
  });

  it('calls deleteAttachment when delete button is clicked and confirmed', async () => {
    const mockDeleteAttachment = jest.fn().mockResolvedValue({});
    require('../../hooks/useTaskAttachments').useTaskAttachments.mockImplementationOnce(() => ({
      attachments: mockAttachments,
      isLoading: false,
      isError: false,
      uploadAttachment: jest.fn(),
      downloadAttachment: jest.fn(),
      deleteAttachment: mockDeleteAttachment,
    }));
    
    // Mock window.confirm to always return true
    window.confirm = jest.fn(() => true);
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    // Click the delete button for the first attachment
    await userEvent.click(screen.getAllByLabelText(/delete/i)[0]);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteAttachment).toHaveBeenCalledWith('attachment-1');
  });

  it('does not call deleteAttachment when delete is canceled', async () => {
    const mockDeleteAttachment = jest.fn().mockResolvedValue({});
    require('../../hooks/useTaskAttachments').useTaskAttachments.mockImplementationOnce(() => ({
      attachments: mockAttachments,
      isLoading: false,
      isError: false,
      uploadAttachment: jest.fn(),
      downloadAttachment: jest.fn(),
      deleteAttachment: mockDeleteAttachment,
    }));
    
    // Mock window.confirm to return false (cancel)
    window.confirm = jest.fn(() => false);
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    // Click the delete button for the first attachment
    await userEvent.click(screen.getAllByLabelText(/delete/i)[0]);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(mockDeleteAttachment).not.toHaveBeenCalled();
  });

  it('calls uploadAttachment when files are dropped', async () => {
    const mockUploadAttachment = jest.fn().mockResolvedValue({});
    require('../../hooks/useTaskAttachments').useTaskAttachments.mockImplementationOnce(() => ({
      attachments: mockAttachments,
      isLoading: false,
      isError: false,
      uploadAttachment: mockUploadAttachment,
      downloadAttachment: jest.fn(),
      deleteAttachment: jest.fn(),
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    // Create a mock file
    const file = new File(['file content'], 'test-file.txt', { type: 'text/plain' });
    
    // Simulate a drop event
    const dropZone = screen.getByTestId('drop-zone');
    
    await userEvent.upload(dropZone, file);
    
    expect(mockUploadAttachment).toHaveBeenCalledWith(
      expect.objectContaining({
        taskId: 'task-1',
        file,
      })
    );
  });

  it('shows upload progress when files are being uploaded', () => {
    // Override the mock to simulate upload in progress
    require('../../hooks/useTaskAttachments').useTaskAttachments.mockImplementationOnce(() => ({
      attachments: mockAttachments,
      isLoading: false,
      isError: false,
      uploadAttachment: jest.fn(),
      downloadAttachment: jest.fn(),
      deleteAttachment: jest.fn(),
      uploadProgress: {
        'new-file.txt': 50, // 50% progress
      },
    }));
    
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments task={mockTask} />
      </QueryClientProvider>
    );
    
    // Check if progress indicator is displayed
    expect(screen.getByText('new-file.txt')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    
    const progressBar = screen.getByTestId('upload-progress-bar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });
});
