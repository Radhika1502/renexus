import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskAttachments } from '../TaskAttachments';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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

// Sample attachments data for testing
const mockAttachments = [
  {
    id: 'attachment-1',
    name: 'design-mockup.png',
    type: 'image/png',
    size: 1024000, // 1MB
    createdAt: '2025-06-20T10:00:00Z',
    createdBy: {
      id: 'user-1',
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?u=john',
    },
  },
  {
    id: 'attachment-2',
    name: 'requirements.pdf',
    type: 'application/pdf',
    size: 512000, // 500KB
    createdAt: '2025-06-21T14:30:00Z',
    createdBy: {
      id: 'user-2',
      name: 'Jane Smith',
      avatar: 'https://i.pravatar.cc/150?u=jane',
    },
  },
  {
    id: 'attachment-3',
    name: 'implementation-notes.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 256000, // 250KB
    createdAt: '2025-06-22T09:15:00Z',
    createdBy: {
      id: 'user-1',
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?u=john',
    },
  },
];

describe('TaskAttachments Component', () => {
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

  it('renders the list of attachments correctly', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TaskAttachments taskId="task-1" />
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
        <TaskAttachments taskId="task-1" />
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
        <TaskAttachments taskId="task-1" />
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
        <TaskAttachments taskId="task-1" />
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
        <TaskAttachments taskId="task-1" />
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
        <TaskAttachments taskId="task-1" />
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
        <TaskAttachments taskId="task-1" />
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
        <TaskAttachments taskId="task-1" />
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
        <TaskAttachments taskId="task-1" />
      </QueryClientProvider>
    );
    
    // Check if progress indicator is displayed
    expect(screen.getByText('new-file.txt')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    
    const progressBar = screen.getByTestId('upload-progress-bar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });
});
